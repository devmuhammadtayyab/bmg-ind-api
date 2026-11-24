import { ShipmentConfig } from '../../models';

const SaveShipmentConfig = async ({
  fulfillmentPlanId,
  ...rest
}) => {
  await ShipmentConfig.updateOne({
    fulfillmentPlanId
  }, {
    $set: {
      ...rest
    }
  }, {
    upsert: true
  });

  return { message: 'Shipment config saved successfully!' };
};

export default SaveShipmentConfig;
