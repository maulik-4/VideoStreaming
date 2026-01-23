const { createClient } = require("redis");

// If REDIS_URL is not provided, export a no-op client so the app can run without Redis.
if (!process.env.REDIS_URL) {
  console.warn('REDIS_URL not set — running without Redis (in-memory/no-op).');
  const noopClient = {
    async get() { return null; },
    async set() { return null; },
    async del() { return null; },
    async connect() { return null; },
    on() { return null; }
  };
  module.exports = noopClient;
} else {
  const redisClient = createClient({ url: process.env.REDIS_URL });

  redisClient.on("error", (err) => {
    console.error("Redis error:", err);
  });

  (async () => {
    try {
      await redisClient.connect();
      console.log("Redis connected successfully");
    } catch (err) {
      console.error('Redis connection failed:', err);
      console.warn('Continuing without Redis — caching disabled.');
    }
  })();

  module.exports = redisClient;
}
