import express from "express";
import { auth } from "../middleware/auth";
import Order from "../models/Order";
import { checkAIServiceHealth } from "../utils/aiService";

const router = express.Router();

// Get available time slots
router.get("/available", async (req, res) => {
  try {
    // Define standard time slots
    const standardTimeSlots = [
      { id: "morning", name: "Morning (8:00 AM - 12:00 PM)", available: true },
      {
        id: "afternoon",
        name: "Afternoon (12:00 PM - 4:00 PM)",
        available: true,
      },
      { id: "evening", name: "Evening (4:00 PM - 8:00 PM)", available: true },
    ];

    // In a real application, we would check capacity for each time slot
    // For now, we'll just return all time slots as available
    res.json(standardTimeSlots);
  } catch (error) {
    console.error("Error fetching time slots:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get time slot distribution (for admin dashboard)
router.get("/distribution", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Get counts for each time slot
    const morningCount = await Order.countDocuments({
      predictedTimeSlot: "morning",
    });
    const afternoonCount = await Order.countDocuments({
      predictedTimeSlot: "afternoon",
    });
    const eveningCount = await Order.countDocuments({
      predictedTimeSlot: "evening",
    });

    // Return distribution
    res.json({
      morning: morningCount,
      afternoon: afternoonCount,
      evening: eveningCount,
      total: morningCount + afternoonCount + eveningCount,
    });
  } catch (error) {
    console.error("Error fetching time slot distribution:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Check AI service health
router.get("/ai-health", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const isHealthy = await checkAIServiceHealth();

    res.json({
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error checking AI service health:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get time slot efficiency (for admin dashboard)
router.get("/efficiency", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Get all delivered orders
    const deliveredOrders = await Order.find({
      status: "delivered",
      deliveredAt: { $ne: null },
    });

    // Calculate efficiency metrics
    const timeSlotMetrics = {
      morning: { count: 0, avgDeliveryTime: 0, totalDeliveryTime: 0 },
      afternoon: { count: 0, avgDeliveryTime: 0, totalDeliveryTime: 0 },
      evening: { count: 0, avgDeliveryTime: 0, totalDeliveryTime: 0 },
    };

    deliveredOrders.forEach((order) => {
      const slot = order.predictedTimeSlot;
      const deliveryTime =
        new Date(order.deliveredAt).getTime() -
        new Date(order.createdAt).getTime();

      timeSlotMetrics[slot].count++;
      timeSlotMetrics[slot].totalDeliveryTime += deliveryTime;
    });

    // Calculate averages
    Object.keys(timeSlotMetrics).forEach((slot) => {
      if (timeSlotMetrics[slot].count > 0) {
        timeSlotMetrics[slot].avgDeliveryTime =
          timeSlotMetrics[slot].totalDeliveryTime / timeSlotMetrics[slot].count;
      }
    });

    // Return efficiency metrics
    res.json({
      timeSlotMetrics,
      totalDelivered: deliveredOrders.length,
    });
  } catch (error) {
    console.error("Error fetching time slot efficiency:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
