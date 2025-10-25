// Smart caching with TTL and invalidation
class SmartCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
  }

  set(key, value, ttlMs = 60000) {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    
    if (Date.now() > this.ttl.get(key)) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
  }
}

const globalCache = new SmartCache();
module.exports = { SmartCache, globalCache };