import express from "express";
import { auth } from "../middleware/auth";
import Order, { OrderStatus } from "../models/Order";
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
      receiverName,
      receiverPhone,
      receiverEmail,
      pickupAddress,
      dropoffAddress,
      dropoffLatitude,
      dropoffLongitude,
      packageWeight,
      packageDimensions,
      deliveryPriority,
      notes,
    } = req.body;

    // Prepare AI prediction data
    const predictionData = {
      customer_id: req.user.id,
      day_of_week: new Date().getDay(),
      location_type: req.body.addressType || "residential",
      area_code: req.body.dropoffLatitude ? req.body.area || "110" : "110",
      distance: 5.0, // Default value
      order_value: packageWeight ? parseFloat(packageWeight) * 100 : 500, // Default value based on package weight
    };

    let predictedTimeSlot;
    try {
      const prediction = await predictTimeSlot(predictionData);
      // Get the first prediction with highest confidence
      if (prediction.predictions && prediction.predictions.length > 0) {
        // Sort by confidence (in case they aren't already sorted)
        const sortedPredictions = [...prediction.predictions].sort(
          (a, b) => b.confidence - a.confidence
        );
        predictedTimeSlot = sortedPredictions[0].time_slot;
        console.log(
          `Using AI predicted time slot: ${predictedTimeSlot} (${
            sortedPredictions[0].confidence * 100
          }% confidence)`
        );
      } else {
        predictedTimeSlot = "10-11"; // Default to morning slot if no predictions
        console.log(
          "No predictions returned from AI service, using default time slot"
        );
      }
    } catch (error) {
      console.error("Error getting AI prediction:", error);
      // Default to a standard time slot if AI service fails
      predictedTimeSlot = "13-14"; // Afternoon slot
    }

    const newOrder = new Order({
      sender: req.user.id,
      recipient: {
        name: receiverName,
        phone: receiverPhone,
        email: receiverEmail,
      },
      deliveryAddress: {
        street: dropoffAddress,
        city: req.body.city || "New Delhi",
        state: req.body.state || "Delhi",
        postalCode: req.body.postalCode || "110001",
        country: "India",
        location: {
          latitude: parseFloat(dropoffLatitude || "17.4344"),
          longitude: parseFloat(dropoffLongitude || "78.4672"),
        },
        addressType: req.body.addressType || 1,
      },
      packageDetails: {
        weight: packageWeight || 1,
        dimensions: {
          length: packageDimensions?.length || 10,
          width: packageDimensions?.width || 10,
          height: packageDimensions?.height || 10,
        },
        description: req.body.description || "",
      },
      timeSlot: predictedTimeSlot,
      predictedTimeSlot,
      deliveryDistance: req.body.deliveryDistance || 5.0,
      deliveryPriority: deliveryPriority || "medium",
      notes,
      status: OrderStatus.PENDING,
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
