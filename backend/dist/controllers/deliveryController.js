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
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDeliveryNotes = exports.getDeliveryStats = exports.trackDelivery = exports.updateDeliveryStatus = exports.getPostmanDeliveries = void 0;
const Order_1 = __importStar(require("../models/Order"));
const User_1 = __importStar(require("../models/User"));
// Get all deliveries for a postman
const getPostmanDeliveries = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, date } = req.query;
        // Check if the user is a postman
        const user = await User_1.default.findById(userId);
        if (!user || user.role !== User_1.UserRole.POSTMAN) {
            return res.status(403).json({
                success: false,
                message: "Only postmen can access their deliveries",
            });
        }
        // Build filter
        const filter = {
            assignedTo: userId,
        };
        // Apply status filter if provided
        if (status) {
            filter.status = status;
        }
        else {
            // By default, show only active deliveries (assigned or in transit)
            filter.status = { $in: [Order_1.OrderStatus.ASSIGNED, Order_1.OrderStatus.IN_TRANSIT] };
        }
        // Apply date filter if provided
        if (date) {
            const queryDate = new Date(date);
            const startOfDay = new Date(queryDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(queryDate);
            endOfDay.setHours(23, 59, 59, 999);
            filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
        }
        // Get deliveries with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const deliveries = await Order_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("sender", "name email phone")
            .populate("timeSlotId", "startTime endTime");
        const total = await Order_1.default.countDocuments(filter);
        res.status(200).json({
            success: true,
            count: deliveries.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            deliveries,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getPostmanDeliveries = getPostmanDeliveries;
// Update delivery status
const updateDeliveryStatus = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user._id;
        // Validate status
        if (!Object.values(Order_1.OrderStatus).includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value",
            });
        }
        // Get the order
        const order = await Order_1.default.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }
        // Check if the user has permission to update this order
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        // Postmen can only update orders assigned to them
        if (user.role === User_1.UserRole.POSTMAN) {
            if (((_a = order.assignedTo) === null || _a === void 0 ? void 0 : _a.toString()) !== userId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "You do not have permission to update this delivery",
                });
            }
            // Postmen can only update to certain statuses
            const allowedStatusesForPostman = [
                Order_1.OrderStatus.IN_TRANSIT,
                Order_1.OrderStatus.DELIVERED,
            ];
            if (!allowedStatusesForPostman.includes(status)) {
                return res.status(403).json({
                    success: false,
                    message: "Postmen can only update to in_transit or delivered status",
                });
            }
        }
        else if (user.role !== User_1.UserRole.ADMIN) {
            // Only admins and assigned postmen can update delivery status
            return res.status(403).json({
                success: false,
                message: "You do not have permission to update this delivery",
            });
        }
        // Update order status
        order.status = status;
        // If status is DELIVERED, set deliveredAt
        if (status === Order_1.OrderStatus.DELIVERED) {
            order.deliveredAt = new Date();
        }
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
exports.updateDeliveryStatus = updateDeliveryStatus;
// Track delivery by tracking number
const trackDelivery = async (req, res) => {
    var _a;
    try {
        const { trackingNumber } = req.params;
        const order = await Order_1.default.findOne({ trackingNumber })
            .select("status trackingNumber recipient deliveryAddress deliveredAt createdAt scheduledDeliveryTime")
            .populate("timeSlotId", "startTime endTime");
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }
        res.status(200).json({
            success: true,
            tracking: {
                trackingNumber: order.trackingNumber,
                status: order.status,
                recipient: order.recipient.name,
                address: `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.postalCode}`,
                createdAt: order.createdAt,
                deliveredAt: order.deliveredAt,
                scheduledDelivery: order.scheduledDeliveryTime || ((_a = order.timeSlotId) === null || _a === void 0 ? void 0 : _a.startTime),
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.trackDelivery = trackDelivery;
// Get delivery statistics
const getDeliveryStats = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== User_1.UserRole.ADMIN) {
            return res.status(403).json({
                success: false,
                message: "Only admins can access delivery statistics",
            });
        }
        // Get count of orders by status
        const statusStats = await Order_1.default.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);
        // Format status stats
        const statusCounts = {};
        statusStats.forEach((stat) => {
            statusCounts[stat._id] = stat.count;
        });
        // Get count of orders by date (last 7 days)
        const today = new Date();
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const dailyStats = await Order_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: lastWeek },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);
        // Get count of orders by area
        const areaStats = await Order_1.default.aggregate([
            {
                $group: {
                    _id: "$deliveryAddress.city",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { count: -1 },
            },
            {
                $limit: 5,
            },
        ]);
        // Get completed deliveries per postman
        const postmanStats = await Order_1.default.aggregate([
            {
                $match: {
                    status: Order_1.OrderStatus.DELIVERED,
                    assignedTo: { $exists: true },
                },
            },
            {
                $group: {
                    _id: "$assignedTo",
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { count: -1 },
            },
            {
                $limit: 10,
            },
        ]);
        // Populate postman details
        const postmenIds = postmanStats.map((stat) => stat._id);
        const postmen = await User_1.default.find({ _id: { $in: postmenIds } }).select("name");
        const postmanDeliveries = postmanStats.map((stat) => {
            const postman = postmen.find((p) => p._id.toString() === stat._id.toString());
            return {
                postmanId: stat._id,
                name: postman ? postman.name : "Unknown",
                deliveries: stat.count,
            };
        });
        res.status(200).json({
            success: true,
            stats: {
                byStatus: statusCounts,
                byDate: dailyStats,
                byArea: areaStats,
                byPostman: postmanDeliveries,
                total: await Order_1.default.countDocuments(),
                delivered: statusCounts[Order_1.OrderStatus.DELIVERED] || 0,
                pending: statusCounts[Order_1.OrderStatus.PENDING] || 0,
                inTransit: statusCounts[Order_1.OrderStatus.IN_TRANSIT] || 0,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getDeliveryStats = getDeliveryStats;
// Add delivery notes
const addDeliveryNotes = async (req, res) => {
    var _a;
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const userId = req.user._id;
        if (!notes) {
            return res.status(400).json({
                success: false,
                message: "Notes are required",
            });
        }
        const order = await Order_1.default.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }
        // Check if user has permission (must be admin or assigned postman)
        if (req.user.role !== User_1.UserRole.ADMIN &&
            ((_a = order.assignedTo) === null || _a === void 0 ? void 0 : _a.toString()) !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to add notes to this delivery",
            });
        }
        order.notes = notes;
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
exports.addDeliveryNotes = addDeliveryNotes;
