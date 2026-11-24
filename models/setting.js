import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  currencyConversionRateUsd: { type: Number }
}, {
  strict: false,
  timestamps: true
});

const Setting = model('settings', schema, 'settings');

export default Setting;
