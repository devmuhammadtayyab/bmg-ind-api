import fs from 'fs';
import moment from 'moment';
import pdf from 'html-pdf';

import {
  AssemblyItemCogs,
  BoxItems,
  Boxes,
  InventoryImages,
  InventoryItemCogs,
  NoBoxItems,
  Shipment
} from '../../models';

import { BOX_TYPE } from '../utils/constants';
import {
  generateReplicaSkus,
  getReplicaSku
} from '../utils/helpers';

const matchesNoBoxSku = (sku, noBoxSkus) => (
  noBoxSkus.has(sku) || noBoxSkus.has(getReplicaSku(sku))
);

const skusMatch = (skuA, skuB) => {
  if (!skuA || !skuB) return false;
  if (skuA === skuB) return true;
  return getReplicaSku(skuA) === getReplicaSku(skuB);
};

const mergeBoxItemsForSku = ({
  sellerSku,
  lineItemIndex,
  existingBoxItems = [],
  allBoxItems = []
}) => {
  const byKey = new Map();

  const add = (bi) => {
    if (!bi?.boxId || !(Number(bi.quantityInBox) > 0)) return;
    if (bi.sellerSku && sellerSku && !skusMatch(bi.sellerSku, sellerSku)) return;
    if (
      typeof lineItemIndex === 'number'
      && typeof bi.lineItemIndex === 'number'
      && bi.lineItemIndex !== lineItemIndex
    ) {
      return;
    }

    const key = `${bi.boxId}_${bi.type || ''}`;
    if (!byKey.has(key)) {
      byKey.set(key, bi);
    }
  };

  existingBoxItems.forEach(add);
  allBoxItems.forEach(add);

  return [...byKey.values()];
};

const hasRealBoxDimensions = (boxes = []) => boxes.some((b) => {
  const { length = 0, width = 0, height = 0 } = b.dimensions || {};
  return length > 0 || width > 0 || height > 0;
});

