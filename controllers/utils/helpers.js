const getBoxNumber = (boxId) => parseInt(boxId?.split('-')?.[1] || 0, 10);

const getReplicaSku = (sku) => {
  if (sku == null) return '';

  let replica = String(sku);
  const unwanted = ['PK', 'FBM'];

  unwanted.forEach((token) => {
    const idx = replica?.toUpperCase()?.indexOf(token);
    if (idx !== -1) {
      replica = replica.substring(0, idx);
    }
  });

  replica = replica?.replace(/-+$/, '');

  return replica;
};

const generateReplicaSkus = (skus = []) => {
  const result = [];

  skus.forEach((sku) => {
    result.push(sku);
    const replica = getReplicaSku(sku);

    if (replica) {
      result.push(replica);
    }
  });

  return [...new Set(result)];
};

export { getBoxNumber, getReplicaSku, generateReplicaSkus };
