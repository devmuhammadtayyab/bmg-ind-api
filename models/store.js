import mongoose, { Schema } from 'mongoose';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  name: { type: String },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Connected', 'Disconnected']
  },
  type: { type: String },
  marketplaces: { type: Array },
  sellerId: { type: String },
  region: { type: String },
  refreshToken: { type: String },
  accessToken: { type: String },
  expiresIn: { type: Date },
  profiles: { type: Array }
}, {
  timestamps: true,
  strict: false
});

const Store = mongoose.model('stores', schema, 'stores');

export default Store;
