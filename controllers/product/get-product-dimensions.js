import {
  AssemblyItemCogs,
  InventoryImages,
  InventoryItemCogs
} from '../../models';
import { generateReplicaSkus } from '../utils/helpers';

const GetProductDimensions = async ({ sellerSkus: allSkus }) => {
  allSkus = generateReplicaSkus(allSkus);
  const inventoryImagesAndDimensionsData = await Promise.all(
    allSkus.map(async (sku) => {
      let netSuiteId;
      let shipStationSku;
      const assemblyItemCogs = await AssemblyItemCogs.findOne({ sellerSku: sku })
        .sort({ updatedAt: -1 });

      if (!assemblyItemCogs) {
        const inventoryItemCogs = await InventoryItemCogs.findOne({ sellerSku: sku })
          .sort({ updatedAt: -1 });

        if (!inventoryItemCogs) {
          return null;
        }

        ({ netSuiteId, sellerSku: shipStationSku } = inventoryItemCogs);
      } else {
        ({ netSuiteId, sellerSku: shipStationSku } = assemblyItemCogs);
      }

      const inventoryImage = await InventoryImages.findOne({
        netSuiteId
      }).sort({ updatedAt: -1 }).lean();

      if (!inventoryImage) {
        return null;
      }

      return {
        shipStationSku, ...inventoryImage
      };
    })
  );

  const inventoryImagesAndDimensions = inventoryImagesAndDimensionsData.filter(Boolean);

  return { productsWithDimensions: inventoryImagesAndDimensions };
};

export default GetProductDimensions;
