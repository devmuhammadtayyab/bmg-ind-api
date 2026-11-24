import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  storeId: { type: Schema.Types.ObjectId },
  marketplaceId: { type: String },
  dimensions: { type: Object },
  imageUrl: { type: String },
  productId: { type: Schema.Types.ObjectId, ref: 'products' },
  parentId: { type: Schema.Types.ObjectId, ref: 'parentAsins' }
}, {
  timestamps: true,
  strict: false
});

const ChildAsin = model('childAsins', schema, 'childAsins');

export default ChildAsin;
