const NodeCache = require("node-cache");

// Cache with 5 minute TTL
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const cacheService = {
  get: (key) => cache.get(key),

  set: (key, data, ttl = 300) => cache.set(key, data, ttl),

  del: (key) => cache.del(key),

  flush: () => cache.flushAll(),

  // Middleware factory
  middleware: (key, ttl = 300) => (req, res, next) => {
    const cacheKey = `${key}_${JSON.stringify(req.query)}`;
    const cached   = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }
    res.sendCached = (data) => {
      cache.set(cacheKey, data, ttl);
      res.json(data);
    };
    next();
  },
};

module.exports = cacheService;