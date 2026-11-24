import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  boxId: { type: String, ref: 'boxes' },
  type: { type: String },
  sellerSku: { type: String },
  lineItemIndex: { type: Number },
  quantityInBox: { type: Number }
}, {
  timestamps: true,
  strict: false
});

const BoxItems = model('boxItems', schema, 'boxItems');

export default BoxItems;
