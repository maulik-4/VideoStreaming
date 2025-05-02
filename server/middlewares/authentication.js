const auth = async (req, res, next) => {
    const SECRET_KEY = process.env.SECRET_KEY;

    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findById(decoded.userId);

        if (!user) return res.status(401).json({ message: "Invalid token" });
        if (user.isBlocked) {
            return res.status(403).json({ message: "Your account has been blocked" });
        }

        // Check device ID from cookies/headers against the one in token
        const deviceId = req.get('X-Device-ID') || req.cookies.deviceId;
        if (!deviceId || deviceId !== decoded.deviceId) {
            return res.status(401).json({ message: "Session invalid. Please login again." });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ message: "Unauthorized" });
        console.error(err);
    }
};