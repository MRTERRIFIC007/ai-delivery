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
const User_1 = require("../models/User");
const TimeSlot_1 = __importDefault(require("../models/TimeSlot"));
const router = express_1.default.Router();
// Get all deliveries assigned to current delivery person
router.get("/my-deliveries", auth_1.auth, async (req, res) => {
    try {
        // Check if user is a delivery person
        if (req.user.role !== User_1.UserRole.POSTMAN) {
            return res.status(403).json({ message: "Not a delivery person" });
        }
        // Get all orders assigned to this delivery person
        const deliveries = await Order_1.default.find({ assignedTo: req.user.id })
            .populate("sender", "name email phone")
            .populate("timeSlotId")
            .sort({ scheduledDeliveryTime: 1 });
        res.json(deliveries);
    }
    catch (error) {
        console.error("Error fetching deliveries:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Get deliveries for today
router.get("/today", auth_1.auth, async (req, res) => {
    try {
        // Check if user is a delivery person
        if (req.user.role !== User_1.UserRole.POSTMAN) {
            return res.status(403).json({ message: "Not a delivery person" });
        }
        // Calculate today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Get all orders assigned to this delivery person and scheduled for today
        const deliveries = await Order_1.default.find({
            assignedTo: req.user.id,
            scheduledDeliveryTime: {
                $gte: today,
                $lt: tomorrow,
            },
            status: {
                $in: [
                    Order_1.OrderStatus.CONFIRMED,
                    Order_1.OrderStatus.ASSIGNED,
                    Order_1.OrderStatus.IN_TRANSIT,
                ],
            },
        })
            .populate("sender", "name email phone")
            .populate("timeSlotId")
            .sort({ scheduledDeliveryTime: 1 });
        res.json(deliveries);
    }
    catch (error) {
        console.error("Error fetching today's deliveries:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Update delivery status
router.put("/:id/status", auth_1.auth, async (req, res) => {
    try {
        const { status, notes } = req.body;
        // Check if user is a delivery person
        if (req.user.role !== User_1.UserRole.POSTMAN &&
            req.user.role !== User_1.UserRole.ADMIN) {
            return res.status(403).json({ message: "Not authorized" });
        }
        // Find the order
        const order = await Order_1.default.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        // Check if this delivery person is assigned to this order
        if (req.user.role === User_1.UserRole.POSTMAN &&
            (!order.assignedTo || order.assignedTo.toString() !== req.user.id)) {
            return res.status(403).json({ message: "Not assigned to this delivery" });
        }
        // Update status
        order.status = status;
        // Add notes if provided
        if (notes) {
            order.notes = notes;
        }
        // If status is "delivered", set deliveredAt
        if (status === Order_1.OrderStatus.DELIVERED) {
            order.deliveredAt = new Date();
        }
        // Save the updated order
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    }
    catch (error) {
        console.error("Error updating delivery status:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Get available time slots for a delivery person
router.get("/available-slots", auth_1.auth, async (req, res) => {
    try {
        // Check if user is a delivery person
        if (req.user.role !== User_1.UserRole.POSTMAN) {
            return res.status(403).json({ message: "Not a delivery person" });
        }
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }
        // Find time slots where this postman is assigned
        const timeSlots = await TimeSlot_1.default.find({
            postmanId: req.user.id,
            startTime: {
                $gte: new Date(date),
                $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
            },
        }).sort({ startTime: 1 });
        res.json(timeSlots);
    }
    catch (error) {
        console.error("Error fetching available time slots:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// Get delivery statistics for the delivery person
router.get("/stats", auth_1.auth, async (req, res) => {
    try {
        // Check if user is a delivery person
        if (req.user.role !== User_1.UserRole.POSTMAN) {
            return res.status(403).json({ message: "Not a delivery person" });
        }
        // Get count of deliveries by status
        const statusCounts = await Order_1.default.aggregate([
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
                case Order_1.OrderStatus.DELIVERED:
                    stats.delivered = item.count;
                    break;
                case Order_1.OrderStatus.IN_TRANSIT:
                    stats.inTransit = item.count;
                    break;
                case Order_1.OrderStatus.PENDING:
                case Order_1.OrderStatus.CONFIRMED:
                case Order_1.OrderStatus.ASSIGNED:
                    stats.pending += item.count;
                    break;
                case Order_1.OrderStatus.CANCELLED:
                    stats.cancelled = item.count;
                    break;
            }
            stats.total += item.count;
        });
        res.json(stats);
    }
    catch (error) {
        console.error("Error fetching delivery statistics:", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.default = router;
