import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITimeSlot extends Document {
  startTime: Date;
  endTime: Date;
  capacity: number;
  available: number;
  area: string;
  postmanId?: mongoose.Types.ObjectId;
  isActive: boolean;
  maxDeliveriesPerPostman: number;
  priority: "high" | "medium" | "low";
  createdAt: Date;
  updatedAt: Date;
  isAvailable(): boolean;
}

interface TimeSlotModel extends Model<ITimeSlot> {
  findAvailableSlots(area: string, date: Date): Promise<ITimeSlot[]>;
}

const timeSlotSchema = new Schema(
  {
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
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
  }
);

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
timeSlotSchema.methods.isAvailable = function (): boolean {
  return this.isActive && this.available > 0;
};

// Static method to find available time slots for an area
timeSlotSchema.statics.findAvailableSlots = async function (
  area: string,
  date: Date
): Promise<ITimeSlot[]> {
  try {
    // Validate date
    if (!date || isNaN(date.getTime())) {
      console.error("Invalid date provided to findAvailableSlots:", date);
      return []; // Return empty array instead of throwing an error
    }

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
  } catch (error) {
    console.error("Error in findAvailableSlots:", error);
    return []; // Return empty array on error
  }
};

const TimeSlot = mongoose.model<ITimeSlot, TimeSlotModel>(
  "TimeSlot",
  timeSlotSchema
);

export default TimeSlot;
