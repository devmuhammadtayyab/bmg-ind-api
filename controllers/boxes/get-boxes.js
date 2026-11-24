import { Boxes } from '../../models';

const GetBoxes = async ({ orderId }) => {
  const boxes = await Boxes.find({ orderId });

  return {
    message: 'Boxes fetched successfully!',
    boxes
  };
};

export default GetBoxes;
