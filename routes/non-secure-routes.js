import express from 'express';
import path from 'path';
import fs from 'fs';

import {
  AddCustomBox,
  DeleteBoxes,
  DownloadBoxDetails,
  GetBoxItems,
  GetBoxes,
  GetNoBoxItems,
  ResetQuantityInBox,
  SaveBoxItems,
  SaveBoxes,
  SaveNoBoxItems
} from '../controllers/boxes';
import { GetProductDimensions } from '../controllers/product';
import {
  CreateShipment, GetShipmentConfig, SaveShipmentConfig, SaveShipmentDetails
} from '../controllers/shipments';

import {
  CatchResponse,
  SendMsgOnSlack,
  SuccessResponse
} from './utils/helpers';
import { API_ENDPOINTS } from './utils/constants';

const router = express.Router();

router.post(API_ENDPOINTS.NON_SECURED_ROUTES.ADD_CUSTOM_BOX, async (req, res) => {
  let userId;
  try {
    const {
      orderId,
      orderNumber,
      length,
      width,
      height,
      weight
    } = req.body;

    const { message } = await AddCustomBox({
      orderId,
      orderNumber,
      length,
      width,
      height,
      weight
    });

    SuccessResponse({
      res,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.NON_SECURED_ROUTES.ADD_CUSTOM_BOX,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.post(API_ENDPOINTS.NON_SECURED_ROUTES.CREATE_SHIPMENT, async (req, res) => {
  let userId;
  try {
    const {
      orderNumber,
      requestedPickupDate
    } = req.body;

    const { message } = await CreateShipment({
      orderNumber,
      requestedPickupDate
    });

    SuccessResponse({
      res,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.NON_SECURED_ROUTES.CREATE_SHIPMENT,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.delete(API_ENDPOINTS.NON_SECURED_ROUTES.DELETE_BOXES, async (req, res) => {
  let userId;
  try {
    const { boxIds, type } = req.query;

    const { message } = await DeleteBoxes({ boxIds, type });

    SuccessResponse({
      res,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.NON_SECURED_ROUTES.DELETE_BOXES,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.get(API_ENDPOINTS.NON_SECURED_ROUTES.DOWNLOAD_BOX_DETAILS, async (req, res) => {
  let userId;
  try {
    const { orderId } = req.query;

    const { pdfDownloadPath } = await DownloadBoxDetails({ orderId });

    if (!pdfDownloadPath) {
      return res
        .status(404)
        .send(`
      <html>
        <head>
          <title>Packing Slip Not Found</title>
        </head>
        <body style="font-family: Arial; padding: 30px;">
          <h1 style="color: red;">Packing Slip Not Found</h1>
          <p>The packing slip for this order could not be located because shipment order is not found.</p>
        </body>
      </html>
    `);
    }

    res.setHeader('Content-disposition', `inline; filename=${path.basename(pdfDownloadPath)}`);
    res.setHeader('Content-type', 'application/pdf');

    const fileStream = fs.createReadStream(pdfDownloadPath);
    fileStream.pipe(res);

    fileStream.on('close', () => {
      fs.rmSync(pdfDownloadPath);
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.NON_SECURED_ROUTES.DOWNLOAD_BOX_DETAILS,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.get(API_ENDPOINTS.NON_SECURED_ROUTES.GET_BOX_ITEMS, async (req, res) => {
  let userId;
  try {
    const { orderId } = req.query;

    const { boxItems, message } = await GetBoxItems({ orderId });

    SuccessResponse({
      res,
      boxItems,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.NON_SECURED_ROUTES.GET_BOX_ITEMS,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.get(API_ENDPOINTS.NON_SECURED_ROUTES.GET_BOXES, async (req, res) => {
  let userId;
  try {
    const { orderId } = req.query;

    const { boxes, message } = await GetBoxes({ orderId });

    SuccessResponse({
      res,
      boxes,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.NON_SECURED_ROUTES.GET_BOXES,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.get(API_ENDPOINTS.NON_SECURED_ROUTES.GET_NO_BOXES, async (req, res) => {
  let userId;
  try {
    const { orderId } = req.query;

    const { noBoxItems, message } = await GetNoBoxItems({ orderId });

    SuccessResponse({
      res,
      noBoxItems,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.NON_SECURED_ROUTES.GET_NO_BOXES,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.get(API_ENDPOINTS.NON_SECURED_ROUTES.GET_PRODUCT_DIMENSIONS, async (req, res) => {
  let userId;
  try {
    const { sellerSkus } = req.query;

    const { productsWithDimensions } = await GetProductDimensions({ sellerSkus });

    SuccessResponse({
      res,
      productsWithDimensions
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.NON_SECURED_ROUTES.GET_PRODUCT_DIMENSIONS,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.get(API_ENDPOINTS.NON_SECURED_ROUTES.GET_SHIPMENT_CONFIG, async (req, res) => {
  let userId;
  try {
    const { fulfillmentPlanId } = req.query;

    const { message, shipmentConfig } = await GetShipmentConfig({ fulfillmentPlanId });

    SuccessResponse({
      res,
      message,
      shipmentConfig
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.NON_SECURED_ROUTES.GET_SHIPMENT_CONFIG,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.post(API_ENDPOINTS.NON_SECURED_ROUTES.RESET_QUANTITY_IN_BOX, async (req, res) => {
  let userId;
  try {
    const {
      boxId,
      type,
      sellerSku,
      lineItemIndex
    } = req.body;

    const { message } = await ResetQuantityInBox({
      boxId,
      type,
      sellerSku,
      lineItemIndex
    });

    SuccessResponse({
      res,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.NON_SECURED_ROUTES.RESET_QUANTITY_IN_BOX,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.post(API_ENDPOINTS.NON_SECURED_ROUTES.SAVE_BOX_ITEMS, async (req, res) => {
  let userId;
  try {
    const {
      boxId,
      type,
      sellerSku,
      lineItemIndex,
      quantityInBox
    } = req.body;

    const { message } = await SaveBoxItems({
      boxId,
      type,
      sellerSku,
      lineItemIndex,
      quantityInBox
    });

    SuccessResponse({
      res,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.NON_SECURED_ROUTES.SAVE_BOX_ITEMS,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.post(API_ENDPOINTS.NON_SECURED_ROUTES.SAVE_BOXES, async (req, res) => {
  let userId;
  try {
    const { boxDetails } = req.body;

    const { message } = await SaveBoxes({ boxDetails });

    SuccessResponse({
      res,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.NON_SECURED_ROUTES.SAVE_BOXES,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.post(API_ENDPOINTS.NON_SECURED_ROUTES.SAVE_NO_BOX_ITEMS, async (req, res) => {
  let userId;
  try {
    const {
      orderId,
      sellerSku,
      needToSave
    } = req.body;

    const { message } = await SaveNoBoxItems({
      orderId,
      sellerSku,
      needToSave
    });

    SuccessResponse({
      res,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.NON_SECURED_ROUTES.SAVE_NO_BOX_ITEMS,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.post(API_ENDPOINTS.NON_SECURED_ROUTES.SAVE_SHIPMENT_CONFIG, async (req, res) => {
  let userId;
  try {
    const {
      fulfillmentPlanId,
      ...rest
    } = req.body;

    const { message } = await SaveShipmentConfig({
      fulfillmentPlanId,
      ...rest
    });

    SuccessResponse({
      res,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.NON_SECURED_ROUTES.SAVE_SHIPMENT_CONFIG,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.post(API_ENDPOINTS.NON_SECURED_ROUTES.SAVE_SHIPMENT_DETAILS, async (req, res) => {
  let userId;
  try {
    const {
      orderId,
      orderNumber,
      fulfillmentPlanId,
      orderDate,
      shipDate,
      shipmentItems,
      soldTo,
      shipTos,
      amountSummary,
      socNumber
    } = req.body;

    const { message } = await SaveShipmentDetails({
      orderId,
      orderNumber,
      fulfillmentPlanId,
      orderDate,
      shipDate,
      shipmentItems,
      soldTo,
      shipTos,
      amountSummary,
      socNumber
    });

    SuccessResponse({
      res,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.NON_SECURED_ROUTES.SAVE_SHIPMENT_DETAILS,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

export default router;
