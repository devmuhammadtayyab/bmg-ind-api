import axios from 'axios';
import { isArray, isEmpty, isNaN } from 'lodash';

import { HTTP_CODES } from './constants';

const {
  NODE_ENV: nodeEnv,
  SLACK_URL: slackUrl
} = process.env;

const CatchResponse = ({
  res,
  err
}) => {
  let statusCode = HTTP_CODES.INTERNAL_SERVER_ERROR;
  let error = 'Server Error';

  if (err.statusCode) {
    ({ statusCode } = err);
  }

  if (err.error) {
    ({ error } = err);
  }

  res.status(statusCode).json({
    success: false,
    error
  });
};

const ConvertAllKeysIntoNumbers = (myObj) => {
  const newObj = {};

  Object.keys(myObj).forEach((key) => {
    const value = myObj[key];

    if (typeof value === 'object' && value !== null) {
      newObj[key] = ConvertAllKeysIntoNumbers(value);
    } else {
      const numericValue = Number(value);
      newObj[key] = isNaN(numericValue) ? value : numericValue;
    }
  });

  return newObj;
};

const SuccessResponse = ({
  res,
  ...rest
}) => {
  res.status(HTTP_CODES.SUCCESS).send({
    success: true,
    ...rest
  });
};

const CreateSlackMessage = ({
  routeName,
  params,
  type,
  errorMessage
}) => {
  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${type}-Notification-Alerts` }
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*RouteName:*\n\`\`\`${routeName}\`\`\`` }
    }
  ];

  if (!isEmpty(params)) {
    const paramText = params
      .map((param) => Object.entries(param)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', '))
      .join('\n');

    const requiredParams = {
      type: 'mrkdwn',
      text: `*Params:*\n\`\`\`${paramText}\`\`\``
    };

    blocks.push({ type: 'section', text: requiredParams });
  }

  if (errorMessage) {
    const errorReason = {
      type: 'mrkdwn',
      text: `*Error Reason:*\n\`\`\`${errorMessage?.substring(0, 750)}\`\`\``
    };

    blocks.push({ type: 'section', text: errorReason });
  }

  return blocks;
};

const SendMsgOnSlack = async ({
  storeId,
  userId,
  routeName,
  error
}) => {
  const errorMessage = isArray(error.message) ? error.message[0] : error.message;

  const params = [];
  if (storeId) params.push({ storeId });
  if (userId) params.push({ userId });

  const blocks = CreateSlackMessage({
    routeName,
    params,
    type: 'Api',
    errorMessage
  });

  if (nodeEnv === 'production') {
    await axios.post(slackUrl, {
      blocks
    });
  }

  return true;
};

export {
  ConvertAllKeysIntoNumbers,
  CatchResponse,
  SendMsgOnSlack,
  SuccessResponse
};
