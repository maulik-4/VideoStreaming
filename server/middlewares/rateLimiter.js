const redisClient = require('../Redis/redisClient');

class RateLimiter {
  /**
   * Create a rate limiter middleware
   * @param {Object} options - Configuration options
   * @param {number} options.windowMs - Time window in milliseconds
   * @param {number} options.maxRequests - Maximum number of requests per window
   * @param {string} options.keyPrefix - Redis key prefix for this limiter
   * @param {string} options.keyBy - 'ip' or 'user' - what to rate limit by
   * @param {string} options.message - Error message when limit exceeded
   */
  static createLimiter(options) {
    const {
      windowMs,
      maxRequests,
      keyPrefix,
      keyBy = 'ip',
      message = 'Too many requests, please try again later.'
    } = options;

    return async (req, res, next) => {
      try {
        // Determine the key based on keyBy option
        let identifier;
        
        if (keyBy === 'user') {
          // Rate limit by user ID (requires authentication)
          if (!req.user || !req.user._id) {
            return res.status(401).json({ 
              message: 'Authentication required for this endpoint' 
            });
          }
          identifier = req.user._id.toString();
        } else {
          // Rate limit by IP address
          identifier = req.ip || req.connection.remoteAddress || 'unknown';
        }

        const key = `${keyPrefix}:${identifier}`;
        const windowSeconds = Math.ceil(windowMs / 1000);

        // Get current count
        const current = await redisClient.get(key);
        const currentCount = current ? parseInt(current) : 0;

        if (currentCount >= maxRequests) {
          // Get TTL to tell user when they can retry
          const ttl = await redisClient.ttl(key);
          
          return res.status(429).json({
            message,
            retryAfter: ttl > 0 ? ttl : windowSeconds,
            limit: maxRequests,
            windowMs
          });
        }

        // Increment counter
        if (currentCount === 0) {
          // First request in window - set counter with expiration
          await redisClient.set(key, 1, { EX: windowSeconds });
        } else {
          // Increment existing counter
          await redisClient.incr(key);
        }

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentCount - 1));
        res.setHeader('X-RateLimit-Reset', Date.now() + (windowSeconds * 1000));

        next();
      } catch (error) {
        console.error('Rate limiter error:', error);
        // If Redis fails, allow the request to proceed (fail open)
        next();
      }
    };
  }

  // Predefined rate limiters for different use cases
  
  /**
   * Search API Rate Limiter: 20 requests/minute/user
   */
  static searchLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20,
      keyPrefix: 'ratelimit:search',
      keyBy: 'user',
      message: 'Too many search requests. Please try again in a minute.'
    });
  }

  /**
   * Auth Rate Limiter: 10 requests/minute/IP
   */
  static authLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
      keyPrefix: 'ratelimit:auth',
      keyBy: 'ip',
      message: 'Too many authentication attempts. Please try again in a minute.'
    });
  }

  /**
   * Comments Rate Limiter: 20 requests/minute/user
   */
  static commentsLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20,
      keyPrefix: 'ratelimit:comments',
      keyBy: 'user',
      message: 'Too many comment requests. Please try again in a minute.'
    });
  }

  /**
   * General API Rate Limiter (optional fallback)
   */
  static generalLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      keyPrefix: 'ratelimit:general',
      keyBy: 'ip',
      message: 'Too many requests. Please try again later.'
    });
  }
}

module.exports = RateLimiter;
