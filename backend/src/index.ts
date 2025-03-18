import express, { Express, Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fetch from "node-fetch";

// Import routes
import userRoutes from "./routes/userRoutes";
import orderRoutes from "./routes/orderRoutes";
import deliveryRoutes from "./routes/deliveryRoutes";
import timeSlotRoutes from "./routes/timeSlotRoutes";
import predictionRoutes from "./routes/predictionRoutes";

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.log(
        "No MongoDB URI provided. Starting server without database connection for development"
      );
      return;
    }

    console.log("Attempting to connect to MongoDB...");
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    console.log("Starting server without database connection for development");
  }
};

// Connect to MongoDB
connectDB();

// Create a utility to check if AI services are available
const checkAIServiceHealth = async (
  serviceUrl: string,
  maxRetries = 3
): Promise<boolean> => {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const response = await fetch(`${serviceUrl}/health`, {
        method: "GET",
        timeout: 1000, // Short timeout to avoid blocking
      });

      if (response.ok) {
        return true;
      }
    } catch (error) {
      attempts++;
      if (attempts === maxRetries) {
        return false;
      }
      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return false;
};

// Set up periodic health checks for AI services
let aiPredictionServiceAvailable = false;
let routeOptimizationServiceAvailable = false;
let lastAIHealthCheck = 0;
const AI_HEALTH_CHECK_INTERVAL = 60000; // Check every minute

const checkAIServicesHealth = async () => {
  const now = Date.now();

  // Only check every minute to avoid logging too much
  if (now - lastAIHealthCheck < AI_HEALTH_CHECK_INTERVAL) {
    return {
      aiPrediction: aiPredictionServiceAvailable,
      routeOptimization: routeOptimizationServiceAvailable,
    };
  }

  lastAIHealthCheck = now;

  // Check time slot prediction service
  aiPredictionServiceAvailable = await checkAIServiceHealth(
    "http://localhost:5015"
  );
  if (!aiPredictionServiceAvailable) {
    console.log("AI time slot prediction service is not available");
  } else if (!aiPredictionServiceAvailable) {
    console.log("AI time slot prediction service is now available");
  }

  // Check route optimization service
  routeOptimizationServiceAvailable = await checkAIServiceHealth(
    "http://localhost:5017"
  );
  if (!routeOptimizationServiceAvailable) {
    console.log("Route optimization service is not available");
  } else if (!routeOptimizationServiceAvailable) {
    console.log("Route optimization service is now available");
  }

  return {
    aiPrediction: aiPredictionServiceAvailable,
    routeOptimization: routeOptimizationServiceAvailable,
  };
};

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to OptiDeliver API" });
});

// Health check route
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    server: "running",
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// API health check route
app.get("/api/health", (req: Request, res: Response) => {
  // Run AI health check without waiting
  checkAIServicesHealth();

  res.json({
    status: "healthy",
    server: "running",
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    aiServices: {
      timeslotPrediction: aiPredictionServiceAvailable
        ? "available"
        : "unavailable",
      routeOptimization: routeOptimizationServiceAvailable
        ? "available"
        : "unavailable",
    },
    timestamp: new Date().toISOString(),
  });
});

// Mock auth middleware for development when DB is not available
app.use((req: Request, res: Response, next) => {
  if (
    mongoose.connection.readyState !== 1 &&
    process.env.NODE_ENV === "development"
  ) {
    console.log("Using mock authentication in development mode");
    // Add mock user data to request for development
    (req as any).user = {
      _id: "123456789",
      name: "Development User",
      email: "dev@example.com",
      role: "sender",
    };
  }
  next();
});

// Apply routes
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/timeslots", timeSlotRoutes);
app.use("/api/predictions", predictionRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
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
