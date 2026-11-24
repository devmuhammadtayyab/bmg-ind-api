import moment from 'moment-timezone';
import {
  extend,
  isEmpty,
  uniq
} from 'lodash';

import {
  ChildAsin,
  ParentAsin,
  PerDayPerItem,
  Product
} from '../../models';

const GetDashboardData = async ({
  platform,
  marketplaceId,
  limit,
  skip,
  sort,
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

  const parentAggregate = [];
  if (!isEmpty(sort)) {
    parentAggregate.push({
      $sort: sort
    });
  }

  parentAggregate.push({
    $skip: skip
  }, {
    $limit: limit
  });

  const [perDay] = await PerDayPerItem.aggregate([{
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
      unitsSold: {
        $sum: '$unitsOrdered'
      },
      unitsShipped: {
        $sum: '$unitsShipped'
      },
      unitPrice: {
        $avg: {
          $cond: {
            if: { $gt: ['$unitsOrdered', 0] },
            then: '$unitPrice',
            else: null
          }
        }
      },
      itemTax: {
        $sum: '$itemTax'
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
      fbaPickAndPack: {
        $avg: {
          $ifNull: ['$fbaPickAndPack', 0]
        }
      },
      fbaWeightHandling: {
        $avg: {
          $ifNull: ['$fbaWeightHandling', 0]
        }
      },
      fbaOrderHandling: {
        $avg: {
          $ifNull: ['$fbaOrderHandling', 0]
        }
      },
      variableClosingFee: {
        $avg: {
          $ifNull: ['$variableClosingFee', 0]
        }
      },
      perItemFee: {
        $avg: {
          $ifNull: ['$perItemFee', 0]
        }
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
              $eq: [
                '$platform',
                '$$platform'
              ]
            }, {
              $eq: [
                '$marketplaceId',
                '$$marketplaceId'
              ]
            }, {
              $eq: [
                '$sellerSku',
                '$$sellerSku'
              ]
            }]
          }
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
      localField: 'childProduct._id',
      foreignField: 'productId',
      as: 'childAsins'
    }
  }, {
    $unwind: {
      path: '$childAsins'
    }
  }, {
    $lookup: {
      from: 'parentAsins',
      localField: 'childAsins.parentId',
      foreignField: '_id',
      as: 'parentAsins'
    }
  }, {
    $unwind: {
      path: '$parentAsins'
    }
  }, {
    $lookup: {
      from: 'products',
      localField: 'parentAsins.productId',
      foreignField: '_id',
      as: 'parentProduct'
    }
  }, {
    $unwind: {
      path: '$parentProduct'
    }
  }, {
    $project: {
      _id: 0,
      platform: '$_id.platform',
      marketplaceId: '$_id.marketplaceId',
      title: '$childProduct.title',
      sellerSku: '$_id.sellerSku',
      fulfillmentType: '$childProduct.fulfillmentChannel',
      childAsin: '$childProduct.asin',
      childTitle: '$childProduct.title',
      parentAsin: '$parentProduct.asin',
      parentTitle: '$parentProduct.title',
      orderIds: '$mergedOrderIds',
      unitsSold: 1,
      unitsShipped: 1,
      unitPrice: 1,
      itemTax: 1,
      promotionDiscount: 1,
      salesAmount: 1,
      numberOfOrders: {
        $size: '$mergedOrderIds'
      },
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
      fbaPickAndPack: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $multiply: ['$unitsShipped', '$fbaPickAndPack']
          },
          else: 0
        }
      },
      fbaWeightHandling: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $multiply: ['$unitsShipped', '$fbaWeightHandling']
          },
          else: 0
        }
      },
      fbaOrderHandling: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $multiply: ['$unitsShipped', '$fbaOrderHandling']
          },
          else: 0
        }
      },
      variableClosingFee: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $multiply: ['$unitsSold', '$variableClosingFee']
          },
          else: 0
        }
      },
      perItemFee: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $multiply: ['$unitsShipped', '$perItemFee']
          },
          else: 0
        }
      },
      fbaHandlingCost: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $multiply: ['$unitsShipped', '$fbaHandlingCost']
          },
          else: 0
        }
      },
      fbmShippingCost: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $multiply: ['$unitsShipped', '$fbmShippingCost']
          },
          else: 0
        }
      },
      shipToFbaCost: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $multiply: ['$unitsShipped', '$shipToFbaCost']
          },
          else: 0
        }
      },
      cogs: {
        $cond: {
          if: { $gt: ['$unitsShipped', 0] },
          then: {
            $multiply: ['$unitsShipped', '$cogs']
          },
          else: 0
        }
      },
      spAdSpend: 1,
      sdAdSpend: 1,
      sbAdSpend: 1,
      adSpend: {
        $add: [
          { $ifNull: ['$spAdSpend', 0] },
          { $ifNull: ['$sdAdSpend', 0] },
          { $ifNull: ['$sbAdSpend', 0] }
        ]
      },
      parentImage: '$parentAsins.imageUrl',
      childImage: '$childAsins.imageUrl',
      profit: 1,
      productMargin: 1,
      mfnFulfillableQuantity: {
        $ifNull: ['$childProduct.quantity', 0]
      },
      afnFulfillableQuantity: {
        $ifNull: ['$productDetail.afnFulfillableQuantity', 0]
      },
      afnInboundQuantity: {
        $add: [
          { $ifNull: ['$productDetail.afnInboundShippedQuantity', 0] },
          { $ifNull: ['$productDetail.afnInboundReceivingQuantity', 0] },
          { $ifNull: ['$productDetail.afnInboundWorkingQuantity', 0] }
        ]
      },
      afnReservedQuantity: {
        $ifNull: ['$productDetail.afnReservedQuantity', 0]
      },
      afnUnfulfillableQuantity: {
        $ifNull: ['$productDetail.afnUnsellableQuantity', 0]
      },
      afnResearchingQuantity: {
        $ifNull: ['$productDetail.afnResearchingQuantity', 0]
      },
      afnTotalQuantity: {
        $ifNull: ['$productDetail.afnTotalQuantity', 0]
      },
      afnFutureSupplyBuyable: {
        $ifNull: ['$productDetail.afnFutureSupplyBuyable', 0]
      },
      afnReservedFutureSupply: {
        $ifNull: ['$productDetail.afnReservedFutureSupply', 0]
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
      warehouseQuantity: {
        $ifNull: ['$productDetail.warehouseQuantity', 0]
      }
    }
  }, {
    $group: {
      _id: '$childAsin',
      childSkus: {
        $addToSet: {
          platform: '$platform',
          marketplaceId: '$marketplaceId',
          numberOfOrders: '$numberOfOrders',
          sellerSku: '$sellerSku',
          title: '$title',
          fulfillmentType: '$fulfillmentType',
          unitsSold: '$unitsSold',
          unitsShipped: '$unitsShipped',
          unitPrice: '$unitPrice',
          itemTax: '$itemTax',
          promotionDiscount: '$promotionDiscount',
          salesAmount: '$salesAmount',
          fulfillmentFee: '$fulfillmentFee',
          referralFee: '$referralFee',
          fbaPickAndPack: '$fbaPickAndPack',
          fbaWeightHandling: '$fbaWeightHandling',
          fbaOrderHandling: '$fbaOrderHandling',
          variableClosingFee: '$variableClosingFee',
          perItemFee: '$perItemFee',
          fbaHandlingCost: '$fbaHandlingCost',
          fbmShippingCost: '$fbmShippingCost',
          shipToFbaCost: '$shipToFbaCost',
          cogs: '$cogs',
          spAdSpend: '$spAdSpend',
          sdAdSpend: '$sdAdSpend',
          sbAdSpend: '$sbAdSpend',
          adSpend: '$adSpend',
          profit: '$profit',
          productMargin: '$productMargin',
          mfnFulfillableQuantity: '$mfnFulfillableQuantity',
          afnFulfillableQuantity: '$afnFulfillableQuantity',
          afnInboundQuantity: '$afnInboundQuantity',
          afnReservedQuantity: '$afnReservedQuantity',
          afnUnfulfillableQuantity: '$afnUnfulfillableQuantity',
          afnResearchingQuantity: '$afnResearchingQuantity',
          afnTotalQuantity: '$afnTotalQuantity',
          afnFutureSupplyBuyable: '$afnFutureSupplyBuyable',
          afnReservedFutureSupply: '$afnReservedFutureSupply',
          isBuyBoxWinner: '$isBuyBoxWinner',
          buyBoxPrice: '$buyBoxPrice',
          warehouseQuantity: '$warehouseQuantity'
        }
      },
      platform: {
        $first: '$platform'
      },
      childTitle: {
        $first: '$childTitle'
      },
      parentTitle: {
        $first: '$parentTitle'
      },
      parentAsin: {
        $first: '$parentAsin'
      },
      numberOfOrders: {
        $sum: '$numberOfOrders'
      },
      childUnitsSold: {
        $sum: '$unitsSold'
      },
      childUnitsShipped: {
        $sum: '$unitsShipped'
      },
      childItemTax: {
        $sum: '$itemTax'
      },
      childPromotionDiscount: {
        $sum: '$promotionDiscount'
      },
      childSalesAmount: {
        $sum: '$salesAmount'
      },
      parentImage: {
        $first: '$parentImage'
      },
      childImage: {
        $first: '$childImage'
      },
      fulfillmentFee: {
        $sum: '$fulfillmentFee'
      },
      referralFee: {
        $sum: '$referralFee'
      },
      fbaPickAndPack: {
        $sum: '$fbaPickAndPack'
      },
      fbaWeightHandling: {
        $sum: '$fbaWeightHandling'
      },
      fbaOrderHandling: {
        $sum: '$fbaOrderHandling'
      },
      variableClosingFee: {
        $sum: '$variableClosingFee'
      },
      perItemFee: {
        $sum: '$perItemFee'
      },
      fbaHandlingCost: {
        $sum: '$fbaHandlingCost'
      },
      fbmShippingCost: {
        $sum: '$fbmShippingCost'
      },
      shipToFbaCost: {
        $sum: '$shipToFbaCost'
      },
      cogs: {
        $sum: '$cogs'
      },
      adSpend: {
        $sum: '$adSpend'
      },
      profit: {
        $sum: '$profit'
      },
      productMargin: {
        $sum: '$productMargin'
      },
      mfnFulfillableQuantity: {
        $sum: '$mfnFulfillableQuantity'
      },
      afnFulfillableQuantity: {
        $sum: '$afnFulfillableQuantity'
      },
      afnInboundQuantity: {
        $sum: '$afnInboundQuantity'
      },
      afnReservedQuantity: {
        $sum: '$afnReservedQuantity'
      },
      afnUnfulfillableQuantity: {
        $sum: '$afnUnfulfillableQuantity'
      },
      afnResearchingQuantity: {
        $sum: '$afnResearchingQuantity'
      },
      afnTotalQuantity: {
        $sum: '$afnTotalQuantity'
      },
      afnFutureSupplyBuyable: {
        $sum: '$afnFutureSupplyBuyable'
      },
      afnReservedFutureSupply: {
        $sum: '$afnReservedFutureSupply'
      },
      warehouseQuantity: {
        $sum: '$warehouseQuantity'
      }
    }
  }, {
    $project: {
      _id: 0,
      platform: 1,
      childAsin: '$_id',
      childTitle: 1,
      parentAsin: 1,
      parentTitle: 1,
      numberOfOrders: 1,
      childUnitsSold: 1,
      childUnitsShipped: 1,
      childItemTax: 1,
      childPromotionDiscount: 1,
      childSalesAmount: 1,
      childSkus: 1,
      parentImage: 1,
      childImage: 1,
      fulfillmentFee: 1,
      referralFee: 1,
      fbaPickAndPack: 1,
      fbaWeightHandling: 1,
      fbaOrderHandling: 1,
      variableClosingFee: 1,
      perItemFee: 1,
      fbaHandlingCost: 1,
      fbmShippingCost: 1,
      shipToFbaCost: 1,
      cogs: 1,
      adSpend: 1,
      profit: 1,
      productMargin: 1,
      mfnFulfillableQuantity: 1,
      afnFulfillableQuantity: 1,
      afnInboundQuantity: 1,
      afnReservedQuantity: 1,
      afnUnfulfillableQuantity: 1,
      afnResearchingQuantity: 1,
      afnTotalQuantity: 1,
      afnFutureSupplyBuyable: 1,
      afnReservedFutureSupply: 1,
      warehouseQuantity: 1
    }
  }, {
    $group: {
      _id: '$parentAsin',
      title: {
        $first: '$parentTitle'
      },
      numberOfOrders: {
        $sum: '$numberOfOrders'
      },
      parentUnitsSold: {
        $sum: '$childUnitsSold'
      },
      parentUnitsShipped: {
        $sum: '$childUnitsShipped'
      },
      parentItemTax: {
        $sum: '$childItemTax'
      },
      parentPromotionDiscount: {
        $sum: '$childPromotionDiscount'
      },
      parentSalesAmount: {
        $sum: '$childSalesAmount'
      },
      parentImage: {
        $first: '$parentImage'
      },
      childAsins: {
        $addToSet: {
          childAsin: '$childAsin',
          title: '$childTitle',
          childImage: '$childImage',
          numberOfOrders: '$numberOfOrders',
          childUnitsSold: '$childUnitsSold',
          childUnitsShipped: '$childUnitsShipped',
          childItemTax: '$childItemTax',
          childPromotionDiscount: '$childPromotionDiscount',
          childSalesAmount: '$childSalesAmount',
          childSkus: '$childSkus',
          fulfillmentFee: '$fulfillmentFee',
          referralFee: '$referralFee',
          fbaPickAndPack: '$fbaPickAndPack',
          fbaWeightHandling: '$fbaWeightHandling',
          fbaOrderHandling: '$fbaOrderHandling',
          variableClosingFee: '$variableClosingFee',
          perItemFee: '$perItemFee',
          fbaHandlingCost: '$fbaHandlingCost',
          fbmShippingCost: '$fbmShippingCost',
          shipToFbaCost: '$shipToFbaCost',
          cogs: '$cogs',
          adSpend: '$adSpend',
          profit: '$profit',
          productMargin: '$productMargin',
          mfnFulfillableQuantity: '$mfnFulfillableQuantity',
          afnFulfillableQuantity: '$afnFulfillableQuantity',
          afnInboundQuantity: '$afnInboundQuantity',
          afnReservedQuantity: '$afnReservedQuantity',
          afnUnfulfillableQuantity: '$afnUnfulfillableQuantity',
          afnResearchingQuantity: '$afnResearchingQuantity',
          afnTotalQuantity: '$afnTotalQuantity',
          afnFutureSupplyBuyable: '$afnFutureSupplyBuyable',
          afnReservedFutureSupply: '$afnReservedFutureSupply',
          warehouseQuantity: '$warehouseQuantity'
        }
      },
      fulfillmentFee: {
        $sum: '$fulfillmentFee'
      },
      referralFee: {
        $sum: '$referralFee'
      },
      fbaPickAndPack: {
        $sum: '$fbaPickAndPack'
      },
      fbaWeightHandling: {
        $sum: '$fbaWeightHandling'
      },
      fbaOrderHandling: {
        $sum: '$fbaOrderHandling'
      },
      variableClosingFee: {
        $sum: '$variableClosingFee'
      },
      perItemFee: {
        $sum: '$perItemFee'
      },
      fbaHandlingCost: {
        $sum: '$fbaHandlingCost'
      },
      fbmShippingCost: {
        $sum: '$fbmShippingCost'
      },
      shipToFbaCost: {
        $sum: '$shipToFbaCost'
      },
      cogs: {
        $sum: '$cogs'
      },
      adSpend: {
        $sum: '$adSpend'
      },
      isSellableAsin: {
        $first: {
          $cond: {
            if: {
              $eq: [
                '$parentAsin',
                '$childAsin'
              ]
            },
            then: true,
            else: false
          }
        }
      },
      profit: {
        $sum: '$profit'
      },
      productMargin: {
        $sum: '$productMargin'
      },
      mfnFulfillableQuantity: {
        $sum: '$mfnFulfillableQuantity'
      },
      afnFulfillableQuantity: {
        $sum: '$afnFulfillableQuantity'
      },
      afnInboundQuantity: {
        $sum: '$afnInboundQuantity'
      },
      afnReservedQuantity: {
        $sum: '$afnReservedQuantity'
      },
      afnUnfulfillableQuantity: {
        $sum: '$afnUnfulfillableQuantity'
      },
      afnResearchingQuantity: {
        $sum: '$afnResearchingQuantity'
      },
      afnTotalQuantity: {
        $sum: '$afnTotalQuantity'
      },
      afnFutureSupplyBuyable: {
        $sum: '$afnFutureSupplyBuyable'
      },
      afnReservedFutureSupply: {
        $sum: '$afnReservedFutureSupply'
      },
      warehouseQuantity: {
        $sum: '$warehouseQuantity'
      }
    }
  }, {
    $project: {
      _id: 0,
      title: 1,
      parentAsin: '$_id',
      isSellableAsin: 1,
      numberOfOrders: 1,
      parentUnitsSold: 1,
      parentUnitsShipped: 1,
      parentItemTax: 1,
      parentPromotionDiscount: 1,
      parentSalesAmount: 1,
      childAsins: 1,
      parentImage: 1,
      fulfillmentFee: 1,
      referralFee: 1,
      fbaPickAndPack: 1,
      fbaWeightHandling: 1,
      fbaOrderHandling: 1,
      variableClosingFee: 1,
      perItemFee: 1,
      fbaHandlingCost: 1,
      fbmShippingCost: 1,
      shipToFbaCost: 1,
      cogs: 1,
      adSpend: 1,
      profit: 1,
      productMargin: 1,
      mfnFulfillableQuantity: 1,
      afnFulfillableQuantity: 1,
      afnInboundQuantity: 1,
      afnReservedQuantity: 1,
      afnUnfulfillableQuantity: 1,
      afnResearchingQuantity: 1,
      afnTotalQuantity: 1,
      afnFutureSupplyBuyable: 1,
      afnReservedFutureSupply: 1,
      warehouseQuantity: 1
    }
  }, {
    $match: parentSelector
  }, {
    $facet: {
      total: [{
        $group: {
          _id: null,
          count: {
            $sum: 1
          }
        }
      }],
      dashboardData: parentAggregate
    }
  }, {
    $unwind: {
      path: '$total'
    }
  }]);

  return { dashboardData: perDay?.dashboardData || [], total: perDay?.total?.count || 0 };
};

export default GetDashboardData;
