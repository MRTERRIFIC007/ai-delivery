import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { UserRole } from "../models/User";
import { auth, authorize } from "../middleware/auth";

const router = express.Router();

// Register a new user
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      phone,
      role: role || UserRole.SENDER,
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

    jwt.sign(
      payload,
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }
    );
  } catch (error) {
    console.error("Error in user registration:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login a user
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check for test user credentials
    if (email === "test@example.com" && password === "password") {
      const payload = {
        user: {
          id: "test-user-id",
          role: UserRole.ADMIN,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: "24h" },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: {
              id: "test-user-id",
              name: "Test User",
              email: "test@example.com",
              role: UserRole.ADMIN,
            },
          });
        }
      );
      return;
    }

    // Check if user exists
    const user = await User.findOne({ email });
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

    jwt.sign(
      payload,
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "24h" },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }
    );
  } catch (error) {
    console.error("Error in user login:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get current user
router.get("/me", auth, async (req: Request, res: Response) => {
  try {
    // Since we're in development mode with a simple auth middleware,
    // we'll just return the user from req.user
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all users (admin only)
router.get(
  "/",
  [auth, authorize([UserRole.ADMIN])],
  async (req: Request, res: Response) => {
    try {
      const users = await User.find().select("-password");
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get user by ID
router.get("/:id", auth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only allow admins or the user themselves to view their profile
    if (req.user.role !== UserRole.ADMIN && req.user.id !== user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user profile
router.put("/:id", auth, async (req: Request, res: Response) => {
  try {
    const { name, phone, profilePicture } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only allow admins or the user themselves to update their profile
    if (req.user.role !== UserRole.ADMIN && req.user.id !== user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (profilePicture) user.profilePicture = profilePicture;

    const updatedUser = await user.save();

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      profilePicture: updatedUser.profilePicture,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
