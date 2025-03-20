import express from "express";
import { auth } from "../middleware/auth";
import Order, { OrderStatus } from "../models/Order";
import { predictTimeSlot, createOrderWithPrediction } from "../utils/aiService";
import {
  createOrder,
  getOrderById,
  getOrders,
  deleteOrder,
} from "../controllers/orderController";

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

// Create a new order with optimal time slot prediction
router.post("/create-with-prediction", auth, async (req, res) => {
  try {
    const {
      customerId,
      latitude,
      longitude,
      addressType,
      itemType,
      dayOfWeek,
      deliveryDate,
    } = req.body;

    // Validate required fields
    if (!customerId || !latitude || !longitude || addressType === undefined) {
      return res.status(400).json({
        message:
          "Missing required fields: customerId, latitude, longitude, addressType",
      });
    }

    // Call AI service to create order with prediction
    const result = await createOrderWithPrediction({
      customer_id: customerId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address_type: parseInt(addressType),
      item_type: itemType || "REGULAR",
      day_of_week: dayOfWeek || new Date().getDay(),
      delivery_date: deliveryDate || null,
    });

    if (!result || !result.order) {
      return res.status(500).json({
        message: "Failed to create order with prediction",
      });
    }

    // Return the created order with prediction
    res.status(201).json({
      success: true,
      message: "Order created with optimal time slot prediction",
      order: {
        orderId: result.order.order_id,
        customerId: result.order.customer_id,
        postmanId: result.order.postman_id,
        deliveryAddress: result.order.delivery_address,
        coordinates: {
          latitude: result.order.latitude,
          longitude: result.order.longitude,
        },
        addressType: result.order.address_type,
        itemType: result.order.item_type,
        bookingDate: result.order.booking_date,
        deliveryDate: result.order.delivery_date,
        dayOfWeek: result.order.day_of_week,
        predictedTimeSlot: result.order.predicted_time_slot,
        confidence: result.order.confidence,
        explanation: result.order.explanation,
      },
    });
  } catch (error) {
    console.error("Error creating order with prediction:", error);
    res.status(500).json({
      message: "Failed to create order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
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
    if (recipientName) order.recipient.name = recipientName;
    if (recipientAddress) order.deliveryAddress.street = recipientAddress;
    if (packageWeight) order.packageDetails.weight = packageWeight;
    if (packageDimensions) {
      order.packageDetails.dimensions.length =
        packageDimensions.length || order.packageDetails.dimensions.length;
      order.packageDetails.dimensions.width =
        packageDimensions.width || order.packageDetails.dimensions.width;
      order.packageDetails.dimensions.height =
        packageDimensions.height || order.packageDetails.dimensions.height;
    }
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
      if (status === OrderStatus.DELIVERED) {
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
    order.status = OrderStatus.ASSIGNED;

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
