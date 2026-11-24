import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  orderId: { type: String }
}, {
  strict: false,
  timestamps: true
});

const Shipment = model('shipments', schema, 'shipments');

export default Shipment;
