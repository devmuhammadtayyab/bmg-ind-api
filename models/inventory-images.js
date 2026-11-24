import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  storeId: { type: Schema.Types.ObjectId },
  itemType: { type: String },
  sellerSku: { type: String },
  imageUrl: { type: String },
  netSuiteId: { type: String },
  dimensions: {
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
    weight: { type: Number }
  }
}, {
  timestamps: true,
  strict: false
});

const InventoryImages = model('inventoryImages', schema, 'inventoryImages');

export default InventoryImages;
