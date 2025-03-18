import express from "express";
import { auth } from "../middleware/auth";
import Order from "../models/Order";
import User from "../models/User";

const router = express.Router();

// Get all delivery personnel (for admin)
router.get("/personnel", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const deliveryPersonnel = await User.find({ role: "delivery" })
      .select("-password")
      .sort({ name: 1 });

    res.json(deliveryPersonnel);
  } catch (error) {
    console.error("Error fetching delivery personnel:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get delivery person's current route (all assigned orders)
router.get("/my-route", auth, async (req, res) => {
  try {
    // Check if user is delivery personnel
    if (req.user.role !== "delivery") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const assignedOrders = await Order.find({
      assignedTo: req.user.id,
      status: { $in: ["assigned", "in_transit"] },
    })
      .populate("sender", "name email")
      .sort({ predictedTimeSlot: 1 });

    res.json(assignedOrders);
  } catch (error) {
    console.error("Error fetching delivery route:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update delivery status (for delivery personnel)
router.put("/status/:orderId", auth, async (req, res) => {
  try {
    const { status, location } = req.body;

    // Check if user is delivery personnel
    if (req.user.role !== "delivery" && req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if this delivery person is assigned to this order
    if (
      order.assignedTo.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this order" });
    }

    // Update status
    if (status) {
      order.status = status;

      // If status is updated to 'delivered', set delivery completion time
      if (status === "delivered") {
        order.deliveredAt = new Date();
      }
    }

    // Update location if provided
    if (location && location.lat && location.lng) {
      order.location = {
        lat: location.lat,
        lng: location.lng,
      };
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating delivery status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get delivery statistics (for admin dashboard)
router.get("/stats", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Get counts for different order statuses
    const pendingCount = await Order.countDocuments({ status: "pending" });
    const assignedCount = await Order.countDocuments({ status: "assigned" });
    const inTransitCount = await Order.countDocuments({ status: "in_transit" });
    const deliveredCount = await Order.countDocuments({ status: "delivered" });
    const cancelledCount = await Order.countDocuments({ status: "cancelled" });

    // Get count of delivery personnel
    const deliveryPersonnelCount = await User.countDocuments({
      role: "delivery",
    });

    // Get average delivery time (for completed deliveries)
    const deliveredOrders = await Order.find({
      status: "delivered",
      deliveredAt: { $ne: null },
    });

    let totalDeliveryTime = 0;
    deliveredOrders.forEach((order) => {
      const deliveryTime =
        new Date(order.deliveredAt).getTime() -
        new Date(order.createdAt).getTime();
      totalDeliveryTime += deliveryTime;
    });

    const avgDeliveryTime =
      deliveredOrders.length > 0
        ? totalDeliveryTime / deliveredOrders.length
        : 0;

    // Return statistics
    res.json({
      orderCounts: {
        pending: pendingCount,
        assigned: assignedCount,
        inTransit: inTransitCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
        total:
          pendingCount +
          assignedCount +
          inTransitCount +
          deliveredCount +
          cancelledCount,
      },
      deliveryPersonnelCount,
      avgDeliveryTimeMs: avgDeliveryTime,
      avgDeliveryTimeHours: avgDeliveryTime / (1000 * 60 * 60), // Convert ms to hours
    });
  } catch (error) {
    console.error("Error fetching delivery statistics:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
