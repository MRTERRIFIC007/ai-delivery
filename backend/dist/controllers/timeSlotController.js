"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignPostman = exports.deleteTimeSlot = exports.updateTimeSlot = exports.getTimeSlotById = exports.getAvailableTimeSlots = exports.getTimeSlots = exports.createTimeSlot = void 0;
const TimeSlot_1 = __importDefault(require("../models/TimeSlot"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_2 = require("../models/User");
// Create a new time slot
const createTimeSlot = async (req, res) => {
    try {
        // Check if user is an admin
        if (req.user.role !== User_2.UserRole.ADMIN) {
            return res.status(403).json({
                success: false,
                message: "Only admins can create time slots",
            });
        }
        const newTimeSlot = new TimeSlot_1.default(req.body);
        // If postmanId is provided, check if the postman exists
        if (req.body.postmanId) {
            const postman = await User_1.default.findById(req.body.postmanId);
            if (!postman || postman.role !== User_2.UserRole.POSTMAN) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid postman ID or user is not a postman",
                });
            }
        }
        // Ensure capacity >= available
        if (newTimeSlot.capacity < newTimeSlot.available) {
            newTimeSlot.available = newTimeSlot.capacity;
        }
        await newTimeSlot.save();
        res.status(201).json({
            success: true,
            timeSlot: newTimeSlot,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
exports.createTimeSlot = createTimeSlot;
// Get all time slots with filtering options
const getTimeSlots = async (req, res) => {
    try {
        // Extract query parameters
        const { area, date, available, postmanId, isActive } = req.query;
        // Build filter object
        const filter = {};
        if (area) {
            filter.area = area;
        }
        if (date) {
            const queryDate = new Date(date);
            const startOfDay = new Date(queryDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(queryDate);
            endOfDay.setHours(23, 59, 59, 999);
            filter.startTime = { $gte: startOfDay, $lte: endOfDay };
        }
        if (available === "true") {
            filter.available = { $gt: 0 };
            filter.isActive = true;
        }
        if (postmanId) {
            filter.postmanId = postmanId;
        }
        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }
        // Get time slots with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const timeSlots = await TimeSlot_1.default.find(filter)
            .sort({ startTime: 1 })
            .skip(skip)
            .limit(limit)
            .populate("postmanId", "name email");
        const total = await TimeSlot_1.default.countDocuments(filter);
        res.status(200).json({
            success: true,
            count: timeSlots.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            timeSlots,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getTimeSlots = getTimeSlots;
// Get available time slots for a specific date and area
const getAvailableTimeSlots = async (req, res) => {
    try {
        const { area, date } = req.query;
        if (!area || !date) {
            return res.status(400).json({
                success: false,
                message: "Area and date are required parameters",
            });
        }
        const queryDate = new Date(date);
        const availableSlots = await TimeSlot_1.default.findAvailableSlots(area, queryDate);
        res.status(200).json({
            success: true,
            count: availableSlots.length,
            timeSlots: availableSlots,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getAvailableTimeSlots = getAvailableTimeSlots;
// Get a specific time slot by ID
const getTimeSlotById = async (req, res) => {
    try {
        const timeSlotId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(timeSlotId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid time slot ID",
            });
        }
        const timeSlot = await TimeSlot_1.default.findById(timeSlotId).populate("postmanId", "name email");
        if (!timeSlot) {
            return res.status(404).json({
                success: false,
                message: "Time slot not found",
            });
        }
        res.status(200).json({
            success: true,
            timeSlot,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.getTimeSlotById = getTimeSlotById;
// Update a time slot
const updateTimeSlot = async (req, res) => {
    try {
        // Check if user is an admin
        if (req.user.role !== User_2.UserRole.ADMIN) {
            return res.status(403).json({
                success: false,
                message: "Only admins can update time slots",
            });
        }
        const timeSlotId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(timeSlotId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid time slot ID",
            });
        }
        // If postmanId is provided, check if the postman exists
        if (req.body.postmanId) {
            const postman = await User_1.default.findById(req.body.postmanId);
            if (!postman || postman.role !== User_2.UserRole.POSTMAN) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid postman ID or user is not a postman",
                });
            }
        }
        const timeSlot = await TimeSlot_1.default.findById(timeSlotId);
        if (!timeSlot) {
            return res.status(404).json({
                success: false,
                message: "Time slot not found",
            });
        }
        // Update the time slot
        const updatedTimeSlot = await TimeSlot_1.default.findByIdAndUpdate(timeSlotId, req.body, { new: true, runValidators: true });
        res.status(200).json({
            success: true,
            timeSlot: updatedTimeSlot,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.updateTimeSlot = updateTimeSlot;
// Delete a time slot
const deleteTimeSlot = async (req, res) => {
    try {
        // Check if user is an admin
        if (req.user.role !== User_2.UserRole.ADMIN) {
            return res.status(403).json({
                success: false,
                message: "Only admins can delete time slots",
            });
        }
        const timeSlotId = req.params.id;
        if (!mongoose_1.default.Types.ObjectId.isValid(timeSlotId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid time slot ID",
            });
        }
        const timeSlot = await TimeSlot_1.default.findById(timeSlotId);
        if (!timeSlot) {
            return res.status(404).json({
                success: false,
                message: "Time slot not found",
            });
        }
        await TimeSlot_1.default.deleteOne({ _id: timeSlotId });
        res.status(200).json({
            success: true,
            message: "Time slot deleted successfully",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.deleteTimeSlot = deleteTimeSlot;
// Assign a postman to a time slot
const assignPostman = async (req, res) => {
    try {
        // Check if user is an admin
        if (req.user.role !== User_2.UserRole.ADMIN) {
            return res.status(403).json({
                success: false,
                message: "Only admins can assign postmen to time slots",
            });
        }
        const { timeSlotId, postmanId } = req.body;
        if (!timeSlotId || !postmanId) {
            return res.status(400).json({
                success: false,
                message: "Time slot ID and postman ID are required",
            });
        }
        // Check if the postman exists and is a postman
        const postman = await User_1.default.findById(postmanId);
        if (!postman || postman.role !== User_2.UserRole.POSTMAN) {
            return res.status(400).json({
                success: false,
                message: "Invalid postman ID or user is not a postman",
            });
        }
        // Check if the time slot exists
        const timeSlot = await TimeSlot_1.default.findById(timeSlotId);
        if (!timeSlot) {
            return res.status(404).json({
                success: false,
                message: "Time slot not found",
            });
        }
        // Assign the postman to the time slot
        timeSlot.postmanId = new mongoose_1.default.Types.ObjectId(postmanId);
        await timeSlot.save();
        res.status(200).json({
            success: true,
            timeSlot,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
exports.assignPostman = assignPostman;
