import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  fulfillmentPlanId: { type: String }
}, {
  strict: false,
  timestamps: true
});

const ShipmentConfig = model('shipmentsConfig', schema, 'shipmentsConfig');

export default ShipmentConfig;
