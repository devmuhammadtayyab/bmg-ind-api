import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import express from 'express';

import { s3Client } from '../config/aws';

import { API_ENDPOINTS } from './utils/constants';
import {
  CatchResponse,
  SendMsgOnSlack,
  SuccessResponse
} from './utils/helpers';

const router = express.Router();

const { S3_BUCKET_NAME } = process.env;

router.get(API_ENDPOINTS.S3.SIGNED_URL, async (req, res) => {
  const {
    user: {
      _id: userId = ''
    } = {}
  } = req;

  try {
    const {
      fileName
    } = req.query;

    const command = new PutObjectCommand({
      Key: fileName,
      Bucket: S3_BUCKET_NAME,
      ContentType: 'text/csv'
    });
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300
    });

    SuccessResponse({
      res,
      signedUrl
    });
  } catch (err) {
    await SendMsgOnSlack({
      userId,
      routeName: API_ENDPOINTS.S3.SIGNED_URL,
      error: err
    });

    CatchResponse({
      res,
      err
    });
  }
});

export default router;
