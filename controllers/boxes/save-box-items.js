import { BoxItems } from '../../models';

const SaveBoxItems = async ({
  boxId,
  type,
  sellerSku,
  lineItemIndex,
  quantityInBox
}) => {
  if (quantityInBox && quantityInBox > 0) {
    const filter = { type, sellerSku, boxId };

    if (typeof lineItemIndex === 'number') {
      filter.lineItemIndex = lineItemIndex;
    }

    await BoxItems.updateOne(filter, {
      $inc: { quantityInBox }
    }, { upsert: true });
  }

  return { message: 'Box updated successfully!' };
};

export default SaveBoxItems;
