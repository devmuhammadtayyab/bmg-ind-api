import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  storeId: { type: Schema.Types.ObjectId },
  date: { type: Date }
}, {
  timestamps: true,
  strict: false
});

const InventoryItemCogs = model('inventoryItemCogs', schema, 'inventoryItemCogs');

export default InventoryItemCogs;
