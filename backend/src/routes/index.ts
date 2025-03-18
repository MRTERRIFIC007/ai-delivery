import express from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import orderRoutes from "./orderRoutes";
import deliveryRoutes from "./deliveryRoutes";
import timeSlotRoutes from "./timeSlotRoutes";
import { recordTimeSlotPreference } from "../controllers/timeSlotController";
import { auth } from "../middleware/auth";

const router = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/orders", orderRoutes);
router.use("/deliveries", deliveryRoutes);
router.use("/timeslots", timeSlotRoutes);

// Special route for recording time slot preferences (learning)
router.post("/timeslot-preferences", auth, recordTimeSlotPreference);

export default router;
