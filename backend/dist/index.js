"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import routes
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const deliveryRoutes_1 = __importDefault(require("./routes/deliveryRoutes"));
const timeSlotRoutes_1 = __importDefault(require("./routes/timeSlotRoutes"));
// Load environment variables
dotenv_1.default.config();
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5003;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// MongoDB Connection
const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.log("No MongoDB URI provided. Starting server without database connection for development");
            return;
        }
        console.log("Attempting to connect to MongoDB...");
        const conn = await mongoose_1.default.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error("Error connecting to MongoDB:", error);
        console.log("Starting server without database connection for development");
    }
};
// Connect to MongoDB
connectDB();
// Routes
app.get("/", (req, res) => {
    res.json({ message: "Welcome to OptiDeliver API" });
});
// Health check route
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        server: "running",
        mongodb: mongoose_1.default.connection.readyState === 1 ? "connected" : "disconnected",
        timestamp: new Date().toISOString(),
    });
});
// Mock auth middleware for development when DB is not available
app.use((req, res, next) => {
    if (mongoose_1.default.connection.readyState !== 1 &&
        process.env.NODE_ENV === "development") {
        console.log("Using mock authentication in development mode");
        // Add mock user data to request for development
        req.user = {
            _id: "123456789",
            name: "Development User",
            email: "dev@example.com",
            role: "sender",
        };
    }
    next();
});
// Apply routes
app.use("/api/users", userRoutes_1.default);
app.use("/api/orders", orderRoutes_1.default);
app.use("/api/deliveries", deliveryRoutes_1.default);
app.use("/api/timeslots", timeSlotRoutes_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Something went wrong!",
        error: process.env.NODE_ENV === "development"
            ? err.message
            : "Internal Server Error",
    });
});
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API accessible at http://localhost:${PORT}`);
    console.log(`Health check at http://localhost:${PORT}/health`);
});
