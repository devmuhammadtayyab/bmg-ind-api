import axios from 'axios';
import { Types } from 'mongoose';

import { Shipment, Store } from '../../models';

import { JOBS_METHOD, JOBS_NAME, STORE_TYPE } from '../utils/constants';
import { HTTP_CODES } from '../../routes/utils/constants';

const { NODE_ENV, JOBS_URL } = process.env;

const AddTrackingNumber = async ({
  userId,
  poNumber,
  trackingNumber,
  amazonReferenceNumber
}) => {
  const isOrderExists = await Shipment.findOne({
    orderNumber: poNumber
  });
  if (!isOrderExists) {
    const err = new Error();
    err.statusCode = HTTP_CODES.NOT_FOUND;
    err.errorMessage = 'Order is not exists!';
    err.error = 'Order is not exists!';

    throw err;
  }

  await Shipment.updateOne({
    orderNumber: poNumber
  }, {
    $set: {
      trackingNumber,
      amazonReferenceNumber
    }
  });

  if (NODE_ENV === 'production' && trackingNumber) {
    const store = await Store.findOne({
      type: STORE_TYPE.SHIP_STATION,
      userId: new Types.ObjectId(String(userId))
    });

    await axios.get(JOBS_URL, {
      params: {
        storeId: store?._id,
        poNumber,
        method: JOBS_METHOD.START_SINGLE_JOB,
        jobName: JOBS_NAME.MARK_AS_SHIPPED
      }
    });
  }

  return { message: 'VC order details updated successfully!' };
};

export default AddTrackingNumber;
