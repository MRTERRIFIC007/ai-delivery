"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.auth = void 0;
// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";
// Middleware to authenticate JWT token
const auth = (req, res, next) => {
    var _a;
    try {
        // For development/testing purposes, we'll use a simple middleware
        // that doesn't actually validate tokens
        // Get token from header
        const token = (_a = req.header("Authorization")) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        if (!token) {
            // For testing, if no token, we'll create a test user
            req.user = {
                id: "507f1f77bcf86cd799439011", // Valid MongoDB ObjectId format
                role: "admin",
                email: "test@example.com",
                name: "Test User",
            };
            return next();
        }
        // In a real application, we would verify the token
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // req.user = decoded;
        // For testing, we'll just create a user based on the token
        req.user = {
            id: "507f1f77bcf86cd799439011", // Valid MongoDB ObjectId format
            role: "admin",
            email: "test@example.com",
            name: "Test User",
        };
        next();
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        res.status(401).json({ message: "Authentication failed" });
    }
};
exports.auth = auth;
// Middleware to check if user has required role
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required." });
        }
        if (!roles.includes(req.user.role)) {
            return res
                .status(403)
                .json({ message: "Access denied. Insufficient permissions." });
        }
        next();
    };
};
exports.authorize = authorize;
