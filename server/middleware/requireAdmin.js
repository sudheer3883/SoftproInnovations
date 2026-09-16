const jwt = require("jsonwebtoken");

const getStoredToken = (req) => {
    const authorization = req.headers.authorization || "";
    return authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
};

const requireAdmin = (req, res, next) => {
    const token = getStoredToken(req);

    if (!token) {
        return res.status(401).json({ msg: "Admin authentication required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== "admin") {
            return res.status(403).json({ msg: "Admin access required" });
        }
        req.admin = decoded;
        return next();
    } catch {
        return res.status(401).json({ msg: "Invalid or expired admin session" });
    }
};

module.exports = requireAdmin;