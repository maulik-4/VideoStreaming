const jwt = require('jsonwebtoken');
const User = require('../Modals/user');
require('dotenv').config();
const auth = async (req, res, next) => {
    const secretKey = process.env.secretKey;
    console.log('Secret Key:', process.env.SECRET_KEY);


    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const decoded = jwt.verify(token, secretKey);
        const user = await User.findById(decoded.userId);

        if (!user) return res.status(401).json({ message: "Invalid token" });
        if (user.isBlocked) {
            return res.status(403).json({ message: "Your account has been blocked" });
          }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: "Unauthorized" });
    }
};

module.exports = auth;
