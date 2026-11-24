import { Setting } from '../../models';

const GetCurrencyConversionRate = async ({ userId }) => {
  const setting = await Setting.findOne({ userId, currencyConversionRateUsd: { $exists: true } });

  return { message: 'Conversion rate fetched successfully!', setting };
};

export default GetCurrencyConversionRate;
