const jwt = require('jsonwebtoken');
const User = require('../Modals/user');

class AuthMiddleware {
  constructor() {
    this.SECRET_KEY = process.env.SECRET_KEY;
  }

  async authenticate(req, res, next) {
    try {
      console.log('🔐 Authentication middleware called');
      
      // Try to get token from cookies first
      let token = req.cookies.token;
      
      // If not in cookies, try Authorization header
      if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.slice(7);
          console.log('✅ Token found in Authorization header');
        }
      }
      
      if (!token) {
        console.warn('❌ No token found in cookies or headers');
        return res.status(401).json({ message: "Unauthorized - No token" });
      }

      console.log('🔑 Verifying token...');
      const decoded = jwt.verify(token, this.SECRET_KEY);
      console.log('✅ Token verified, userId:', decoded.userId);
      
      const user = await User.findById(decoded.userId);

      if (!user) {
        console.error('❌ User not found for token');
        return res.status(401).json({ message: "Invalid token" });
      }
      
      if (user.isBlocked) {
        console.warn('❌ User is blocked');
        return res.status(403).json({ message: "Your account has been blocked" });
      }

      // Check device ID from cookies/headers against the one in token
      // BUT only if the deviceId was included in the token
      const deviceId = req.get('X-Device-ID') || req.cookies.deviceId;
      if (decoded.deviceId && (!deviceId || deviceId !== decoded.deviceId)) {
        console.warn('❌ Device ID mismatch');
        return res.status(401).json({ message: "Session invalid. Please login again." });
      }

      req.user = user;
      console.log('✅ User authenticated:', user._id);
      next();
    } catch (err) {
      console.error("❌ Auth middleware error:", err.message);
      res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
  }
}

module.exports = new AuthMiddleware();