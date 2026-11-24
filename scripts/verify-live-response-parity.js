/* eslint-disable no-console, import/no-extraneous-dependencies */
import 'dotenv/config';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import {
  AssemblyItemCogs,
  Boxes,
  BoxItems,
  InventoryImages,
  InventoryItemCogs,
  NoBoxItems,
  Shipment
} from '../models';
import GetBoxItems from '../controllers/boxes/get-box-items';
import GetBoxes from '../controllers/boxes/get-boxes';
import { getPackingSlipGroupedData } from '../controllers/boxes/packing-slip-data';
import { getProductsWithDimensions } from '../controllers/utils/get-products-with-dimensions';
import { generateReplicaSkus } from '../controllers/utils/helpers';

const DUMP_DIR = path.resolve(__dirname, '../../dump/bmg-ind');
const { deserialize } = mongoose.mongo.BSON;

const toPlain = (value) => JSON.parse(JSON.stringify(value));

const sortById = (rows = []) => [...rows].sort((a, b) => {
  const left = String(a?._id ?? '');
  const right = String(b?._id ?? '');
  return left.localeCompare(right);
});

const productSignature = (row) => ({
  shipStationSku: row.shipStationSku,
  sellerSku: row.sellerSku,
  netSuiteId: String(row.netSuiteId ?? ''),
  imageUrl: row.imageUrl,
  dimensions: row.dimensions || null
});

const packingItemSignature = (row) => {
  const sellerSku = (row._id && typeof row._id === 'object')
    ? (row._id.sku ?? '')
    : (row._id ?? '');
  const boxItems = sortById((row.boxItems || []).filter(
    (entry) => entry?.boxId || entry?.boxNumber != null
  )).map((item) => ({
    boxId: item.boxId || null,
    type: item.type || null,
    sellerSku: item.sellerSku || null,
    quantityInBox: item.quantityInBox,
    boxNumber: item.boxNumber ?? null
  }));
  const boxes = sortById(row.box || []).map((box) => ({
    boxId: box.boxId,
    type: box.type,
    dimensions: box.dimensions || null
  }));

  return {
    sellerSku,
    name: row.name,
    quantity: row.quantity,
    unitPrice: row.unitPrice ?? null,
    totalPrice: row.totalPrice ?? null,
    socNumber: row.socNumber || '',
    orderNumber: row.orderNumber,
    boxItems,
    boxes
  };
};

const readBsonDocs = (filePath, { limit = Infinity, maxScan = Infinity, filter } = {}) => {
  const fd = fs.openSync(filePath, 'r');
  const docs = [];
  const sizeBuf = Buffer.alloc(4);
  let scanned = 0;

  try {
    while (docs.length < limit && scanned < maxScan) {
      const headerBytes = fs.readSync(fd, sizeBuf, 0, 4);
      if (headerBytes < 4) break;

      const size = sizeBuf.readInt32LE(0);
      if (size < 5) break;

      const docBuf = Buffer.alloc(size);
      sizeBuf.copy(docBuf, 0, 0, 4);
      const bodyBytes = fs.readSync(fd, docBuf, 4, size - 4);
      if (bodyBytes < size - 4) break;

      scanned += 1;
      const doc = deserialize(docBuf);
      if (!filter || filter(doc)) {
        docs.push(doc);
      }
    }
  } finally {
    fs.closeSync(fd);
  }

  return docs;
};

const insertIfPresent = async (Model, docs) => {
  if (!docs.length) return 0;
  await Model.insertMany(docs, { ordered: false });
  return docs.length;
};