const generatePackingSlipHTML = ({
  box,
  items,
  inventoryImagesAndDimensions,
  orderNumber,
  orderDate,
  shipDate,
  name,
  company,
  line1,
  city,
  state,
  postalCode,
  countryCode,
  username,
  subTotal,
  shipping,
  total,
  socNumber
}) => {
  let content = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Packing Slip</title>
    <style>
      body { 
        padding: 0;
        font-family: sans-serif;
        font-size: 10px;
        line-height: 1.2;
        color: #333;
        box-sizing: border-box;
      }

      .header {
        margin: 10px 0;
      }
      .header p {
        margin: 5px 0;
        font-size: 10px;
      }

      .sub-header {
        overflow: hidden;
        margin-bottom: 10px;
      }

      .sub-header-item {
        float: left;
      }
      .sub-header-item h6 {
        display: inline-block;
        margin: 0 5px 0 0;
        font-weight: bold;
        font-size: 10px;
        vertical-align: top;
      }
      .next-head {
        display: inline-block;
      }
      .next-head p {
        margin: 0 0 3px 0;
        font-size: 10px;
        line-height: 1.3;
      }

      .sub-header-item-right {
        float: right;
        text-align: right;
        margin-top: 0;
      }
      .next-head-right {
        margin-bottom: 2px;
        text-align: right;
        white-space: nowrap;
      }
      .next-head-right h6 {
        display: inline-block;
        margin: 0;
        padding: 0 5px 0 0;
        border-right: 1px solid #ccc;
        min-width: 100px;
        text-align: right;
        font-weight: 600;
        font-size: 10px;
        color: #333;
      }
      .next-head-right p {
        display: inline-block;
        margin: 0 0 0 8px;
        padding: 0;
        font-size: 10px;
        min-width: 100px;
        text-align: left;
        color: #333;
      }
      .next-head-right:last-child {
        margin-bottom: 0;
      }
      .next-head-right h6:after {
        content: '';
        margin-right: 8px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0;
        border-spacing: 0;
      }
      th {
        background-color: #808080;
        color: white;
        text-align: left;
        padding: 2px 4px;
        font-weight: bold !important;
        border: 1px solid #808080;
        line-height: 1.2;
      }
      thead th {
        background-color: #808080 !important;
        color: white !important;
        font-weight: bold !important;
      }
      tr {
        line-height: 1;
      }
      td {
        padding: 1px 1px;
        border-bottom: 1px solid #ddd;
        vertical-align: middle;
        width: auto;
        line-height: 1;
      }
      td, th {
        font-size: 10px;
        padding-top: 0;
        padding-bottom: 0;
      }
      th {
        padding: 2px 2px;
      }

      .footer-overlay {
        float: right;
        width: 130px;
        margin-bottom: 20px;
      }
      .footer-wrapper {
        overflow: hidden;
        margin-bottom: 2px;
      }
      .footer-wrapper label {
        float: left;
        width: 70px;
        font-weight: 600;
        font-size: 11px;
      }
      .footer-wrapper p {
        float: right;
        margin: 0;
      }

      .clearfix:after {
        content: "";
        display: table;
        clear: both;
      }
    </style>
  </head>
  <body style="font-family: sans-serif; padding: 0; box-sizing: border-box; font-size: smaller;">
    <p style="background-color: grey;padding:3px; text-align: center; color: #fff; font-weight: 600;font-size:11px">Packing Slip</p>
    <div class="header">
      <p>8063 North Fraser Way</p>
      <p>Burnaby, BC V5J5M8</p>
    </div>
    <div class="sub-header">
      <div class="sub-header-item">
        <h6>Ship To:</h6>
        <div class="next-head">
          <p>${name}</p>
          <p>${company}</p>
          <p>${line1}</p>
          <p>${city}, ${state} ${postalCode} ${countryCode}</p>
        </div>
      </div>
      <div class="sub-header-item-right">
        <div class="next-head-right">
          <h6>Order #</h6>
          <p>${orderNumber}</p>
        </div>
        <div class="next-head-right">
          <h6>SOC #</h6>
          <p>${socNumber}</p>
        </div>
        <div class="next-head-right">
          <h6>Date</h6>
          <p>${moment(orderDate).format('DD/MM/YYYY')}</p>
        </div>
        <div class="next-head-right">
          <h6>User </h6>
          <p>${username || ''}</p>
        </div>
        <div class="next-head-right">
          <h6>Ship Date </h6>
          <p>${shipDate ? moment(shipDate).format('DD/MM/YYYY') : ''}</p>
        </div>
      </div>
    </div>
    <div>  
      <table style="border: 1px solid; width: 100%; border-collapse: collapse;">
        <thead style="background-color: grey;">
          <tr>
            <th style="border-width:0px;text-align: left; padding: 4px; color: #fff;">Item</th>
            <th style="border-width:0px;text-align: left; padding: 4px; color: #fff;">Image</th>
            <th style="border-width:0px;text-align: left; padding: 4px; color: #fff;">Description</th>
            <th style="border-width:0px;text-align: left; padding: 4px; color: #fff;">Price</th>
            <th style="border-width:0px;text-align: left; padding: 4px; color: #fff;">Qty</th>
            <th style="border-width:0px;text-align: left; padding: 4px; color: #fff;">Qty in Box</th>
            <th style="border-width:0px;text-align: left; padding: 4px; color: #fff;">Ext. Price</th>
          </tr>
        </thead>
        <tbody>`;

  function extractBoxIdNumber(boxId) {
    const parts = boxId.split('-');
    return parseInt(parts[1], 10);
  }

  const shipstationBoxes = box
    .filter((b) => b.type !== BOX_TYPE.CUSTOM)
    .sort((a, b) => extractBoxIdNumber(a.boxId) - extractBoxIdNumber(b.boxId));

  const customBoxes = box
    .filter((b) => b.type === BOX_TYPE.CUSTOM)
    .sort((a, b) => extractBoxIdNumber(a.boxId) - extractBoxIdNumber(b.boxId));

  const allSortedBoxes = [...shipstationBoxes, ...customBoxes];

  const boxNumberMap = {};
  allSortedBoxes.forEach((b, index) => {
    const key = `${b.boxId}_${b.type}`;
    boxNumberMap[key] = index + 1;
  });

  const isNoBoxSlip = allSortedBoxes.length === 0;

  const newItems = items.map((item) => {
    const {
      boxItems,
      ...rest
    } = item;
      const newBoxItems = boxItems.map(({ quantityInBox, boxId, type }) => {
      const boxNumber = boxNumberMap[`${boxId}_${type}`];

      return {
        boxNumber,
        quantityInBox
      };
    });

    newBoxItems.sort((a, b) => a.boxNumber - b.boxNumber);

    return {
      ...rest,
      boxItems: newBoxItems
    };
  });

  newItems.sort((a, b) => {
    const aMinBox = a.boxItems.length > 0
      ? Math.min(...a.boxItems.map((bi) => bi.boxNumber))
      : Infinity;
    const bMinBox = b.boxItems.length > 0
      ? Math.min(...b.boxItems.map((bi) => bi.boxNumber))
      : Infinity;
    return aMinBox - bMinBox;
  });

  newItems.forEach((item) => {
    const bx = item.boxItems;
    const boxItemsHtml = bx.length === 0
      ? 'N/A'
      : bx.map((b) => (
        isNoBoxSlip
          ? `<p>Box 1: ${b.quantityInBox}</p>`
          : `<p>Box ${b.boxNumber}: ${b.quantityInBox}</p>`
      )).join('');

    const replicaSku = getReplicaSku(item.sellerSku);
    const iImage = inventoryImagesAndDimensions.find((p) => (p.shipStationSku === replicaSku));
    const imageUrl = iImage?.imageUrl || 'https://bmg-ind.s3.us-west-2.amazonaws.com/no-image.png';

    content += `<tr>
      <td class="item-td" style="text-align: left; border-bottom: 1px solid grey; padding: 4px;">${item.sellerSku}</td>
      <td class="image-td" style="text-align: left; border-bottom: 1px solid grey; padding: 4px;">
        <image src=${imageUrl} width=40 height=40 />
      </td>
      <td class="title-td" style="text-align: left; border-bottom: 1px solid grey; padding: 4px; width:180px">${item.name}</td>
      <td style="text-align: left; border-bottom: 1px solid grey; padding: 4px;">$${item.unitPrice}</td>
      <td style="text-align: left; border-bottom: 1px solid grey; padding: 4px;">${item.quantity}</td>
      <td style="text-align: left; border-bottom: 1px solid grey; padding: 4px;">
        <div class="text-wrapper">
          ${boxItemsHtml}
        </div>
      </td>
      <td style="text-align: left; border-bottom: 1px solid grey; padding: 4px;">$${item.totalPrice}</td>
    </tr>`;
  });

  content += `</tbody>
        </table>
        <div class="footer-overlay">
          <div class="footer-wrapper">
            <label>Sub Total:</label>
            <p>$${subTotal.toFixed(2)}</p>
          </div>
          <div class="footer-wrapper">
            <label>Shipping:</label>
            <p>$${shipping.toFixed(2)}</p>
          </div>
          <div class="footer-wrapper">
            <label>Total:</label>
            <p>$${total.toFixed(2)}</p>
          </div>
        </div>
      </div>`;

  if (hasRealBoxDimensions(allSortedBoxes)) {
    content += `<div style="page-break-inside: avoid; break-inside: avoid; margin-top: 44px; padding-top: 32px;">
      <table style="border: 1px solid; width: 100%; border-collapse: collapse;">
        <thead style="background-color: grey;">
          <tr>
            <th style="border-width:0px;text-align: left; padding: 4px; color: #fff;">Box Number</th>
            <th style="border-width:0px;text-align: left; padding: 4px; color: #fff;">Length(in)</th>
            <th style="border-width:0px;text-align: left; padding: 4px; color: #fff;">Width(in)</th>
            <th style="border-width:0px;text-align: left; padding: 4px; color: #fff;">Height(in)</th>
            <th style="border-width:0px;text-align: left; padding: 4px; color: #fff;">Weight(lbs)</th>
          </tr>
        </thead>
        <tbody>`;

    allSortedBoxes.forEach((b) => {
      const { dimensions, boxId, type } = b;
      const boxNumber = boxNumberMap[`${boxId}_${type}`];

      const allSkusOfBox = items
        .flatMap((item) => item.boxItems || [])
        .filter((boxItem) => boxItem.boxId === boxId)
        .map((i) => ({ sellerSku: i.sellerSku, quantityInBox: i.quantityInBox }));

      const totalWeight = allSkusOfBox.reduce((sum, s) => {
        const product = inventoryImagesAndDimensions.find((p) => p.sellerSku === s.sellerSku);
        const weight = (product?.dimensions?.weight || 0) * s.quantityInBox;
        return sum + weight;
      }, 0);

      content += `<tr>
      <td style="text-align: left; border-bottom: 1px solid grey; padding: 4px;">${boxNumber}</td>
      <td style="text-align: left; border-bottom: 1px solid grey; padding: 4px;">${dimensions.length}</td>
      <td style="text-align: left; border-bottom: 1px solid grey; padding: 4px;">${dimensions.width}</td>
      <td style="text-align: left; border-bottom: 1px solid grey; padding: 4px;">${dimensions.height}</td>
      <td style="text-align: left; border-bottom: 1px solid grey; padding: 4px;">${totalWeight}</td>
    </tr>`;
    });

    content += `</tbody>
      </table>
    </div>`;
  }

  content += `
  </body>
  </html>
  `;

  return content;
};

const GeneratePdf = (htmlContent, pdfDownloadPath) => new Promise((resolve, reject) => {
  pdf.create(htmlContent, {
    format: 'Letter',
    border: '10mm',
    type: 'pdf'
  }).toFile(pdfDownloadPath, (err, res) => {
    if (err) {
      reject(err);
    } else {
      resolve(res.filename);
    }
  });
});

const DownloadBoxDetails = async ({ orderId }) => {
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
        sellerSku: '$shipmentItems.sku',
        lineItemIndex: '$lineItemIndex'
      },
      pipeline: [{
        $match: {
          $expr: {
            $and: [{
              $eq: ['$boxId', '$$boxId']
            }, {
              $eq: ['$sellerSku', '$$sellerSku']
            }, {
              $or: [{
                $eq: ['$lineItemIndex', '$$lineItemIndex']
              }, {
                $not: [{ $isNumber: '$lineItemIndex' }]
              }]
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

  let boxesData = boxes;
  const orderBoxes = await Boxes.find({ orderId }).lean();
  const boxIds = orderBoxes.map(({ boxId }) => boxId);
  const allBoxItems = boxIds.length
    ? await BoxItems.find({ boxId: { $in: boxIds } }).lean()
    : [];

  if (boxesData.length) {
    // Rematch box items with replica SKU so ABC vs ABC-FBM / ABC-PK still links
    boxesData = boxesData.map((item) => {
      const sellerSku = (item._id && typeof item._id === 'object')
        ? (item._id.sku ?? '')
        : (item._id ?? '');
      const lineItemIndex = (item._id && typeof item._id === 'object')
        ? item._id.lineItemIndex
        : undefined;

      return {
        ...item,
        boxItems: mergeBoxItemsForSku({
          sellerSku,
          lineItemIndex,
          existingBoxItems: item.boxItems,
          allBoxItems
        })
      };
    });
  } else {
    const noBoxItems = await NoBoxItems.find({ orderId }).lean();
    const shipment = await Shipment.findOne({ orderId }).lean();

    if (shipment?.shipmentItems?.length && noBoxItems.length) {
      const noBoxSkus = new Set(noBoxItems.map((item) => item.sellerSku));

      boxesData = shipment.shipmentItems.map((item) => ({
        _id: item.sku,
        name: item.name,
        amountSummary: shipment.amountSummary,
        soldTo: shipment.soldTo,
        shipTos: shipment.shipTos,
        orderNumber: shipment.orderNumber,
        orderDate: shipment.orderDate,
        shipDate: shipment.shipDate,
        quantity: item.quantity,
        box: [],
        boxItems: matchesNoBoxSku(item.sku, noBoxSkus)
          ? [{ boxNumber: 1, quantityInBox: item.quantity }]
          : [],
        unitPrice: item.unitPrice?.value ?? 0,
        totalPrice: item.totalPrice?.value ?? 0,
        socNumber: shipment.socNumber
      }));
    }
  }

  let pdfDownloadPath = '';
  if (boxesData.length) {
    const [{
      orderNumber,
      orderDate,
      shipDate,
      amountSummary,
      soldTo,
      shipTos,
      box,
      socNumber
    }] = boxesData;
    const { orderTotal, shippingPaid, totalPaid } = amountSummary || {};
    const { username } = soldTo || {};
    const {
      name,
      company,
      line1,
      city,
      state,
      postalCode,
      countryCode
    } = shipTos || {};

    if (!fs.existsSync('pdf_files')) {
      fs.mkdirSync('pdf_files');
    }

    pdfDownloadPath = `pdf_files/Packing Slip_${orderNumber}.pdf`;

    let allSkus = [];
    const items = boxesData.map((item) => {
      const {
        name: itemName,
        unitPrice,
        quantity,
        totalPrice,
        boxItems
      } = item;

      const sellerSku = (item._id && typeof item._id === 'object')
        ? (item._id.sku ?? '')
        : (item._id ?? '');
      const validBoxItems = (boxItems || []).filter(
        (entry) => entry?.boxId || entry?.boxNumber != null
      );
      const type = validBoxItems.length > 0 ? validBoxItems[0].type : null;

      allSkus.push(sellerSku);

      return {
        sellerSku,
        name: itemName,
        unitPrice,
        quantity,
        totalPrice,
        boxItems: validBoxItems,
        type
      };
    });

    items.sort((a, b) => {
      if (!a.type && b.type) return 1;
      if (a.type && !b.type) return -1;
      if (!a.type && !b.type) return 0;

      if (a.type === BOX_TYPE.CUSTOM && b.type !== BOX_TYPE.CUSTOM) return 1;
      if (a.type !== BOX_TYPE.CUSTOM && b.type === BOX_TYPE.CUSTOM) return -1;

      return 0;
    });

    allSkus = generateReplicaSkus(allSkus);
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

    const inventoryImagesAndDimensions = inventoryImagesAndDimensionsData.filter(Boolean);

    const htmlContent = generatePackingSlipHTML({
      box,
      items,
      inventoryImagesAndDimensions,
      orderNumber,
      orderDate,
      shipDate,
      name,
      company,
      line1,
      city,
      state,
      postalCode,
      countryCode,
      username,
      subTotal: orderTotal?.value ?? 0,
      shipping: shippingPaid?.value ?? 0,
      total: totalPaid?.value ?? 0,
      socNumber: socNumber || ''
    });
    await GeneratePdf(htmlContent, pdfDownloadPath);
  }

  return { pdfDownloadPath };
};

export default DownloadBoxDetails;
