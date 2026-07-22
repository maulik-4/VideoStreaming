import { createClient } from "redis";

const redisClient = createClient({
    url:
        process.env.REDIS_URL ??
        "redis://localhost:6379",
});

let isConnected = false;

redisClient.on("error", (error) => {
    isConnected = false;
    console.error(
        "Redis Error:",
        error.message
    );
});

redisClient.on("connect", () => {
    console.log("Redis connecting...");
});

redisClient.on("ready", () => {
    isConnected = true;
    console.log("Redis connected");
});

redisClient.on("end", () => {
    isConnected = false;
    console.log("Redis connection closed");
});

(async (): Promise<void> => {
    try {
        await redisClient.connect();
    } catch (error) {
        console.error(
            "Redis connection failed:",
            error
        );
        // Continue without Redis
    }
})();

export const isRedisConnected = (): boolean =>
    isConnected;

export default redisClient;