const cache = {};

export const setCache = (key, data, ttlSeconds = 30) => {
  cache[key] = {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  };
};

export const getCache = (key) => {
  const item = cache[key];
  if (!item) return null;
  if (Date.now() > item.expiry) {
    delete cache[key];
    return null;
  }
  return item.data;
};