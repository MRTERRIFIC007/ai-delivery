import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../models/User";
import User from "../models/User";
import mongoose from "mongoose";

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        role: string;
        email?: string;
        name?: string;
      };
    }
  }
}

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";

// Interface for decoded JWT token
interface DecodedToken {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

// Middleware to authenticate JWT token
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    // Check if user exists in database
    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid user ID in token",
      });
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found or token invalid",
      });
    }

    // Set user in request
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

// Middleware to check if user has required role
export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};
