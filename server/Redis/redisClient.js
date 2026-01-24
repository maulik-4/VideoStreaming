const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

let isConnected = false;

redisClient.on("error", (err) => {
  console.error("Redis error:", err.message);
  isConnected = false;
});

redisClient.on("connect", () => {
  console.log("Redis connecting...");
});

redisClient.on("ready", () => {
  console.log("✓ Redis connected successfully");
  isConnected = true;
});

redisClient.on("end", () => {
  console.log("Redis disconnected");
  isConnected = false;
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("⚠ Redis connection failed:", err.message);
    console.log("⚠ Application will continue without Redis (caching & rate limiting disabled)");
  }
})();

// Helper to check if Redis is connected
redisClient.isConnected = () => isConnected;

module.exports = redisClient;
