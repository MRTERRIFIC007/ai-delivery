"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.updateProfile = exports.getCurrentUser = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importStar(require("../models/User"));
// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_here";
const TOKEN_EXPIRY = "7d"; // Token expires in 7 days
// Generate JWT token
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, {
        expiresIn: TOKEN_EXPIRY,
    });
};
// Register a new user
const register = async (req, res) => {
    try {
        const { name, email, password, role, phone, address } = req.body;
        // Check if user already exists
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "User already exists with this email" });
            return;
        }
        // Create new user
        const user = new User_1.default({
            name,
            email,
            password,
            role: role || User_1.UserRole.SENDER, // Default to SENDER if not specified
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
    }
    catch (error) {
        res.status(500).json({
            message: "Error registering user",
            error: error.message,
        });
    }
};
exports.register = register;
// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if user exists
        const user = await User_1.default.findOne({ email });
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
    }
    catch (error) {
        res.status(500).json({
            message: "Error logging in",
            error: error.message,
        });
    }
};
exports.login = login;
// Get current user profile
const getCurrentUser = async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }
        const user = await User_1.default.findById(req.user.id).select("-password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({ user });
    }
    catch (error) {
        res.status(500).json({
            message: "Error fetching user profile",
            error: error.message,
        });
    }
};
exports.getCurrentUser = getCurrentUser;
// Update user profile
const updateProfile = async (req, res) => {
    var _a;
    try {
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.id)) {
            res.status(401).json({ message: "Authentication required" });
            return;
        }
        const { name, phone, address } = req.body;
        // Find and update user
        const user = await User_1.default.findByIdAndUpdate(req.user.id, { name, phone, address }, { new: true, runValidators: true }).select("-password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.status(200).json({
            message: "Profile updated successfully",
            user,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Error updating profile",
            error: error.message,
        });
    }
};
exports.updateProfile = updateProfile;
// Get all users (admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await User_1.default.find().select("-password");
        res.status(200).json({ users });
    }
    catch (error) {
        res.status(500).json({
            message: "Error fetching users",
            error: error.message,
        });
    }
};
exports.getAllUsers = getAllUsers;
