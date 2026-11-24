import { Schema, model } from 'mongoose';

import { COST_TYPES, STATUS_OF_COGS_FILE } from '../utils/constants';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  userId: { type: Schema.Types.ObjectId },
  fileName: { type: String },
  type: {
    type: String,
    enum: [COST_TYPES.FBA_HANDLING_COST, COST_TYPES.FBM_SHIPPING_COST, COST_TYPES.SHIP_TO_FBA_COST]
  },
  status: {
    type: String,
    default: STATUS_OF_COGS_FILE.PENDING,
    enum: [STATUS_OF_COGS_FILE.PENDING, STATUS_OF_COGS_FILE.COMPLETED, STATUS_OF_COGS_FILE.ERROR]
  },
  uploadedDate: { type: Date }
}, {
  timestamps: true
});

const CostsFileUploaded = model('costsFileUploaded', schema, 'costsFileUploaded');

export default CostsFileUploaded;
