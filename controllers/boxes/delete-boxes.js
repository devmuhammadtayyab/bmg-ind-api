import { Boxes, BoxItems } from '../../models';

const DeleteBoxes = async ({ boxIds, type }) => {
  const boxToBeDeleted = await Boxes.find({
    type,
    boxId: { $in: boxIds }
  });
  console.log('\n\n', 'boxToBeDeleted', boxToBeDeleted.length);

  if (boxToBeDeleted.length) {
    await BoxItems.deleteMany({
      type,
      boxId: { $in: boxIds }
    });

    await Boxes.deleteMany({
      type,
      boxId: { $in: boxIds }
    });
  }

  return { message: 'Box deleted successfully!' };
};

export default DeleteBoxes;
