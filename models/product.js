import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  storeId: { type: Schema.Types.ObjectId },
  marketplaceId: { type: String },
  fulfillmentChannel: { type: String },
  asin: { type: String },
  sellerSku: { type: String },
  status: { type: String },
  title: { type: String },
  imageUrl: { type: String },
  listPrice: { type: Number },
  productFeesUpdatedAt: { type: Date },
  catalogUpdatedAt: { type: Date }
}, {
  timestamps: true,
  strict: false
});

const Product = model('products', schema, 'products');

export default Product;
