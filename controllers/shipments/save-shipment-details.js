import moment from 'moment';
import { Shipment } from '../../models';

const SaveShipmentDetails = async ({
  orderId,
  orderNumber,
  fulfillmentPlanId,
  orderDate,
  shipDate,
  shipmentItems,
  soldTo,
  shipTos,
  amountSummary,
  socNumber
}) => {
  await Shipment.updateOne({
    orderId
  }, {
    $set: {
      ...(orderNumber && { orderNumber }),
      ...(orderDate && { orderDate: moment(orderDate).toDate() }),
      ...(fulfillmentPlanId && { fulfillmentPlanId }),
      ...(shipDate && { shipDate: moment(shipDate).toDate() }),
      ...(shipmentItems && { shipmentItems }),
      ...(soldTo && { soldTo }),
      ...(shipTos && { shipTos }),
      ...(amountSummary && { amountSummary }),
      ...(socNumber && { socNumber })
    }
  }, {
    upsert: true
  });

  return { message: 'Shipments saved successfully!' };
};

export default SaveShipmentDetails;
