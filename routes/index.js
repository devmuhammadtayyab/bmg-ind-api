import express from 'express';

import auth from './auth';
import dashboard from './dashboard';
import nonSecureRoutes from './non-secure-routes';
import product from './product';
import s3 from './s3';
import setting from './setting';

import { API_ENDPOINTS } from './utils/constants';
import { AuthenticateAuthToken } from '../middlewares/auth';

const router = express.Router();

router.use(API_ENDPOINTS.AUTH.INDEX, auth);
router.use(API_ENDPOINTS.DASHBOARD.INDEX, AuthenticateAuthToken, dashboard);
router.use(nonSecureRoutes);
router.use(API_ENDPOINTS.PRODUCT.INDEX, AuthenticateAuthToken, product);
router.use(API_ENDPOINTS.S3.INDEX, AuthenticateAuthToken, s3);
router.use(API_ENDPOINTS.SETTING.INDEX, AuthenticateAuthToken, setting);

export default router;
