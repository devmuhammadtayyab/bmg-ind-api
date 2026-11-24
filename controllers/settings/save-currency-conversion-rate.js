import { Setting } from '../../models';

const SaveCurrencyConversionRate = async ({
  userId,
  settingId,
  currencyConversionRateUsd
}) => {
  await Setting.updateOne({
    userId,
    ...(settingId && { _id: settingId })
  }, {
    $set: {
      currencyConversionRateUsd
    }
  }, { upsert: true });

  return { message: 'Conversion rate updated successfully!' };
};

export default SaveCurrencyConversionRate;
