import { Request, Response, NextFunction, RequestHandler } from "express";
import redisClient from "../Redis/redisClient";

interface RateLimiterOptions {
    windowMs: number;
    maxRequests: number;
    keyPrefix: string;
    keyBy?: "ip" | "user";
    message?: string;
}

class RateLimiter {
    public static createLimiter(
        options: RateLimiterOptions
    ): RequestHandler {
        const {
            windowMs,
            maxRequests,
            keyPrefix,
            keyBy = "ip",
            message = "Too many requests, please try again later.",
        } = options;

        return async (
            req: Request,
            res: Response,
            next: NextFunction
        ): Promise<void> => {
            try {
                let identifier: string;

                if (keyBy === "user") {
                    if (!req.user?._id) {
                        res.status(401).json({
                            message:
                                "Authentication required for this endpoint",
                        });
                        return;
                    }

                    identifier = req.user._id.toString();
                } else {
                    identifier =
                        req.ip ||
                        req.socket.remoteAddress ||
                        "unknown";
                }

                const key = `${keyPrefix}:${identifier}`;
                const windowSeconds = Math.ceil(windowMs / 1000);

                const current = await redisClient.get(key);

                const currentCount = current
                    ? parseInt(current, 10)
                    : 0;

                if (currentCount >= maxRequests) {
                    const ttl = await redisClient.ttl(key);

                    res.status(429).json({
                        message,
                        retryAfter:
                            ttl > 0 ? ttl : windowSeconds,
                        limit: maxRequests,
                        windowMs,
                    });

                    return;
                }

                if (currentCount === 0) {
                    await redisClient.set(key, "1", {
                        EX: windowSeconds,
                    });
                } else {
                    await redisClient.incr(key);
                }

                res.setHeader(
                    "X-RateLimit-Limit",
                    maxRequests
                );

                res.setHeader(
                    "X-RateLimit-Remaining",
                    Math.max(
                        0,
                        maxRequests - currentCount - 1
                    )
                );

                res.setHeader(
                    "X-RateLimit-Reset",
                    Date.now() + windowSeconds * 1000
                );

                next();
            } catch {
                // Fail open if Redis is unavailable
                next();
            }
        };
    }

    public static searchLimiter(): RequestHandler {
        return this.createLimiter({
            windowMs: 60 * 1000,
            maxRequests: 20,
            keyPrefix: "ratelimit:search",
            keyBy: "user",
            message:
                "Too many search requests. Please try again in a minute.",
        });
    }

    public static authLimiter(): RequestHandler {
        return this.createLimiter({
            windowMs: 60 * 1000,
            maxRequests: 10,
            keyPrefix: "ratelimit:auth",
            keyBy: "ip",
            message:
                "Too many authentication attempts. Please try again in a minute.",
        });
    }

    public static commentsLimiter(): RequestHandler {
        return this.createLimiter({
            windowMs: 60 * 1000,
            maxRequests: 20,
            keyPrefix: "ratelimit:comments",
            keyBy: "user",
            message:
                "Too many comment requests. Please try again in a minute.",
        });
    }

    public static generalLimiter(): RequestHandler {
        return this.createLimiter({
            windowMs: 60 * 1000,
            maxRequests: 100,
            keyPrefix: "ratelimit:general",
            keyBy: "ip",
            message:
                "Too many requests. Please try again later.",
        });
    }
}

export default RateLimiter;