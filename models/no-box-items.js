import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  orderId: { type: String },
  sellerSku: { type: String }
}, {
  timestamps: true,
  strict: false
});

const NoBoxItems = model('noBoxItems', schema, 'noBoxItems');

export default NoBoxItems;
