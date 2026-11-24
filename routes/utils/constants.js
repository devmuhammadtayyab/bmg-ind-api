const API_ENDPOINTS = {
  AUTH: {
    INDEX: '/auth',
    LOGIN: '/login'
  },
  DASHBOARD: {
    INDEX: '/dashboard',
    EXPORT_DASHBOARD_DATA: '/export-dashboard-data',
    GET_ALL_CHILD: '/get-all-child',
    GET_ALL_PARENTS: '/get-all-parents',
    GET_DASHBOARD_DATA: '/get-dashboard-data'
  },
  PRODUCT: {
    INDEX: '/product',
    UPLOAD_FBA_HANDLING_COST: '/upload-fba-handling-cost',
    UPLOAD_FBM_SHIPPING_COST: '/upload-fba-shipping-cost',
    UPLOAD_SHIP_TO_FBA_COST: '/upload-ship-to-fba-cost'
  },
  S3: {
    INDEX: '/s3',
    SIGNED_URL: '/signed-url'
  },
  SETTING: {
    ADD_TRACKING_NUMBER: '/add-tracking-number',
    INDEX: '/setting',
    GET_CURRENCY_CONVERSION_RATE: '/get-currency-conversion-rate',
    SAVE_CURRENCY_CONVERSION_RATE: '/save-currency-conversion-rate'
  },
  NON_SECURED_ROUTES: {
    ADD_CUSTOM_BOX: '/add-custom-box',
    CREATE_SHIPMENT: '/create-shipment',
    DELETE_BOXES: '/delete-boxes',
    DOWNLOAD_BOX_DETAILS: '/download-box-details',
    GET_BOX_ITEMS: '/get-box-items',
    GET_BOXES: '/get-boxes',
    GET_NO_BOXES: '/get-no-boxes',
    GET_PRODUCT_DIMENSIONS: '/get-product-dimensions',
    GET_SHIPMENT_CONFIG: '/get-shipment-config',
    RESET_QUANTITY_IN_BOX: '/reset-quantity-in-box',
    SAVE_BOX_ITEMS: '/save-box-items',
    SAVE_BOXES: '/save-boxes',
    SAVE_NO_BOX_ITEMS: '/save-no-box-items',
    SAVE_SHIPMENT_CONFIG: '/save-shipment-config',
    SAVE_SHIPMENT_DETAILS: '/save-shipment-details'
  }
};

const HTTP_CODES = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT_ERROR: 409,
  INTERNAL_SERVER_ERROR: 500
};

export { API_ENDPOINTS, HTTP_CODES };
