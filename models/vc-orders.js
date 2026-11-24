import mongoose, { Schema } from 'mongoose';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  storeId: { type: Schema.Types.ObjectId, ref: 'stores' },
  purchaseOrderDate: { type: Date },
  purchaseOrderState: { type: String }
}, {
  timestamps: true,
  strict: false
});

const VCOrders = mongoose.model('vcOrders', schema, 'vcOrders');

export default VCOrders;
