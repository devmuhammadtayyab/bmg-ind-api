import express from 'express';
import { isEmpty } from 'lodash';

import { GetAllChild, GetAllParents, GetDashboardData } from '../controllers/dashboard';

import { API_ENDPOINTS } from './utils/constants';
import {
  CatchResponse,
  ConvertAllKeysIntoNumbers,
  SendMsgOnSlack,
  SuccessResponse
} from './utils/helpers';

const router = express.Router();

router.get(API_ENDPOINTS.DASHBOARD.GET_ALL_CHILD, async (req, res) => {
  let userId;
  try {
    const { children } = await GetAllChild();

    SuccessResponse({
      res,
      children
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.DASHBOARD.GET_ALL_CHILD,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.get(API_ENDPOINTS.DASHBOARD.GET_ALL_PARENTS, async (req, res) => {
  let userId;
  try {
    const { parents } = await GetAllParents();

    SuccessResponse({
      res,
      parents
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.DASHBOARD.GET_ALL_PARENTS,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

router.get(API_ENDPOINTS.DASHBOARD.GET_DASHBOARD_DATA, async (req, res) => {
  let userId;
  try {
    const {
      platform,
      marketplaceId,
      limit,
      skip,
      searchKeyword,
      parentId,
      childId,
      startDate,
      endDate
    } = req.query;

    let { sort } = req.query;
    if (!isEmpty(sort)) {
      sort = ConvertAllKeysIntoNumbers(sort);
    }

    const { dashboardData, total } = await GetDashboardData({
      platform,
      marketplaceId,
      skip: Number(skip),
      limit: Number(limit),
      sort,
      searchKeyword,
      parentId,
      childId,
      startDate,
      endDate
    });

    SuccessResponse({
      res,
      dashboardData,
      total
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.DASHBOARD.GET_DASHBOARD_DATA,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

export default router;
