import { ChildAsin } from '../../models';

const GetAllChild = async () => {
  let children = await ChildAsin
    .find()
    .populate('productId', { asin: 1, marketplaceId: 1 });

  children = children.map((p) => ({
    childId: p._id,
    asin: p.productId.asin,
    marketplaceId: p.productId.marketplaceId
  }));

  return { children };
};

export default GetAllChild;
