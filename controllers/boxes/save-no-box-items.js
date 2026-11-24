import { NoBoxItems } from '../../models';

const SaveNoBoxItems = async ({
  orderId,
  sellerSku,
  needToSave
}) => {
  if (needToSave) {
    await NoBoxItems.updateOne({
      orderId,
      sellerSku
    }, {
      $setOnInsert: { createdAt: new Date() }
    }, { upsert: true });

    return { message: 'Box saved successfully!' };
  }

  await NoBoxItems.deleteOne({ orderId, sellerSku });

  return { message: 'Box deleted successfully!' };
};

export default SaveNoBoxItems;
