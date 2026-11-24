import moment from 'moment-timezone';
import {
  extend,
  round,
  uniq
} from 'lodash';

import {
  ChildAsin,
  ParentAsin,
  PerDayPerItem,
  Product
} from '../../models';

const ExportDashboardData = async ({
  platform,
  marketplaceId,
  searchKeyword,
  parentId,
  childId,
  startDate,
  endDate
}) => {
  const selector = {};
  const productSelector = {};
  if (platform !== 'All') {
    extend(selector, { platform });
  }

  if (marketplaceId !== 'All') {
    extend(selector, { marketplaceId });
    extend(productSelector, { marketplaceId });
  }

  let parentAsin;
  let allChildAsin = [];
  if (parentId !== 'All') {
    const childAsins = await ChildAsin
      .find({
        parentId
      })
      .populate('productId', { _id: 0, asin: 1 });

    allChildAsin = uniq(childAsins.map((p) => p.productId.asin));

    const parent = await ParentAsin
      .findOne({
        _id: parentId
      })
      .populate('productId', { _id: 0, asin: 1 });
    ({ asin: parentAsin } = parent.productId);
  }

  const parentSelector = {};
  if (parentAsin) {
    extend(parentSelector, { parentAsin });
  }

  if (childId !== 'All') {
    const childAsins = await ChildAsin
      .find({
        _id: childId
      })
      .populate('productId', { _id: 0, asin: 1 });

    allChildAsin = uniq(childAsins.map((p) => p.productId.asin));
  }

  if (allChildAsin.length) {
    extend(selector, { asin: { $in: allChildAsin } });
  }

  if (startDate && endDate) {
    const sDate = moment.tz(startDate, 'America/Los_Angeles').toDate();
    const eDate = moment.tz(endDate, 'America/Los_Angeles').endOf('day').toDate();

    extend(selector, {
      timestamp: { $gte: sDate, $lte: eDate }
    });
  }

  if (searchKeyword) {
    const value = searchKeyword;
    if (value.includes(' ')) {
      const regex = new RegExp(value.replace(/(\S+)/g, (s) => `\\b(\\s*)${s}(\\s*).*`).replace(/\s+/g, ''));

      extend(productSelector, {
        $or: [
          { sellerSku: { $regex: regex, $options: 'i' } },
          { title: { $regex: regex, $options: 'i' } }
        ]
      });
    } else {
      extend(productSelector, {
        $or: [
          { sellerSku: { $regex: `.*${value}.*`, $options: 'i' } },
          { title: { $regex: `.*${value}.*`, $options: 'i' } }
        ]
      });
    }

    const sellerSkus = await Product.distinct('sellerSku', productSelector);
    extend(selector, { sellerSku: { $in: sellerSkus } });
  }

  const perDay = await PerDayPerItem.aggregate([{
    $match: selector
  }, {
    $addFields: {
      referralFee: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $multiply: ['$unitsShipped', '$referralFee']
          },
          else: 0
        }
      }
    }
  }, {
    $group: {
      _id: {
        platform: '$platform',
        marketplaceId: '$marketplaceId',
        sellerSku: '$sellerSku'
      },
      orderIds: {
        $push: '$orderIds'
      },
      unitsOrdered: {
        $sum: '$unitsOrdered'
      },
      unitsShipped: {
        $sum: '$unitsShipped'
      },
      promotionDiscount: {
        $sum: '$promotionDiscount'
      },
      salesAmount: {
        $sum: '$salesAmount'
      },
      fulfillmentFee: {
        $avg: {
          $ifNull: ['$fulfillmentFee', 0]
        }
      },
      referralFee: {
        $sum: '$referralFee'
      },
      fbaHandlingCost: {
        $avg: {
          $ifNull: ['$fbaHandlingCost', 0]
        }
      },
      fbmShippingCost: {
        $avg: {
          $ifNull: ['$fbmShippingCost', 0]
        }
      },
      shipToFbaCost: {
        $avg: {
          $ifNull: ['$shipToFbaCost', 0]
        }
      },
      cogs: {
        $avg: {
          $ifNull: ['$cogs', 0]
        }
      },
      spAdSpend: {
        $sum: '$spAdSpend'
      },
      sdAdSpend: {
        $sum: '$sdAdSpend'
      },
      sbAdSpend: {
        $sum: '$sbAdSpend'
      },
      profit: {
        $sum: '$profit'
      },
      productMargin: {
        $sum: '$productMargin'
      }
    }
  }, {
    $addFields: {
      mergedOrderIds: {
        $reduce: {
          input: '$orderIds',
          initialValue: [],
          in: { $setUnion: ['$$value', '$$this'] }
        }
      }
    }
  }, {
    $lookup: {
      from: 'products',
      let: {
        platform: '$_id.platform',
        marketplaceId: '$_id.marketplaceId',
        sellerSku: '$_id.sellerSku'
      },
      pipeline: [{
        $match: {
          $expr: {
            $and: [{
              $eq: ['$platform', '$$platform']
            }, {
              $eq: ['$marketplaceId', '$$marketplaceId']
            }, {
              $eq: ['$sellerSku', '$$sellerSku']
            }]
          }
        }
      }, {
        $project: {
          asin: 1,
          title: 1,
          fulfillmentChannel: 1,
          quantity: 1
        }
      }],
      as: 'childProduct'
    }
  }, {
    $unwind: {
      path: '$childProduct'
    }
  }, {
    $lookup: {
      from: 'productDetails',
      localField: 'childProduct._id',
      foreignField: 'productId',
      as: 'productDetail'
    }
  }, {
    $unwind: {
      path: '$productDetail',
      preserveNullAndEmptyArrays: true
    }
  }, {
    $lookup: {
      from: 'childAsins',
      let: {
        productId: '$childProduct._id'
      },
      pipeline: [{
        $match: {
          $expr: {
            $and: [{
              $eq: ['$productId', '$$productId']
            }]
          }
        }
      }, {
        $project: {
          parentId: 1
        }
      }],
      as: 'childAsins'
    }
  }, {
    $unwind: {
      path: '$childAsins'
    }
  }, {
    $lookup: {
      from: 'parentAsins',
      let: {
        parentId: '$childAsins.parentId'
      },
      pipeline: [{
        $match: {
          $expr: {
            $and: [{
              $eq: ['$_id', '$$parentId']
            }]
          }
        }
      }, {
        $project: {
          productId: 1
        }
      }],
      as: 'parentAsins'
    }
  }, {
    $unwind: {
      path: '$parentAsins'
    }
  }, {
    $lookup: {
      from: 'products',
      let: {
        productId: '$parentAsins.productId'
      },
      pipeline: [{
        $match: {
          $expr: {
            $and: [{
              $eq: ['$_id', '$$productId']
            }]
          }
        }
      }, {
        $project: {
          asin: 1
        }
      }],
      as: 'parentProduct'
    }
  }, {
    $unwind: {
      path: '$parentProduct'
    }
  }, {
    $addFields: {
      adSpend: {
        $add: [{
          $ifNull: ['$spAdSpend', 0]
        }, {
          $ifNull: ['$sdAdSpend', 0]
        }, {
          $ifNull: ['$sbAdSpend', 0]
        }]
      }
    }
  }, {
    $project: {
      _id: 0,
      platform: '$_id.platform',
      marketplaceId: '$_id.marketplaceId',
      parentAsin: '$parentProduct.asin',
      childAsin: '$childProduct.asin',
      sellerSku: '$_id.sellerSku',
      title: '$childProduct.title',
      fulfillmentType: '$childProduct.fulfillmentChannel',
      numberOfOrders: {
        $size: '$mergedOrderIds'
      },
      unitsOrdered: 1,
      unitsShipped: 1,
      unitPrice: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $round: [{
              $divide: ['$salesAmount', '$unitsShipped']
            }, 2]
          },
          else: 0
        }
      },
      salesAmount: 1,
      fulfillmentFeePerUnit: '$fulfillmentFee',
      fulfillmentFee: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $multiply: ['$unitsShipped', '$fulfillmentFee']
          },
          else: 0
        }
      },
      referralFee: 1,
      fbaHandlingCostPerUnit: '$fbaHandlingCost',
      fbaHandlingCost: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $multiply: ['$unitsShipped', '$fbaHandlingCost']
          },
          else: 0
        }
      },
      fbmShippingCostPerUnit: '$fbmShippingCost',
      fbmShippingCost: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $multiply: ['$unitsShipped', '$fbmShippingCost']
          },
          else: 0
        }
      },
      shipToFbaCostPerUnit: '$shipToFbaCost',
      shipToFbaCost: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $multiply: ['$unitsShipped', '$shipToFbaCost']
          },
          else: 0
        }
      },
      promotionDiscount: 1,
      cogsPerUnit: '$cogs',
      cogs: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $multiply: ['$unitsShipped', '$cogs']
          },
          else: 0
        }
      },
      adSpend: 1,
      tacos: {
        $cond: {
          if: { $gt: ['$salesAmount', 0] },
          then: {
            $round: [{
              $divide: ['$adSpend', '$salesAmount']
            }, 2]
          },
          else: 0
        }
      },
      profitPerUnit: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $round: [{
              $divide: ['$profit', '$unitsShipped']
            }, 2]
          },
          else: 0
        }
      },
      profit: 1,
      productMarginPerUnit: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $round: [{
              $divide: ['$productMargin', '$unitsShipped']
            }, 2]
          },
          else: 0
        }
      },
      productMargin: 1,
      afnFulfillableQuantity: '$productDetail.afnFulfillableQuantity',
      mfnFulfillableQuantity: '$childProduct.quantity',
      afnInboundQuantity: {
        $add: [
          { $ifNull: ['$productDetail.afnInboundShippedQuantity', 0] },
          { $ifNull: ['$productDetail.afnInboundReceivingQuantity', 0] },
          { $ifNull: ['$productDetail.afnInboundWorkingQuantity', 0] }
        ]
      },
      afnReservedQuantity: {
        $cond: {
          if: { $eq: ['$productDetail.afnReservedQuantity', null] },
          then: 0,
          else: '$productDetail.afnReservedQuantity'
        }
      },
      afnUnfulfillableQuantity: {
        $cond: {
          if: { $eq: ['$productDetail.afnUnsellableQuantity', null] },
          then: 0,
          else: '$productDetail.afnUnsellableQuantity'
        }
      },
      afnResearchingQuantity: {
        $cond: {
          if: { $eq: ['$productDetail.afnResearchingQuantity', null] },
          then: 0,
          else: '$productDetail.afnResearchingQuantity'
        }
      },
      afnTotalQuantity: {
        $cond: {
          if: { $eq: ['$productDetail.afnTotalQuantity', null] },
          then: 0,
          else: '$productDetail.afnTotalQuantity'
        }
      },
      afnFutureSupplyBuyable: {
        $cond: {
          if: { $eq: ['$productDetail.afnFutureSupplyBuyable', null] },
          then: 0,
          else: '$productDetail.afnTotalQuantity'
        }
      },
      afnReservedFutureSupply: {
        $cond: {
          if: { $eq: ['$productDetail.afnReservedFutureSupply', null] },
          then: 0,
          else: '$productDetail.afnReservedFutureSupply'
        }
      },
      isBuyBoxWinner: {
        $cond: {
          if: { $eq: ['$productDetail.isBuyBoxWinner', null] },
          then: 'N/A',
          else: {
            $cond: {
              if: { $eq: ['$productDetail.isBuyBoxWinner', true] },
              then: 'Yes',
              else: 'No'
            }
          }
        }
      },
      buyBoxPrice: {
        $cond: {
          if: { $eq: ['$productDetail.buyBoxPrices.listingPrice.amount', null] },
          then: 'N/A',
          else: '$productDetail.buyBoxPrices.listingPrice.amount'
        }
      },
      warehouseQuantity: '$productDetail.warehouseQuantity'
    }
  }]);

  const perDayData = [];
  for (let i = 0; i < perDay.length; i += 1) {
    const {
      platform: pf,
      marketplaceId: mId,
      parentAsin: pAsin,
      childAsin: cAsin,
      sellerSku,
      title,
      fulfillmentType,
      numberOfOrders,
      unitsOrdered,
      unitsShipped,
      unitPrice,
      salesAmount,
      fulfillmentFeePerUnit,
      fulfillmentFee,
      referralFee,
      fbaHandlingCostPerUnit,
      fbaHandlingCost,
      fbmShippingCostPerUnit,
      fbmShippingCost,
      shipToFbaCostPerUnit,
      shipToFbaCost,
      promotionDiscount,
      cogsPerUnit,
      cogs,
      adSpend,
      tacos,
      profitPerUnit,
      profit,
      productMarginPerUnit,
      productMargin,
      mfnFulfillableQuantity = 0,
      afnFulfillableQuantity = 0,
      afnInboundQuantity = 0,
      afnReservedQuantity = 0,
      afnUnfulfillableQuantity = 0,
      afnResearchingQuantity = 0,
      afnTotalQuantity = 0,
      afnFutureSupplyBuyable = 0,
      afnReservedFutureSupply = 0,
      isBuyBoxWinner,
      buyBoxPrice,
      warehouseQuantity = 0
    } = perDay[i];

    perDayData.push({
      Marketplace: `${pf === 'vendor-central' ? 'VC' : 'SC'} - ${mId === 'ATVPDKIKX0DER' ? 'US' : 'CA'}`,
      'Parent Asin': pAsin,
      'Child Asin': cAsin,
      'Seller Sku': sellerSku,
      Title: title,
      'Fulfillment Type': fulfillmentType,
      'Buy Box Winner': isBuyBoxWinner,
      'Buy Box Price': buyBoxPrice ? round(buyBoxPrice, 2) : 'N/A',
      'Warehouse Quantity': warehouseQuantity,
      'Available Quantity': fulfillmentType === 'MFN' ? mfnFulfillableQuantity : afnFulfillableQuantity,
      'Inbound Quantity': afnInboundQuantity,
      'Reserved Quantity': afnReservedQuantity,
      'Unfulfillable Quantity': afnUnfulfillableQuantity,
      'Researching Quantity': afnResearchingQuantity,
      'Total Quantity': fulfillmentType === 'MFN' ? mfnFulfillableQuantity : afnTotalQuantity,
      'Future Supply Buyable Quantity': afnFutureSupplyBuyable,
      'Reserved Future Supply Quantity': afnReservedFutureSupply,
      Orders: numberOfOrders,
      'Units Ordered': unitsOrdered,
      'Units Shipped': unitsShipped,
      'Unit Price': round(unitPrice, 2),
      'Sales Amount': round(salesAmount, 2),
      'FBA Fee (Per Unit)': round(fulfillmentFeePerUnit, 2),
      'Total FBA Fee': round(fulfillmentFee, 2),
      'Referral Fee (Per Unit)': round(referralFee / unitsShipped, 2),
      'Total Referral Fee': round(referralFee, 2),
      'FBA Handling Cost (Per Unit)': round(fbaHandlingCostPerUnit, 2),
      'Total FBA Handling Cost': round(fbaHandlingCost, 2),
      'FBM Shipping Cost (Per Unit)': round(fbmShippingCostPerUnit, 2),
      'Total FBM Shipping Cost': round(fbmShippingCost, 2),
      'Ship To FBA Cost (Per Unit)': round(shipToFbaCostPerUnit, 2),
      'Total Ship To FBA Cost': round(shipToFbaCost, 2),
      'COGS (Per Unit)': round(cogsPerUnit, 2),
      'Total COGS': round(cogs, 2),
      'Ad Spend': round(adSpend, 2),
      TACOS: round(tacos, 2),
      'Promotion Discount': round(promotionDiscount, 2),
      'Profit (Per Unit)': round(profitPerUnit, 2),
      'Total Profit': round(profit, 2),
      'Product Margin (Per Unit)': round(productMarginPerUnit, 2),
      'Total Product Margin': round(productMargin, 2)
    });
  }

  return { perDayData };
};

export default ExportDashboardData;
