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
const auth_1 = require("../middleware/auth");
const Order_1 = __importStar(require("../models/Order"));
const aiService_1 = require("../utils/aiService");
const router = express_1.default.Router();
// Get all orders
router.get("/", auth_1.auth, async (req, res) => {
    try {
        const orders = await Order_1.default.find()
            .populate("sender", "name email")
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 });
        res.json(orders);
    }
    catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Get orders for a specific user (sender)
router.get("/my-orders", auth_1.auth, async (req, res) => {
    try {
        const orders = await Order_1.default.find({ sender: req.user.id })
            .populate("assignedTo", "name email")
            .sort({ createdAt: -1 });
        res.json(orders);
    }
    catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Get orders assigned to a delivery person
router.get("/assigned", auth_1.auth, async (req, res) => {
    try {
        const orders = await Order_1.default.find({ assignedTo: req.user.id })
            .populate("sender", "name email")
            .sort({ createdAt: -1 });
        res.json(orders);
    }
    catch (error) {
        console.error("Error fetching assigned orders:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Get a specific order by ID
router.get("/:id", auth_1.auth, async (req, res) => {
    try {
        const order = await Order_1.default.findById(req.params.id)
            .populate("sender", "name email")
            .populate("assignedTo", "name email");
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json(order);
    }
    catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Create a new order
router.post("/", auth_1.auth, async (req, res) => {
    try {
        const { receiverName, receiverPhone, receiverEmail, pickupAddress, dropoffAddress, dropoffLatitude, dropoffLongitude, packageWeight, packageDimensions, deliveryPriority, notes, } = req.body;
        // Use AI service to predict optimal time slot
        const predictionData = {
            customer_id: req.body.customerId || "CUST" + Math.floor(Math.random() * 1000),
            latitude: parseFloat(dropoffLatitude || "17.4344"),
            longitude: parseFloat(dropoffLongitude || "78.4672"),
            address_type: req.body.addressType || 1,
        };
        let predictedTimeSlot;
        try {
            const prediction = await (0, aiService_1.predictTimeSlot)(predictionData);
            predictedTimeSlot = prediction.predicted_time_slot;
        }
        catch (error) {
            console.error("Error getting AI prediction:", error);
            // Default to a standard time slot if AI service fails
            predictedTimeSlot = 3; // Afternoon slot
        }
        const newOrder = new Order_1.default({
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
                    length: (packageDimensions === null || packageDimensions === void 0 ? void 0 : packageDimensions.length) || 10,
                    width: (packageDimensions === null || packageDimensions === void 0 ? void 0 : packageDimensions.width) || 10,
                    height: (packageDimensions === null || packageDimensions === void 0 ? void 0 : packageDimensions.height) || 10,
                },
                description: req.body.description || "",
            },
            timeSlot: predictedTimeSlot,
            predictedTimeSlot,
            deliveryDistance: req.body.deliveryDistance || 5.0,
            deliveryPriority: deliveryPriority || "medium",
            notes,
            status: Order_1.OrderStatus.PENDING,
        });
        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    }
    catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Update an order
router.put("/:id", auth_1.auth, async (req, res) => {
    try {
        const { recipientName, recipientAddress, packageWeight, packageDimensions, deliveryDistance, deliveryPriority, status, notes, } = req.body;
        const order = await Order_1.default.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        // Check if user is authorized to update this order
        if (order.sender.toString() !== req.user.id &&
            req.user.role !== "admin" &&
            order.assignedTo &&
            order.assignedTo.toString() !== req.user.id) {
            return res
                .status(401)
                .json({ message: "Not authorized to update this order" });
        }
        // Update fields
        if (recipientName)
            order.recipient.name = recipientName;
        if (recipientAddress)
            order.deliveryAddress.street = recipientAddress;
        if (packageWeight)
            order.packageDetails.weight = packageWeight;
        if (packageDimensions) {
            order.packageDetails.dimensions.length =
                packageDimensions.length || order.packageDetails.dimensions.length;
            order.packageDetails.dimensions.width =
                packageDimensions.width || order.packageDetails.dimensions.width;
            order.packageDetails.dimensions.height =
                packageDimensions.height || order.packageDetails.dimensions.height;
        }
        if (deliveryDistance)
            order.deliveryDistance = deliveryDistance;
        if (deliveryPriority)
            order.deliveryPriority = deliveryPriority;
        if (notes)
            order.notes = notes;
        // Only admin or assigned delivery person can update status
        if (status &&
            (req.user.role === "admin" ||
                (order.assignedTo && order.assignedTo.toString() === req.user.id))) {
            order.status = status;
            // If status is updated to 'delivered', set delivery completion time
            if (status === Order_1.OrderStatus.DELIVERED) {
                order.deliveredAt = new Date();
            }
        }
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    }
    catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Assign order to delivery person
router.put("/:id/assign", auth_1.auth, async (req, res) => {
    try {
        const { deliveryPersonId } = req.body;
        // Only admin can assign orders
        if (req.user.role !== "admin") {
            return res.status(401).json({ message: "Not authorized" });
        }
        const order = await Order_1.default.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        order.assignedTo = deliveryPersonId;
        order.status = Order_1.OrderStatus.ASSIGNED;
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    }
    catch (error) {
        console.error("Error assigning order:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Delete an order
router.delete("/:id", auth_1.auth, async (req, res) => {
    try {
        const order = await Order_1.default.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        // Only the sender or admin can delete an order
        if (order.sender.toString() !== req.user.id && req.user.role !== "admin") {
            return res
                .status(401)
                .json({ message: "Not authorized to delete this order" });
        }
        await Order_1.default.deleteOne({ _id: req.params.id });
        res.json({ message: "Order removed" });
    }
    catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
