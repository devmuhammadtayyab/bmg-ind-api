import axios from 'axios';
import { Types } from 'mongoose';

import { CostsFileUploaded } from '../../models';

import { JOBS_METHOD, JOBS_NAME } from '../utils/constants';
import { COST_TYPES, STATUS_OF_COGS_FILE } from '../../utils/constants';

const { NODE_ENV, JOBS_URL } = process.env;

const UploadShipToFbaCost = async ({
  userId,
  fileName
}) => {
  await CostsFileUploaded.create({
    _id: new Types.ObjectId(),
    userId,
    fileName,
    type: COST_TYPES.SHIP_TO_FBA_COST,
    status: STATUS_OF_COGS_FILE.PENDING,
    uploadedDate: new Date()
  });

  if (NODE_ENV === 'production') {
    await axios.get(JOBS_URL, {
      params: {
        userId,
        fileName,
        method: JOBS_METHOD.START_SINGLE_JOB,
        jobName: JOBS_NAME.PROCESS_SHIP_TO_FBA_COST
      }
    });
  }

  return {
    message: 'Your File is in Processing!!'
  };
};

export default UploadShipToFbaCost;
