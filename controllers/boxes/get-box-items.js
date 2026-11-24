import { Boxes, BoxItems } from '../../models';

const GetBoxItems = async ({ orderId }) => {
  const boxes = await Boxes.find({ orderId });

  const boxIds = boxes.map(({ boxId }) => boxId);

  const boxItems = await BoxItems.find({
    boxId: { $in: boxIds }
  });

  return { message: 'Box items fetched successfully!', boxItems };
};

export default GetBoxItems;
