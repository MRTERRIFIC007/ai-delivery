import express from "express";
import { auth } from "../middleware/auth";
import Order from "../models/Order";
import { predictTimeSlot } from "../utils/aiService";

const router = express.Router();

// Get all orders
router.get("/", auth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("sender", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get orders for a specific user (sender)
router.get("/my-orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ sender: req.user.id })
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get orders assigned to a delivery person
router.get("/assigned", auth, async (req, res) => {
  try {
    const orders = await Order.find({ assignedTo: req.user.id })
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching assigned orders:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a specific order by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("sender", "name email")
      .populate("assignedTo", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new order
router.post("/", auth, async (req, res) => {
  try {
    const {
      recipientName,
      recipientAddress,
      packageWeight,
      packageDimensions,
      deliveryDistance,
      deliveryPriority,
      notes,
    } = req.body;

    // Use AI service to predict optimal time slot
    const predictionData = {
      weight: packageWeight,
      distance: deliveryDistance,
      priority:
        deliveryPriority === "high" ? 1 : deliveryPriority === "medium" ? 2 : 3,
    };

    let predictedTimeSlot;
    try {
      const prediction = await predictTimeSlot(predictionData);
      predictedTimeSlot = prediction.predictedTimeSlot;
    } catch (error) {
      console.error("Error getting AI prediction:", error);
      // Default to a standard time slot if AI service fails
      predictedTimeSlot = "afternoon";
    }

    const newOrder = new Order({
      sender: req.user.id,
      recipientName,
      recipientAddress,
      packageWeight,
      packageDimensions,
      deliveryDistance,
      deliveryPriority,
      predictedTimeSlot,
      notes,
      status: "pending",
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update an order
router.put("/:id", auth, async (req, res) => {
  try {
    const {
      recipientName,
      recipientAddress,
      packageWeight,
      packageDimensions,
      deliveryDistance,
      deliveryPriority,
      status,
      notes,
    } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user is authorized to update this order
    if (
      order.sender.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      order.assignedTo &&
      order.assignedTo.toString() !== req.user.id
    ) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this order" });
    }

    // Update fields
    if (recipientName) order.recipientName = recipientName;
    if (recipientAddress) order.recipientAddress = recipientAddress;
    if (packageWeight) order.packageWeight = packageWeight;
    if (packageDimensions) order.packageDimensions = packageDimensions;
    if (deliveryDistance) order.deliveryDistance = deliveryDistance;
    if (deliveryPriority) order.deliveryPriority = deliveryPriority;
    if (notes) order.notes = notes;

    // Only admin or assigned delivery person can update status
    if (
      status &&
      (req.user.role === "admin" ||
        (order.assignedTo && order.assignedTo.toString() === req.user.id))
    ) {
      order.status = status;

      // If status is updated to 'delivered', set delivery completion time
      if (status === "delivered") {
        order.deliveredAt = new Date();
      }
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Assign order to delivery person
router.put("/:id/assign", auth, async (req, res) => {
  try {
    const { deliveryPersonId } = req.body;

    // Only admin can assign orders
    if (req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.assignedTo = deliveryPersonId;
    order.status = "assigned";

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error("Error assigning order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an order
router.delete("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only the sender or admin can delete an order
    if (order.sender.toString() !== req.user.id && req.user.role !== "admin") {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this order" });
    }

    await Order.deleteOne({ _id: req.params.id });
    res.json({ message: "Order removed" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
