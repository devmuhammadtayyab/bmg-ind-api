import { NoBoxItems } from '../../models';

const GetNoBoxItems = async ({ orderId }) => {
  const noBoxItems = await NoBoxItems.find({
    orderId
  });

  return { message: 'No Box items fetched successfully!', noBoxItems };
};

export default GetNoBoxItems;
