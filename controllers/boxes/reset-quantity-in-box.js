import { BoxItems } from '../../models';

const ResetQuantityInBox = async ({
  boxId,
  type,
  sellerSku,
  lineItemIndex
}) => {
  const baseFilter = { type, sellerSku, boxId };
  const lineIndex = Number(lineItemIndex);
  const hasLineIndex = Number.isInteger(lineIndex);

  if (hasLineIndex) {
    const { deletedCount } = await BoxItems.deleteOne({
      ...baseFilter,
      lineItemIndex: lineIndex
    });

    if (deletedCount === 0) {
      await BoxItems.deleteOne({
        ...baseFilter,
        lineItemIndex: { $exists: false }
      });
    }
  } else {
    await BoxItems.deleteOne(baseFilter);
  }

  return { message: 'Reset quantity in box successfully!' };
};

export default ResetQuantityInBox;
