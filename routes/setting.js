import express from 'express';

import {
  AddTrackingNumber,
  GetCurrencyConversionRate,
  SaveCurrencyConversionRate
} from '../controllers/settings';

import { API_ENDPOINTS } from './utils/constants';
import {
  CatchResponse,
  SendMsgOnSlack,
  SuccessResponse
} from './utils/helpers';

const router = express.Router();

router.post(API_ENDPOINTS.SETTING.ADD_TRACKING_NUMBER, async (req, res) => {
  const {
    user: {
      _id: userId = ''
    } = {},
    body: {
      poNumber,
      trackingNumber,
      amazonReferenceNumber
    }
  } = req;

  try {
    const { message } = await AddTrackingNumber({
      poNumber,
      trackingNumber,
      amazonReferenceNumber
    });

    SuccessResponse({
      res,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.SETTING.ADD_TRACKING_NUMBER,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.get(API_ENDPOINTS.SETTING.GET_CURRENCY_CONVERSION_RATE, async (req, res) => {
  const {
    user: {
      _id: userId = ''
    } = {}
  } = req;

  try {
    const { message, setting } = await GetCurrencyConversionRate({
      userId
    });

    SuccessResponse({
      res,
      message,
      setting
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.SETTING.GET_CURRENCY_CONVERSION_RATE,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.post(API_ENDPOINTS.SETTING.SAVE_CURRENCY_CONVERSION_RATE, async (req, res) => {
  const {
    user: {
      _id: userId = ''
    } = {}
  } = req;

  try {
    const {
      settingId,
      currencyConversionRateUsd
    } = req.body;

    const { message } = await SaveCurrencyConversionRate({
      userId,
      settingId,
      currencyConversionRateUsd
    });

    SuccessResponse({
      res,
      message
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.SETTING.SAVE_CURRENCY_CONVERSION_RATE,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

export default router;
