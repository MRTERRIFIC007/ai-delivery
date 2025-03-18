import { Request, Response } from "express";
import TimeSlot from "../models/TimeSlot";
import User from "../models/User";
import mongoose from "mongoose";
import { UserRole } from "../models/User";

// Create a new time slot
export const createTimeSlot = async (req: Request, res: Response) => {
  try {
    // Check if user is an admin
    if ((req as any).user.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Only admins can create time slots",
      });
    }

    const newTimeSlot = new TimeSlot(req.body);

    // If postmanId is provided, check if the postman exists
    if (req.body.postmanId) {
      const postman = await User.findById(req.body.postmanId);
      if (!postman || postman.role !== UserRole.POSTMAN) {
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
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all time slots with filtering options
export const getTimeSlots = async (req: Request, res: Response) => {
  try {
    // Extract query parameters
    const { area, date, available, postmanId, isActive } = req.query;

    // Build filter object
    const filter: any = {};

    if (area) {
      filter.area = area;
    }

    if (date) {
      const queryDate = new Date(date as string);
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const timeSlots = await TimeSlot.find(filter)
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate("postmanId", "name email");

    const total = await TimeSlot.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: timeSlots.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      timeSlots,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get available time slots for a specific date and area
export const getAvailableTimeSlots = async (req: Request, res: Response) => {
  try {
    const { area, date } = req.query;

    if (!area || !date) {
      return res.status(400).json({
        success: false,
        message: "Area and date are required parameters",
      });
    }

    const queryDate = new Date(date as string);

    const availableSlots = await TimeSlot.findAvailableSlots(
      area as string,
      queryDate
    );

    res.status(200).json({
      success: true,
      count: availableSlots.length,
      timeSlots: availableSlots,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a specific time slot by ID
export const getTimeSlotById = async (req: Request, res: Response) => {
  try {
    const timeSlotId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(timeSlotId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time slot ID",
      });
    }

    const timeSlot = await TimeSlot.findById(timeSlotId).populate(
      "postmanId",
      "name email"
    );

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
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update a time slot
export const updateTimeSlot = async (req: Request, res: Response) => {
  try {
    // Check if user is an admin
    if ((req as any).user.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Only admins can update time slots",
      });
    }

    const timeSlotId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(timeSlotId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time slot ID",
      });
    }

    // If postmanId is provided, check if the postman exists
    if (req.body.postmanId) {
      const postman = await User.findById(req.body.postmanId);
      if (!postman || postman.role !== UserRole.POSTMAN) {
        return res.status(400).json({
          success: false,
          message: "Invalid postman ID or user is not a postman",
        });
      }
    }

    const timeSlot = await TimeSlot.findById(timeSlotId);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    // Update the time slot
    const updatedTimeSlot = await TimeSlot.findByIdAndUpdate(
      timeSlotId,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      timeSlot: updatedTimeSlot,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a time slot
export const deleteTimeSlot = async (req: Request, res: Response) => {
  try {
    // Check if user is an admin
    if ((req as any).user.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete time slots",
      });
    }

    const timeSlotId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(timeSlotId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time slot ID",
      });
    }

    const timeSlot = await TimeSlot.findById(timeSlotId);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    await TimeSlot.deleteOne({ _id: timeSlotId });

    res.status(200).json({
      success: true,
      message: "Time slot deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Assign a postman to a time slot
export const assignPostman = async (req: Request, res: Response) => {
  try {
    // Check if user is an admin
    if ((req as any).user.role !== UserRole.ADMIN) {
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
    const postman = await User.findById(postmanId);
    if (!postman || postman.role !== UserRole.POSTMAN) {
      return res.status(400).json({
        success: false,
        message: "Invalid postman ID or user is not a postman",
      });
    }

    // Check if the time slot exists
    const timeSlot = await TimeSlot.findById(timeSlotId);
    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    // Assign the postman to the time slot
    timeSlot.postmanId = new mongoose.Types.ObjectId(postmanId);
    await timeSlot.save();

    res.status(200).json({
      success: true,
      timeSlot,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
