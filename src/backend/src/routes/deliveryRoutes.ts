import express, { Request, Response } from "express";
import { auth, authorize } from "../middleware/auth";
import Order, { OrderStatus } from "../models/Order";
import User, { UserRole } from "../models/User";
import TimeSlot from "../models/TimeSlot";

const router = express.Router();

// Get all deliveries assigned to current delivery person
router.get("/my-deliveries", auth, async (req: Request, res: Response) => {
  try {
    // Check if user is a delivery person
    if (req.user.role !== UserRole.POSTMAN) {
      return res.status(403).json({ message: "Not a delivery person" });
    }

    // Get all orders assigned to this delivery person
    const deliveries = await Order.find({ assignedTo: req.user.id })
      .populate("sender", "name email phone")
      .populate("timeSlotId")
      .sort({ scheduledDeliveryTime: 1 });

    res.json(deliveries);
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get deliveries for today
router.get("/today", auth, async (req: Request, res: Response) => {
  try {
    // Check if user is a delivery person
    if (req.user.role !== UserRole.POSTMAN) {
      return res.status(403).json({ message: "Not a delivery person" });
    }

    // Calculate today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all orders assigned to this delivery person and scheduled for today
    const deliveries = await Order.find({
      assignedTo: req.user.id,
      scheduledDeliveryTime: {
        $gte: today,
        $lt: tomorrow,
      },
      status: {
        $in: [
          OrderStatus.CONFIRMED,
          OrderStatus.ASSIGNED,
          OrderStatus.IN_TRANSIT,
        ],
      },
    })
      .populate("sender", "name email phone")
      .populate("timeSlotId")
      .sort({ scheduledDeliveryTime: 1 });

    res.json(deliveries);
  } catch (error) {
    console.error("Error fetching today's deliveries:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update delivery status
router.put("/:id/status", auth, async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;

    // Check if user is a delivery person
    if (
      req.user.role !== UserRole.POSTMAN &&
      req.user.role !== UserRole.ADMIN
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Find the order
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if this delivery person is assigned to this order
    if (
      req.user.role === UserRole.POSTMAN &&
      (!order.assignedTo || order.assignedTo.toString() !== req.user.id)
    ) {
      return res.status(403).json({ message: "Not assigned to this delivery" });
    }

    // Update status
    order.status = status;

    // Add notes if provided
    if (notes) {
      order.notes = notes;
    }

    // If status is "delivered", set deliveredAt
    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }

    // Save the updated order
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating delivery status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get available time slots for a delivery person
router.get("/available-slots", auth, async (req: Request, res: Response) => {
  try {
    // Check if user is a delivery person
    if (req.user.role !== UserRole.POSTMAN) {
      return res.status(403).json({ message: "Not a delivery person" });
    }

    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    // Find time slots where this postman is assigned
    const timeSlots = await TimeSlot.find({
      postmanId: req.user.id,
      startTime: {
        $gte: new Date(date as string),
        $lt: new Date(
          new Date(date as string).setDate(
            new Date(date as string).getDate() + 1
          )
        ),
      },
    }).sort({ startTime: 1 });

    res.json(timeSlots);
  } catch (error) {
    console.error("Error fetching available time slots:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get delivery statistics for the delivery person
router.get("/stats", auth, async (req: Request, res: Response) => {
  try {
    // Check if user is a delivery person
    if (req.user.role !== UserRole.POSTMAN) {
      return res.status(403).json({ message: "Not a delivery person" });
    }

    // Get count of deliveries by status
    const statusCounts = await Order.aggregate([
      { $match: { assignedTo: req.user.id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Convert to a more user-friendly format
    const stats = {
      total: 0,
      delivered: 0,
      inTransit: 0,
      pending: 0,
      cancelled: 0,
    };

    statusCounts.forEach((item) => {
      switch (item._id) {
        case OrderStatus.DELIVERED:
          stats.delivered = item.count;
          break;
        case OrderStatus.IN_TRANSIT:
          stats.inTransit = item.count;
          break;
        case OrderStatus.PENDING:
        case OrderStatus.CONFIRMED:
        case OrderStatus.ASSIGNED:
          stats.pending += item.count;
          break;
        case OrderStatus.CANCELLED:
          stats.cancelled = item.count;
          break;
      }
      stats.total += item.count;
    });

    res.json(stats);
  } catch (error) {
    console.error("Error fetching delivery statistics:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
