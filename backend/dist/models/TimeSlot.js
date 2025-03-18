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
const mongoose_1 = __importStar(require("mongoose"));
const timeSlotSchema = new mongoose_1.Schema({
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    capacity: {
        type: Number,
        required: true,
        default: 50, // Default capacity per time slot
    },
    available: {
        type: Number,
        required: true,
        default: 50,
    },
    area: {
        type: String,
        required: true,
        index: true,
    },
    postmanId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    maxDeliveriesPerPostman: {
        type: Number,
        required: true,
        default: 20, // Maximum deliveries a postman can handle in one time slot
    },
    priority: {
        type: String,
        enum: ["high", "medium", "low"],
        default: "medium",
    },
}, {
    timestamps: true,
});
// Indexes for better query performance
timeSlotSchema.index({ startTime: 1, endTime: 1 });
timeSlotSchema.index({ area: 1, startTime: 1 });
timeSlotSchema.index({ postmanId: 1, startTime: 1 });
// Pre-save middleware to ensure available slots don't exceed capacity
timeSlotSchema.pre("save", function (next) {
    if (this.available > this.capacity) {
        this.available = this.capacity;
    }
    next();
});
// Method to check if a time slot is available
timeSlotSchema.methods.isAvailable = function () {
    return this.isActive && this.available > 0;
};
// Static method to find available time slots for an area
timeSlotSchema.statics.findAvailableSlots = async function (area, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return this.find({
        area,
        startTime: { $gte: startOfDay, $lte: endOfDay },
        isActive: true,
        available: { $gt: 0 },
    }).sort({ startTime: 1 });
};
const TimeSlot = mongoose_1.default.model("TimeSlot", timeSlotSchema);
exports.default = TimeSlot;
