import { Boxes, BoxItems } from '../../models';

import { BOX_TYPE } from '../utils/constants';

const SaveBoxes = async ({ boxDetails }) => {
  const updateDate = new Date();

  let orderId = '';
  const writeData = boxDetails.map((row) => {
    ({ orderId } = row);
    const { boxId, ...rest } = row;

    return {
      updateOne: {
        filter: {
          type: BOX_TYPE.SHIP_STATION,
          orderId,
          boxId
        },
        update: {
          $set: {
            ...rest
          }
        },
        upsert: true
      }
    };
  });

  console.log('\n\n', 'Save Boxes', writeData.length);
  if (writeData.length > 0) {
    await Boxes.bulkWrite(writeData);
  }

  const notUpdatedBoxes = await Boxes.find({
    type: BOX_TYPE.SHIP_STATION,
    orderId,
    updatedAt: { $lt: updateDate }
  });
  console.log('\n\n', 'notUpdatedBoxes', notUpdatedBoxes.length);

  if (notUpdatedBoxes.length) {
    const boxIds = notUpdatedBoxes.map(({ boxId }) => boxId);

    await BoxItems.deleteMany({
      type: BOX_TYPE.SHIP_STATION,
      boxId: { $in: boxIds }
    });

    await Boxes.deleteMany({
      type: BOX_TYPE.SHIP_STATION,
      boxId: { $in: boxIds }
    });
  }

  return { message: 'Box saved successfully!' };
};

export default SaveBoxes;
