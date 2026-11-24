import { ParentAsin } from '../../models';

const GetAllParents = async () => {
  let parents = await ParentAsin
    .find()
    .populate('productId', { asin: 1, marketplaceId: 1 });

  parents = parents.map((p) => ({
    parentId: p._id,
    asin: p.productId.asin,
    marketplaceId: p.productId.marketplaceId
  }));

  return { parents };
};

export default GetAllParents;
