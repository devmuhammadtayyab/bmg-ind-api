import axios from 'axios';

import {
  Boxes,
  BoxItems,
  Shipment,
  Store
} from '../../models';

import {
  JOBS_METHOD,
  JOBS_NAME,
  SUBMISSION_STATUS,
  STORE_TYPE
} from '../utils/constants';
import { HTTP_CODES } from '../../routes/utils/constants';

const { NODE_ENV, JOBS_URL } = process.env;

const CreateShipment = async ({
  orderNumber,
  requestedPickupDate
}) => {
  const shipment = await Shipment.findOneAndUpdate({
    orderNumber
  }, {
    $set: { requestedPickupDate }
  });
  const { orderId, submissionStatus } = shipment;
  if (submissionStatus === SUBMISSION_STATUS.CREATED) {
    const err = new Error();
    err.statusCode = HTTP_CODES.BAD_REQUEST;
    err.errorMessage = 'Shipment is already created!';
    err.message = 'Shipment is already created!';
    err.error = 'Shipment is already created!';

    throw err;
  }

  if (shipment && shipment.orderId) {
    const boxes = await Boxes.find({ orderId });
    const boxIds = boxes.map((b) => b.boxId);

    const boxItems = await BoxItems.find({ boxId: { $in: boxIds } });

    const emptyBoxes = [];
    for (let index = 0; index < boxes.length; index += 1) {
      const box = boxes[index];

      const matchedBox = boxItems.filter(
        (item) => item.boxId === box.boxId && item.type === box.type
      );
      if (matchedBox.length === 0) emptyBoxes.push(box._id);
    }

    await Boxes.deleteMany({
      _id: { $in: emptyBoxes }
    });
  }

  if (NODE_ENV === 'production') {
    const store = await Store.findOne({
      type: STORE_TYPE.AMAZON_VENDOR_CENTRAL
    });

    await axios.get(JOBS_URL, {
      params: {
        storeId: store?._id,
        poNumber: orderNumber,
        method: JOBS_METHOD.START_SINGLE_JOB,
        jobName: JOBS_NAME.CREATE_VC_SHIPMENT
      }
    });
  }

  return { message: 'Shipments scheduled successfully!' };
};

export default CreateShipment;
