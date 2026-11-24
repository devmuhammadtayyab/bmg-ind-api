import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  userId: { type: Schema.Types.ObjectId },
  sellerSku: { type: String },
  marketplaceId: { type: String },
  timestamp: { type: Date },
  cost: { type: Number }
}, {
  timestamps: true
});

const ShipToFbaCost = model('shipToFbaCost', schema, 'shipToFbaCost');

export default ShipToFbaCost;
