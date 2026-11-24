/* eslint-disable no-console, object-curly-newline */
import assert from 'assert';

import {
  mapProductsWithDimensions,
  pickLatestByKey
} from '../controllers/utils/get-products-with-dimensions';
import { generateReplicaSkus } from '../controllers/utils/helpers';
import {
  buildNoBoxPackingSlipItems,
  groupPackingSlipItems
} from '../controllers/boxes/packing-slip-data';

const run = (name, fn) => {
  fn();
  console.log(`PASS ${name}`);
};

run('generateReplicaSkus keeps a single SKU as one sku, not characters', () => {
  assert.deepStrictEqual(
    generateReplicaSkus('ABC-PK'),
    ['ABC-PK', 'ABC']
  );
});

run('generateReplicaSkus expands PK/FBM replicas and de-dupes', () => {
  assert.deepStrictEqual(
    generateReplicaSkus(['FOO-PK', 'FOO', 'BAR-FBM']),
    ['FOO-PK', 'FOO', 'BAR-FBM', 'BAR']
  );
});

run('pickLatestByKey keeps the first doc after updatedAt desc sort', () => {
  const docs = [
    { sellerSku: 'A', netSuiteId: 'new', updatedAt: new Date('2024-02-01') },
    { sellerSku: 'A', netSuiteId: 'old', updatedAt: new Date('2024-01-01') },
    { sellerSku: 'B', netSuiteId: 'b1', updatedAt: new Date('2024-03-01') }
  ];
  const latest = pickLatestByKey(docs, 'sellerSku');
  assert.strictEqual(latest.get('A').netSuiteId, 'new');
  assert.strictEqual(latest.get('B').netSuiteId, 'b1');
});

run('mapProductsWithDimensions prefers assembly COGS over inventory COGS', () => {
  const allSkus = ['SKU-A', 'SKU-B', 'SKU-C'];
  const latestAssemblyBySku = new Map([
    ['SKU-A', { sellerSku: 'SKU-A', netSuiteId: 'ns-a' }]
  ]);
  const latestInventoryBySku = new Map([
    ['SKU-A', { sellerSku: 'SKU-A', netSuiteId: 'ns-wrong' }],
    ['SKU-B', { sellerSku: 'SKU-B', netSuiteId: 'ns-b' }]
  ]);
  const latestImageByNetSuiteId = new Map([
    ['ns-a', { _id: 'img-a', sellerSku: 'SKU-A', imageUrl: 'a.png', dimensions: { weight: 1 } }],
    ['ns-b', { _id: 'img-b', sellerSku: 'SKU-B', imageUrl: 'b.png', dimensions: { weight: 2 } }]
  ]);

  const result = mapProductsWithDimensions({
    allSkus,
    latestAssemblyBySku,
    latestInventoryBySku,
    latestImageByNetSuiteId
  });

  assert.deepStrictEqual(result.map((row) => row.shipStationSku), ['SKU-A', 'SKU-B']);
  assert.strictEqual(result[0].imageUrl, 'a.png');
  assert.strictEqual(result[1].imageUrl, 'b.png');
});

run('groupPackingSlipItems matches sku to box items without cartesian duplicates', () => {
  const shipment = {
    shipmentItems: [
      { sku: 'AAA', name: 'Item A', quantity: 2, unitPrice: { value: 1 }, totalPrice: { value: 2 } },
      { sku: 'BBB', name: 'Item B', quantity: 1, unitPrice: { value: 3 }, totalPrice: { value: 3 } }
    ],
    amountSummary: { orderTotal: { value: 5 } },
    soldTo: { username: 'packer' },
    shipTos: { name: 'Ship To' },
    orderNumber: 'PO-1',
    orderDate: '2024-01-01',
    shipDate: '2024-01-02',
    socNumber: 'SOC-1'
  };
  const boxes = [
    { boxId: 'PO-1-1', type: 'shipstation', dimensions: { length: 1, width: 1, height: 1 } },
    { boxId: 'PO-1-2', type: 'custom', dimensions: { length: 2, width: 2, height: 2 } }
  ];
  const boxItems = [
    { boxId: 'PO-1-1', type: 'shipstation', sellerSku: 'AAA', quantityInBox: 2 },
    { boxId: 'PO-1-2', type: 'custom', sellerSku: 'BBB', quantityInBox: 1 }
  ];

  const grouped = groupPackingSlipItems({ shipment, boxes, boxItems });
  assert.strictEqual(grouped.length, 2);
  assert.deepStrictEqual(grouped[0]._id, { sku: 'AAA', lineItemIndex: 0 });
  assert.strictEqual(grouped[0].boxItems.length, 1);
  assert.strictEqual(grouped[0].boxItems[0].quantityInBox, 2);
  assert.strictEqual(grouped[1].boxItems[0].boxId, 'PO-1-2');
  assert.strictEqual(grouped[0].box.length, 2);
  assert.strictEqual(grouped[0].unitPrice, 1);
});

run('buildNoBoxPackingSlipItems only fills qty for marked SKUs', () => {
  const shipment = {
    shipmentItems: [
      { sku: 'AAA-PK', name: 'A', quantity: 4, unitPrice: { value: 1 }, totalPrice: { value: 4 } },
      { sku: 'BBB', name: 'B', quantity: 1, unitPrice: { value: 2 }, totalPrice: { value: 2 } }
    ],
    amountSummary: {},
    soldTo: {},
    shipTos: {},
    orderNumber: 'PO-2',
    socNumber: ''
  };
  const rows = buildNoBoxPackingSlipItems({
    shipment,
    noBoxItems: [{ sellerSku: 'AAA' }]
  });

  assert.strictEqual(rows[0].boxItems[0].quantityInBox, 4);
  assert.deepStrictEqual(rows[1].boxItems, []);
});

console.log('\nAll unit parity tests passed.');
