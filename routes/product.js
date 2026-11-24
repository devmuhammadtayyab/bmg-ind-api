import express from 'express';

import {
  UploadFbaHandlingCost,
  UploadFbmShippingCost,
  UploadShipToFbaCost
} from '../controllers/product';

import { API_ENDPOINTS, HTTP_CODES } from './utils/constants';
import {
  CatchResponse,
  SendMsgOnSlack,
  SuccessResponse
} from './utils/helpers';

const router = express.Router();

router.get(API_ENDPOINTS.PRODUCT.UPLOAD_FBA_HANDLING_COST, async (req, res) => {
  const {
    user: {
      _id: userId = ''
    } = {}
  } = req;

  try {
    const {
      fileName
    } = req.query;

    if (!fileName) {
      const err = new Error();
      err.statusCode = HTTP_CODES.BAD_REQUEST;
      err.error = 'File Name is Required';
      err.message = 'File Name is Required';

      throw err;
    }

    const { message } = await UploadFbaHandlingCost({
      userId,
      fileName
    });

    SuccessResponse({
      res,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.PRODUCT.UPLOAD_FBA_HANDLING_COST,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.get(API_ENDPOINTS.PRODUCT.UPLOAD_FBM_SHIPPING_COST, async (req, res) => {
  const {
    user: {
      _id: userId = ''
    } = {}
  } = req;

  try {
    const {
      fileName
    } = req.query;

    if (!fileName) {
      const err = new Error();
      err.statusCode = HTTP_CODES.BAD_REQUEST;
      err.error = 'File Name is Required';
      err.message = 'File Name is Required';

      throw err;
    }

    const { message } = await UploadFbmShippingCost({
      userId,
      fileName
    });

    SuccessResponse({
      res,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.PRODUCT.UPLOAD_FBM_SHIPPING_COST,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.get(API_ENDPOINTS.PRODUCT.UPLOAD_SHIP_TO_FBA_COST, async (req, res) => {
  const {
    user: {
      _id: userId = ''
    } = {}
  } = req;

  try {
    const {
      fileName
    } = req.query;

    if (!fileName) {
      const err = new Error();
      err.statusCode = HTTP_CODES.BAD_REQUEST;
      err.error = 'File Name is Required';
      err.message = 'File Name is Required';

      throw err;
    }

    const { message } = await UploadShipToFbaCost({
      userId,
      fileName
    });

    SuccessResponse({
      res,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.PRODUCT.UPLOAD_SHIP_TO_FBA_COST,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

export default router;
