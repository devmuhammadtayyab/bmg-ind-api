import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  storeId: { type: Schema.Types.ObjectId },
  date: { type: Date }
}, {
  timestamps: true,
  strict: false
});

const AssemblyItemCogs = model('assemblyItemCogs', schema, 'assemblyItemCogs');

export default AssemblyItemCogs;
