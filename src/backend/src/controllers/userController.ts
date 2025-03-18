import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUser, UserRole } from "../models/User";

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";
const TOKEN_EXPIRY = "7d"; // Token expires in 7 days

// Generate JWT token
const generateToken = (user: IUser): string => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
};

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User already exists with this email" });
      return;
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || UserRole.SENDER, // Default to SENDER if not specified
      phone,
      address,
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    // Return user data and token (excluding password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
    };

    res.status(201).json({
      message: "User registered successfully",
      user: userData,
      token,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error registering user",
      error: error.message,
    });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Generate token
    const token = generateToken(user);

    // Return user data and token (excluding password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
    };

    res.status(200).json({
      message: "Login successful",
      user: userData,
      token,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error logging in",
      error: error.message,
    });
  }
};

// Get current user profile
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ user });
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching user profile",
      error: error.message,
    });
  }
};

// Update user profile
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { name, phone, address } = req.body;

    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, address },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Error updating profile",
      error: error.message,
    });
  }
};

// Get all users (admin only)
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ users });
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching users",
      error: error.message,
    });
  }
};