const seedFromDump = async () => {
  if (!fs.existsSync(DUMP_DIR)) {
    throw new Error(`Dump directory not found at ${DUMP_DIR}`);
  }

  console.log('Seeding in-memory Mongo from dump sample...');

  const images = readBsonDocs(path.join(DUMP_DIR, 'inventoryImages.bson'), { limit: 400 });
  const netSuiteIds = new Set(images.map((doc) => doc.netSuiteId).filter(Boolean));

  const assemblyDocs = readBsonDocs(path.join(DUMP_DIR, 'assemblyItemCogs.bson'), {
    limit: 80,
    maxScan: 4000,
    filter: (doc) => doc.sellerSku && (!netSuiteIds.size || netSuiteIds.has(doc.netSuiteId))
  });
  const inventoryDocs = readBsonDocs(path.join(DUMP_DIR, 'inventoryItemCogs.bson'), {
    limit: 80,
    maxScan: 8000,
    filter: (doc) => doc.sellerSku && (!netSuiteIds.size || netSuiteIds.has(doc.netSuiteId))
  });
  const shipments = readBsonDocs(path.join(DUMP_DIR, 'shipments.bson'), {
    limit: 12,
    filter: (doc) => doc.orderId && Array.isArray(doc.shipmentItems) && doc.shipmentItems.length
  });
  const orderIds = new Set(shipments.map((doc) => doc.orderId));
  const boxes = readBsonDocs(path.join(DUMP_DIR, 'boxes.bson'), {
    limit: 80,
    maxScan: 5000,
    filter: (doc) => orderIds.has(doc.orderId)
  });
  const boxIds = new Set(boxes.map((doc) => doc.boxId));
  const boxItems = readBsonDocs(path.join(DUMP_DIR, 'boxItems.bson'), {
    limit: 200,
    maxScan: 8000,
    filter: (doc) => boxIds.has(doc.boxId)
  });
  const noBoxItems = readBsonDocs(path.join(DUMP_DIR, 'noBoxItems.bson'), {
    limit: 40,
    filter: (doc) => orderIds.has(doc.orderId)
  });

  const counts = {
    inventoryImages: await insertIfPresent(InventoryImages, images),
    assemblyItemCogs: await insertIfPresent(AssemblyItemCogs, assemblyDocs),
    inventoryItemCogs: await insertIfPresent(InventoryItemCogs, inventoryDocs),
    shipments: await insertIfPresent(Shipment, shipments),
    boxes: await insertIfPresent(Boxes, boxes),
    boxItems: await insertIfPresent(BoxItems, boxItems),
    noBoxItems: await insertIfPresent(NoBoxItems, noBoxItems)
  };

  console.log('Seeded dump sample', counts);
  return {
    sellerSkus: [...new Set([
      ...assemblyDocs.map((doc) => doc.sellerSku),
      ...inventoryDocs.map((doc) => doc.sellerSku)
    ])].filter(Boolean),
    orderIds: [...orderIds]
  };
};

const connectDatabase = async () => {
  const configuredUrl = process.env.MONGO_URL;
  const isLocalhost = !configuredUrl
    || configuredUrl.includes('localhost')
    || configuredUrl.includes('127.0.0.1');

  if (configuredUrl && !isLocalhost) {
    await mongoose.connect(configuredUrl, { socketTimeoutMS: 60000 });
    return { mongod: null, seeded: null };
  }

  try {
    await mongoose.connect(configuredUrl || 'mongodb://127.0.0.1:27017', {
      serverSelectionTimeoutMS: 2000,
      socketTimeoutMS: 60000
    });
    return { mongod: null, seeded: null };
  } catch (err) {
    console.log('Local Mongo is not running, using in-memory Mongo + dump sample.');
  }

  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'bmg-ind-parity' });
  const seeded = await seedFromDump();
  return { mongod, seeded };
};

const getProductsWithDimensionsSequential = async (sellerSkus) => {
  const allSkus = generateReplicaSkus(sellerSkus);
  const inventoryImagesAndDimensionsData = await Promise.all(
    allSkus.map(async (sku) => {
      let netSuiteId;
      let shipStationSku;
      const assemblyItemCogs = await AssemblyItemCogs.findOne({ sellerSku: sku })
        .sort({ updatedAt: -1 });

      if (!assemblyItemCogs) {
        const inventoryItemCogs = await InventoryItemCogs.findOne({ sellerSku: sku })
          .sort({ updatedAt: -1 });

        if (!inventoryItemCogs) {
          return null;
        }

        ({ netSuiteId, sellerSku: shipStationSku } = inventoryItemCogs);
      } else {
        ({ netSuiteId, sellerSku: shipStationSku } = assemblyItemCogs);
      }

      const inventoryImage = await InventoryImages.findOne({
        netSuiteId
      }).sort({ updatedAt: -1 }).lean();

      if (!inventoryImage) {
        return null;
      }

      return {
        shipStationSku, ...inventoryImage
      };
    })
  );

  return inventoryImagesAndDimensionsData.filter(Boolean);
};

