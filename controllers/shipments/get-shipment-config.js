import { ShipmentConfig } from '../../models';

const GetShipmentConfig = async ({
  fulfillmentPlanId
}) => {
  const shipmentConfig = await ShipmentConfig.findOne({
    fulfillmentPlanId
  }).select({
    _id: 0,
    __v: 0,
    createdAt: 0,
    updatedAt: 0
  });

  return { message: 'Get shipment config successfully!', shipmentConfig };
};

export default GetShipmentConfig;
