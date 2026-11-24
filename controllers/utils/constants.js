const BOX_TYPE = {
  SHIP_STATION: 'shipstation',
  CUSTOM: 'custom'
};

const JOBS_METHOD = {
  START_SINGLE_JOB: 'StartSingleJob'
};

const JOBS_NAME = {
  CREATE_VC_SHIPMENT: 'create-vc-shipment',
  PROCESS_FBA_HANDLING_COST: 'process-fba-handling-cost',
  PROCESS_FBM_SHIPPING_COST: 'process-fbm-shipping-cost',
  PROCESS_SHIP_TO_FBA_COST: 'process-ship-to-fba-cost',
  MARK_AS_SHIPPED: 'mark-as-shipped'
};

const SUBMISSION_STATUS = {
  CREATED: 'CREATED',
  NOT_CREATED: 'NOT_CREATED'
};

const STORE_TYPE = {
  AMAZON_SELLER_CENTRAL: 'amazon-seller-central',
  AMAZON_VENDOR_CENTRAL: 'amazon-vendor-central',
  AMAZON_ADVERTISING: 'amazon-advertising',
  NET_SUITE: 'net-suite',
  SHIP_STATION: 'ship-station'
};

export {
  BOX_TYPE,
  JOBS_METHOD,
  JOBS_NAME,
  SUBMISSION_STATUS,
  STORE_TYPE
};
