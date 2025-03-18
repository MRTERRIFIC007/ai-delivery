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
exports.deleteOrder = exports.getAssignedOrders = exports.assignOrder = exports.updateOrderStatus = exports.getOrderById = exports.getOrderByTracking = exports.getOrders = exports.createOrder = void 0;
const Order_1 = __importStar(require("../models/Order"));
const TimeSlot_1 = __importDefault(require("../models/TimeSlot"));
const mongoose_1 = __importDefault(require("mongoose"));
// Create a new order
const createOrder = async (req, res) => {
    try {
        const userId = req.user._id;
        // Check if the timeslot exists and is available
        const timeSlotId = req.body.timeSlotId;
        if (timeSlotId) {
            const timeSlot = await TimeSlot_1.default.findById(timeSlotId);
            if (!timeSlot) {
                return res.status(404).json({ message: "Time slot not found" });
            }
            if (!timeSlot.isAvailable()) {
                return res
                    .status(400)
                    .json({ message: "Time slot is no longer available" });
            }
            // Decrement the available count in the time slot
            timeSlot.available -= 1;
            await timeSlot.save();
        }
        // Create the order with the sender being the current user
        const orderData = {
            ...req.body,
            sender: userId,
            status: Order_1.OrderStatus.PENDING,
        };
        const newOrder = new Order_1.default(orderData);
        await newOrder.save();
        res.status(201).json({
            success: true,
            order: newOrder,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.createOrder = createOrder;
// Get all orders (with pagination and filtering)
const getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Filter options
        const filter = {};
        // Apply status filter if provided
        if (req.query.status) {
            filter.status = req.query.status;
        }
        // Apply date range filter if provided
        if (req.query.fromDate && req.query.toDate) {
            filter.createdAt = {
                $gte: new Date(req.query.fromDate),
                $lte: new Date(req.query.toDate),
            };
        }
        // For non-admin users, only show their own orders
        if (req.user.role !== "admin") {
            filter.sender = req.user._id;
        }
        const orders = await Order_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("timeSlotId", "startTime endTime")
            .populate("assignedTo", "name email");
        const total = await Order_1.default.countDocuments(filter);
        res.status(200).json({
            success: true,
            count: orders.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            orders,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getOrders = getOrders;
// Get a single order by tracking number
const getOrderByTracking = async (req, res) => {
    try {
        const trackingNumber = req.params.trackingNumber;
        const order = await Order_1.default.findOne({ trackingNumber })
            .populate("timeSlotId", "startTime endTime")
            .populate("assignedTo", "name");
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }
        res.status(200).json({
            success: true,
            order,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getOrderByTracking = getOrderByTracking;
// Get a single order by ID
const getOrderById = async (req, res) => {
    var _a;
    try {
        const orderId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
            });
        }
        const order = await Order_1.default.findById(orderId)
            .populate("timeSlotId", "startTime endTime")
            .populate("assignedTo", "name");
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }
        // Check if user has permission to view this order
        if (req.user.role !== "admin" &&
            order.sender.toString() !== req.user._id.toString() &&
            ((_a = order.assignedTo) === null || _a === void 0 ? void 0 : _a.toString()) !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to view this order",
            });
        }
        res.status(200).json({
            success: true,
            order,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getOrderById = getOrderById;
// Update order status
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!Object.values(Order_1.OrderStatus).includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value",
            });
        }
        const order = await Order_1.default.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }
        // Set delivered date if status is DELIVERED
        if (status === Order_1.OrderStatus.DELIVERED &&
            order.status !== Order_1.OrderStatus.DELIVERED) {
            order.deliveredAt = new Date();
        }
        order.status = status;
        await order.save();
        res.status(200).json({
            success: true,
            order,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.updateOrderStatus = updateOrderStatus;
// Assign delivery personnel to an order
const assignOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { deliveryPersonnelId } = req.body;
        if (!deliveryPersonnelId) {
            return res.status(400).json({
                success: false,
                message: "Delivery personnel ID is required",
            });
        }
        const order = await Order_1.default.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }
        order.assignedTo = new mongoose_1.default.Types.ObjectId(deliveryPersonnelId);
        order.status = Order_1.OrderStatus.ASSIGNED;
        await order.save();
        res.status(200).json({
            success: true,
            order,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.assignOrder = assignOrder;
// Get orders assigned to the logged-in delivery personnel
const getAssignedOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const orders = await Order_1.default.find({
            assignedTo: userId,
            status: { $in: [Order_1.OrderStatus.ASSIGNED, Order_1.OrderStatus.IN_TRANSIT] },
        })
            .populate("timeSlotId", "startTime endTime")
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getAssignedOrders = getAssignedOrders;
// Delete an order (admin only)
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if user is an admin
        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can delete orders",
            });
        }
        const order = await Order_1.default.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }
        // If the order has a time slot, increment its available count
        if (order.timeSlotId) {
            const timeSlot = await TimeSlot_1.default.findById(order.timeSlotId);
            if (timeSlot) {
                timeSlot.available += 1;
                await timeSlot.save();
            }
        }
        await Order_1.default.deleteOne({ _id: id });
        res.status(200).json({
            success: true,
            message: "Order deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.deleteOrder = deleteOrder;