const getPackingSlipGroupedDataLegacy = async (orderId) => {
  const boxes = await Shipment.aggregate([{
    $match: {
      orderId
    }
  }, {
    $lookup: {
      from: 'boxes',
      localField: 'orderId',
      foreignField: 'orderId',
      as: 'box'
    }
  }, {
    $unwind: {
      path: '$box'
    }
  }, {
    $unwind: {
      path: '$shipmentItems',
      includeArrayIndex: 'lineItemIndex'
    }
  }, {
    $lookup: {
      from: 'boxItems',
      let: {
        boxId: '$box.boxId',
        sellerSku: '$shipmentItems.sku'
      },
      pipeline: [{
        $match: {
          $expr: {
            $and: [{
              $eq: ['$boxId', '$$boxId']
            }, {
              $eq: ['$sellerSku', '$$sellerSku']
            }]
          }
        }
      }],
      as: 'boxItems'
    }
  }, {
    $unwind: {
      path: '$boxItems',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $group: {
      _id: {
        sku: '$shipmentItems.sku',
        lineItemIndex: '$lineItemIndex'
      },
      name: {
        $first: '$shipmentItems.name'
      },
      amountSummary: {
        $first: '$amountSummary'
      },
      soldTo: {
        $first: '$soldTo'
      },
      shipTos: {
        $first: '$shipTos'
      },
      orderNumber: {
        $first: '$orderNumber'
      },
      orderDate: {
        $first: '$orderDate'
      },
      shipDate: {
        $first: '$shipDate'
      },
      quantity: {
        $first: '$shipmentItems.quantity'
      },
      box: {
        $addToSet: '$box'
      },
      boxItems: {
        $addToSet: '$boxItems'
      },
      unitPrice: {
        $first: '$shipmentItems.unitPrice.value'
      },
      totalPrice: {
        $first: '$shipmentItems.totalPrice.value'
      },
      socNumber: {
        $first: '$socNumber'
      }
    }
  }]);

  return boxes;
};

const compareProductDimensions = async (sellerSkus) => {
  const startedLegacy = Date.now();
  const legacy = await getProductsWithDimensionsSequential(sellerSkus);
  const legacyMs = Date.now() - startedLegacy;

  const startedOptimized = Date.now();
  const optimized = await getProductsWithDimensions(sellerSkus);
  const optimizedMs = Date.now() - startedOptimized;

  assert.deepStrictEqual(
    toPlain(legacy).map(productSignature),
    toPlain(optimized).map(productSignature)
  );

  return {
    skuCount: generateReplicaSkus(sellerSkus).length,
    matchCount: optimized.length,
    legacyMs,
    optimizedMs
  };
};

const comparePackingSlip = async (orderId) => {
  const startedLegacy = Date.now();
  const legacy = await getPackingSlipGroupedDataLegacy(orderId);
  const legacyMs = Date.now() - startedLegacy;

  const startedOptimized = Date.now();
  const optimized = await getPackingSlipGroupedData(orderId);
  const optimizedMs = Date.now() - startedOptimized;

  if (!legacy.length) {
    const optimizedNoBox = toPlain(optimized).map(packingItemSignature)
      .sort((a, b) => String(a.sellerSku).localeCompare(String(b.sellerSku)));
    return {
      orderId,
      skipped: !optimized.length,
      reason: optimized.length ? 'legacy empty, optimized used no-box path' : 'no packing data',
      itemCount: optimized.length,
      optimizedSignatureCount: optimizedNoBox.length,
      legacyMs,
      optimizedMs
    };
  }

  const legacySig = toPlain(legacy).map(packingItemSignature)
    .sort((a, b) => String(a.sellerSku).localeCompare(String(b.sellerSku)));
  const optimizedSig = toPlain(optimized).map(packingItemSignature)
    .sort((a, b) => String(a.sellerSku).localeCompare(String(b.sellerSku)));

  assert.deepStrictEqual(legacySig, optimizedSig);

  return {
    orderId,
    itemCount: optimized.length,
    legacyMs,
    optimizedMs
  };
};

const compareBoxReads = async (orderId) => {
  const [{ boxes }, { boxItems }] = await Promise.all([
    GetBoxes({ orderId }),
    GetBoxItems({ orderId })
  ]);

  const expectedBoxIds = (await Boxes.find({ orderId }).select({ boxId: 1 }).lean())
    .map(({ boxId }) => boxId);
  const expectedItems = expectedBoxIds.length
    ? await BoxItems.find({ boxId: { $in: expectedBoxIds } })
    : [];

  assert.strictEqual(boxes.length, expectedBoxIds.length);
  assert.strictEqual(boxItems.length, expectedItems.length);

  return {
    orderId,
    boxCount: boxes.length,
    boxItemCount: boxItems.length
  };
};

(async () => {
  const { mongod, seeded } = await connectDatabase();
  console.log('Connected to Mongo, running live before/after parity checks...\n');

  let sellerSkus = seeded?.sellerSkus || [];
  if (!sellerSkus.length) {
    const skuDocs = await AssemblyItemCogs.find({ sellerSku: { $exists: true, $ne: '' } })
      .sort({ updatedAt: -1 })
      .select({ sellerSku: 1 })
      .limit(40)
      .lean();
    const inventorySkuDocs = await InventoryItemCogs.find({ sellerSku: { $exists: true, $ne: '' } })
      .sort({ updatedAt: -1 })
      .select({ sellerSku: 1 })
      .limit(20)
      .lean();
    sellerSkus = [...new Set([
      ...skuDocs.map((doc) => doc.sellerSku),
      ...inventorySkuDocs.map((doc) => doc.sellerSku)
    ])];
  }

  if (!sellerSkus.length) {
    console.log('SKIP product dimensions: no SKUs found');
  } else {
    const productResult = await compareProductDimensions(sellerSkus);
    console.log('PASS /get-product-dimensions', productResult);
  }

  const shipments = await Shipment.find({ orderId: { $exists: true, $ne: '' } })
    .sort({ updatedAt: -1 })
    .select({ orderId: 1, shipmentItems: 1 })
    .limit(8)
    .lean();

  const orderIds = seeded?.orderIds?.length
    ? seeded.orderIds.slice(0, 8)
    : [...new Set(shipments.map((doc) => doc.orderId))];

  if (!orderIds.length) {
    console.log('SKIP packing slip / boxes: no shipments found');
  } else {
    await orderIds.reduce(async (previous, orderId) => {
      await previous;
      const boxRead = await compareBoxReads(orderId);
      console.log('PASS /get-boxes + /get-box-items', boxRead);

      const packing = await comparePackingSlip(orderId);
      console.log(packing.skipped ? 'SKIP packing-slip data' : 'PASS packing-slip data', packing);
    }, Promise.resolve());

    const shipmentSkus = shipments
      .flatMap((doc) => (doc.shipmentItems || []).map((item) => item.sku))
      .filter(Boolean)
      .slice(0, 25);

    if (shipmentSkus.length) {
      const extensionLike = await compareProductDimensions(shipmentSkus);
      console.log('PASS /get-product-dimensions (shipment SKUs)', extensionLike);
    }
  }

  console.log('\nLive response parity checks passed.');
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
})().catch(async (err) => {
  console.error('\nLive response parity checks FAILED');
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (disconnectErr) {
    console.error(disconnectErr);
  }
  process.exit(1);
});
