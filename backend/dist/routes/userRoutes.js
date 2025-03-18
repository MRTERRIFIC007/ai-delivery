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
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importStar(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Register a new user
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;
        // Check if user already exists
        let user = await User_1.default.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }
        // Create new user
        user = new User_1.default({
            name,
            email,
            password,
            phone,
            role: role || User_1.UserRole.SENDER,
        });
        // Save user to database
        await user.save();
        // Create JWT token
        const payload = {
            user: {
                id: user.id,
                role: user.role,
            },
        };
        jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || "default_secret", { expiresIn: "24h" }, (err, token) => {
            if (err)
                throw err;
            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        });
    }
    catch (error) {
        console.error("Error in user registration:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Login a user
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check for test user credentials
        if (email === "test@example.com" && password === "password") {
            const payload = {
                user: {
                    id: "test-user-id",
                    role: User_1.UserRole.ADMIN,
                },
            };
            jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || "default_secret", { expiresIn: "24h" }, (err, token) => {
                if (err)
                    throw err;
                res.json({
                    token,
                    user: {
                        id: "test-user-id",
                        name: "Test User",
                        email: "test@example.com",
                        role: User_1.UserRole.ADMIN,
                    },
                });
            });
            return;
        }
        // Check if user exists
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // Create JWT token
        const payload = {
            user: {
                id: user.id,
                role: user.role,
            },
        };
        jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || "default_secret", { expiresIn: "24h" }, (err, token) => {
            if (err)
                throw err;
            res.json({
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        });
    }
    catch (error) {
        console.error("Error in user login:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Get current user
router.get("/me", auth_1.auth, async (req, res) => {
    try {
        // Since we're in development mode with a simple auth middleware,
        // we'll just return the user from req.user
        res.json({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
        });
    }
    catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Get all users (admin only)
router.get("/", [auth_1.auth, (0, auth_1.authorize)([User_1.UserRole.ADMIN])], async (req, res) => {
    try {
        const users = await User_1.default.find().select("-password");
        res.json(users);
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Get user by ID
router.get("/:id", auth_1.auth, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Only allow admins or the user themselves to view their profile
        if (req.user.role !== User_1.UserRole.ADMIN && req.user.id !== user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }
        res.json(user);
    }
    catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Update user profile
router.put("/:id", auth_1.auth, async (req, res) => {
    try {
        const { name, phone, profilePicture } = req.body;
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Only allow admins or the user themselves to update their profile
        if (req.user.role !== User_1.UserRole.ADMIN && req.user.id !== user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }
        // Update fields
        if (name)
            user.name = name;
        if (phone)
            user.phone = phone;
        if (profilePicture)
            user.profilePicture = profilePicture;
        const updatedUser = await user.save();
        res.json({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            profilePicture: updatedUser.profilePicture,
        });
    }
    catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
