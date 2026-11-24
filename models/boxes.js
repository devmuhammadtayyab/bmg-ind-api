import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  orderId: { type: String },
  boxId: { type: String },
  type: { type: String },
  dimensions: { type: Object }
}, {
  timestamps: true,
  strict: false
});

const Boxes = model('boxes', schema, 'boxes');

export default Boxes;
