# BMG API

API for the BMG ShipStation extension. It stores boxes, shipment settings, product costs, and packing-slip data in MongoDB, and uploads files to S3.

## Setup

```bash
npm install
cp .env.example .env
npm start
```

The app loads variables from a local `.env` file. That file is gitignored. `.env.example` is the template: it lists every name the server expects, with empty or local placeholder values. Fill in your own values after copying it. Do not commit `.env`.

| Variable | What to put |
| --- | --- |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URL` | MongoDB connection string |
| `PORT` | Port the API listens on. The extension expects `4200` |
| `HASHING_SECRET_KEY` | Secret used to decrypt passwords and sign JWTs |
| `SALT_ROUNDS` | bcrypt salt rounds, for example `10` |
| `SLACK_URL` | Slack incoming webhook for server error reports. Leave blank to skip Slack |
| `AWS_ACCESS_KEY_ID` | AWS access key used by S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key used by S3 |
| `AWS_REGION` | AWS region of the S3 bucket |
| `SIGNATURE_VERSION` | AWS signature version, if your S3 client requires one |
| `S3_BUCKET_NAME` | Bucket name for uploaded files |
| `JOBS_URL` | Base URL of the jobs service used by cost uploads and tracking updates |

## Scripts

- `npm start` runs the API with nodemon
- `npm run prod:build` writes a production bundle to `dist`
- `npm run test:parity` runs the local response checks
