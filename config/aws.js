import { S3Client } from '@aws-sdk/client-s3';
import { fromEnv } from '@aws-sdk/credential-providers';

const {
  AWS_REGION: region
} = process.env;

const s3Client = new S3Client({
  region,
  credentials: fromEnv()
});

export { s3Client };
