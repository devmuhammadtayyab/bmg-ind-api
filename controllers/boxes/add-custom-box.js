import { Types } from 'mongoose';
import { Boxes } from '../../models';

import { BOX_TYPE } from '../utils/constants';
import { getBoxNumber } from '../utils/helpers';

const AddCustomBox = async ({
  orderId,
  orderNumber,
  length,
  width,
  height,
  weight
}) => {
  const lastBox = await Boxes.findOne({ type: BOX_TYPE.CUSTOM, orderId }).sort({ createdAt: -1 });
  const boxId = (lastBox?.boxId ? Number(getBoxNumber(lastBox.boxId)) + 1 : 1);

  const box = await Boxes.create({
    _id: new Types.ObjectId(),
    orderId,
    boxId: `${orderNumber}-${boxId}`,
    type: BOX_TYPE.CUSTOM,
    dimensions: {
      length,
      width,
      height,
      weight
    }
  });
  await box.save();

  return { message: 'Custom box created successfully' };
};

export default AddCustomBox;
