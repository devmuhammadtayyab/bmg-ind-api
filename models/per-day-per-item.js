import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  userId: { type: Schema.Types.ObjectId },
  marketplaceId: { type: String },
  sellerSku: { type: String },
  asin: { type: String },
  timestamp: { type: Date },
  day: { type: Number },
  month: { type: Number },
  year: { type: Number },
  orderIds: { type: Array },
  unitsOrdered: { type: Number },
  unitsShipped: { type: Number },
  unitPrice: { type: Number },
  itemTax: { type: Number },
  promotionDiscount: { type: Number },
  promotionDiscountTax: { type: Number },
  fulfillmentFee: { type: Number },
  referralFee: { type: Number },
  fbaPickAndPack: { type: Number },
  fbaWeightHandling: { type: Number },
  fbaOrderHandling: { type: Number },
  variableClosingFee: { type: Number },
  fbaHandlingCost: { type: Number },
  fbmShippingCost: { type: Number },
  shipToFbaCost: { type: Number },
  perItemFee: { type: Number },
  sbAdSpend: { type: Number },
  sdAdSpend: { type: Number },
  spAdSpend: { type: Number },
  cogs: { type: Number },
  salesAmount: { type: Number },
  profit: { type: Number },
  productMargin: { type: Number },
  lastUpdatedDate: { type: Date }
}, {
  timestamps: true
});

const PerDayPerItem = model('perDayPerItem', schema, 'perDayPerItem');

export default PerDayPerItem;
