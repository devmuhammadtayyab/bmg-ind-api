import moment from 'moment';
import express from 'express';
import { write } from 'fast-csv';

import { Login } from '../controllers/auth';
import { ExportDashboardData } from '../controllers/dashboard';

import { LoginCheck } from '../middlewares/auth';

import { API_ENDPOINTS, HTTP_CODES } from './utils/constants';
import {
  CatchResponse,
  SendMsgOnSlack,
  SuccessResponse
} from './utils/helpers';

const router = express.Router();

router.post(API_ENDPOINTS.AUTH.LOGIN, LoginCheck, async (req, res) => {
  const {
    user: {
      _id: userId = '',
      email = '',
      name = ''
    } = {}
  } = req;

  try {
    const err = new Error();
    if (req?.error) {
      err.statusCode = HTTP_CODES.UNAUTHORIZED;
      err.error = req.error;
      err.message = req.error;

      throw err;
    }

    const { token, message } = await Login({
      userId,
      email
    });

    SuccessResponse({
      res,
      message,
      token,
      user: {
        userId,
        email,
        name
      }
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.AUTH.LOGIN,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.get(API_ENDPOINTS.DASHBOARD.EXPORT_DASHBOARD_DATA, async (req, res) => {
  try {
    const {
      platform,
      marketplaceId,
      searchKeyword,
      parentId,
      childId,
      startDate,
      endDate
    } = req.query;

    const { perDayData } = await ExportDashboardData({
      platform,
      marketplaceId,
      searchKeyword,
      parentId,
      childId,
      startDate,
      endDate
    });

    res.setHeader('Content-Disposition', `attachment; filename="Latest Profit Stats-${moment().format('YY/MM/DD')}.csv"`);
    res.setHeader('Content-Type', 'text/csv');

    write(perDayData, { headers: true })
      .pipe(res);
  } catch (err) {
    await SendMsgOnSlack({
      userId: '',
      routeName: API_ENDPOINTS.DASHBOARD.EXPORT_DASHBOARD_DATA,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

export default router;
