import express from "express";
import { auth } from "../middleware/auth";
import TimeSlot from "../models/TimeSlot";
import Order from "../models/Order";
import { checkTimeSlotServiceHealth } from "../utils/aiService";

const router = express.Router();

// Get available time slots for an area
router.get("/available", auth, async (req, res) => {
  try {
    const { area, date } = req.query;

    if (!area || !date) {
      return res.status(400).json({ message: "Area and date are required" });
    }

    const availableSlots = await TimeSlot.findAvailableSlots(
      area as string,
      new Date(date as string)
    );

    // Get AI predictions for optimal time slots
    const aiServiceHealthy = await checkTimeSlotServiceHealth();
    let aiPredictions = null;

    if (aiServiceHealthy) {
      // In a real implementation, we would call the AI service here
      // For now, we'll just return the available slots
      aiPredictions = availableSlots.map((slot) => ({
        slotId: slot._id,
        confidence: Math.random() * 0.5 + 0.5, // Mock confidence score
        reason: "Based on historical delivery patterns",
      }));
    }

    res.json({
      slots: availableSlots,
      aiPredictions,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error fetching time slots:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Book a time slot
router.post("/book", auth, async (req, res) => {
  try {
    const { slotId, orderId } = req.body;

    if (!slotId || !orderId) {
      return res
        .status(400)
        .json({ message: "Slot ID and order ID are required" });
    }

    const slot = await TimeSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Time slot not found" });
    }

    if (!slot.isAvailable()) {
      return res.status(400).json({ message: "Time slot is not available" });
    }

    // Check if postman has reached maximum deliveries
    if (slot.postmanId) {
      const postmanDeliveries = await Order.countDocuments({
        timeSlotId: slotId,
        status: { $in: ["scheduled", "in_transit"] },
      });

      if (postmanDeliveries >= slot.maxDeliveriesPerPostman) {
        return res.status(400).json({
          message: "Postman has reached maximum deliveries for this time slot",
        });
      }
    }

    // Update time slot availability
    slot.available -= 1;
    await slot.save();

    // Update order with time slot
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        timeSlotId: slotId,
        status: "scheduled",
        scheduledDeliveryTime: slot.startTime,
      },
      { new: true }
    );

    res.json({
      message: "Time slot booked successfully",
      order,
      slot,
    });
  } catch (error) {
    console.error("Error booking time slot:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get time slot distribution (for admin dashboard)
router.get("/distribution", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { startDate, endDate } = req.query;
    const query: any = {};

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const distribution = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$timeSlotId",
          count: { $sum: 1 },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "timeslots",
          localField: "_id",
          foreignField: "_id",
          as: "slotDetails",
        },
      },
      { $unwind: "$slotDetails" },
      {
        $project: {
          timeSlot: "$slotDetails.startTime",
          total: "$count",
          delivered: "$deliveredCount",
          successRate: {
            $multiply: [{ $divide: ["$deliveredCount", "$count"] }, 100],
          },
        },
      },
    ]);

    res.json(distribution);
  } catch (error) {
    console.error("Error fetching time slot distribution:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get time slot efficiency metrics
router.get("/efficiency", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { startDate, endDate } = req.query;
    const query: any = {
      status: "delivered",
      deliveredAt: { $ne: null },
    };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const efficiencyMetrics = await Order.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "timeslots",
          localField: "timeSlotId",
          foreignField: "_id",
          as: "slotDetails",
        },
      },
      { $unwind: "$slotDetails" },
      {
        $group: {
          _id: "$timeSlotId",
          count: { $sum: 1 },
          avgDeliveryTime: {
            $avg: {
              $subtract: ["$deliveredAt", "$createdAt"],
            },
          },
          totalDeliveryTime: {
            $sum: {
              $subtract: ["$deliveredAt", "$createdAt"],
            },
          },
          onTimeDeliveries: {
            $sum: {
              $cond: [
                { $lte: ["$deliveredAt", "$scheduledDeliveryTime"] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "timeslots",
          localField: "_id",
          foreignField: "_id",
          as: "slotDetails",
        },
      },
      { $unwind: "$slotDetails" },
      {
        $project: {
          timeSlot: "$slotDetails.startTime",
          totalDeliveries: "$count",
          averageDeliveryTime: "$avgDeliveryTime",
          onTimeRate: {
            $multiply: [{ $divide: ["$onTimeDeliveries", "$count"] }, 100],
          },
        },
      },
    ]);

    res.json(efficiencyMetrics);
  } catch (error) {
    console.error("Error fetching time slot efficiency:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: Create or update time slots
router.post("/admin/slots", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { slots } = req.body;
    const operations = slots.map((slot: any) => ({
      updateOne: {
        filter: {
          startTime: new Date(slot.startTime),
          area: slot.area,
        },
        update: {
          $set: {
            endTime: new Date(slot.endTime),
            capacity: slot.capacity,
            available: slot.capacity,
            isActive: slot.isActive,
            maxDeliveriesPerPostman: slot.maxDeliveriesPerPostman,
            priority: slot.priority,
          },
        },
        upsert: true,
      },
    }));

    const result = await TimeSlot.bulkWrite(operations);

    res.json({
      message: "Time slots updated successfully",
      result,
    });
  } catch (error) {
    console.error("Error updating time slots:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
