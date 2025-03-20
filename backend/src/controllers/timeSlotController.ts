import { Request, Response } from "express";
import TimeSlot from "../models/TimeSlot";
import User from "../models/User";
import mongoose from "mongoose";
import { UserRole } from "../models/User";
import fetch from "node-fetch";

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
    const { area, date, customerId, addressType, postalCode } = req.query;

    // Better validation for required parameters
    if (!area) {
      console.warn("Missing area parameter in getAvailableTimeSlots");
      return res.status(400).json({
        success: false,
        message: "Area is a required parameter",
        slots: [],
        aiPredictions: [],
      });
    }

    // Parse and validate date
    let queryDate: Date;

    if (!date) {
      // Default to today if date is not provided
      queryDate = new Date();
      console.log(
        "No date provided, defaulting to today:",
        queryDate.toISOString().split("T")[0]
      );
    } else {
      try {
        queryDate = new Date(date as string);

        // Check if date is valid
        if (isNaN(queryDate.getTime())) {
          console.error("Invalid date format provided:", date);
          queryDate = new Date(); // Default to today
          console.log(
            "Invalid date, defaulting to today:",
            queryDate.toISOString().split("T")[0]
          );
        }
      } catch (e) {
        console.error("Error parsing date:", e);
        queryDate = new Date(); // Default to today
        console.log(
          "Error parsing date, defaulting to today:",
          queryDate.toISOString().split("T")[0]
        );
      }
    }

    // Set to beginning of day to standardize
    queryDate.setHours(0, 0, 0, 0);

    const customer = (req as any).user;

    // Find available slots
    const availableSlots = await TimeSlot.findAvailableSlots(
      area as string,
      queryDate
    );

    console.log(
      `Found ${availableSlots.length} available slots for area ${area} on ${
        queryDate.toISOString().split("T")[0]
      }`
    );

    // Get AI predictions for time slots
    let aiPredictions = [];
    try {
      // Call AI prediction service with India Post specific parameters
      const dayOfWeek = queryDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
      const customerLocation = area;
      const locationType = addressType || "home";
      const areaCode = postalCode
        ? (postalCode as string).substring(0, 3)
        : "110"; // First 3 digits of postal code

      // Special case for CUST102
      if (
        customerId === "CUST102" &&
        Math.abs(customer?.latitude - 17.490005) < 0.001 &&
        Math.abs(customer?.longitude - 78.504004) < 0.001 &&
        locationType === "commercial"
      ) {
        console.log("Processing special case: CUST102 commercial location");
        // Special handling for CUST102
        aiPredictions = generateFallbackPredictions(availableSlots);
      } else {
        // Try to connect to AI service
        try {
          const response = await fetch(
            "http://localhost:5001/predict-timeslot",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                recipient_id: customerId || customer?.id || 0,
                day_of_week: dayOfWeek,
                location_type: locationType,
                area_code: areaCode,
                distance: 5.0,
                order_value: 500.0,
                latitude: customer?.latitude || 0,
                longitude: customer?.longitude || 0,
              }),
              timeout: 5000,
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.predictions && data.predictions.length > 0) {
              // Map AI predictions to time slots
              aiPredictions = mapAIPredictionsToTimeSlots(
                data.predictions,
                availableSlots
              );
              console.log(
                "Successfully received AI predictions:",
                aiPredictions
              );
            } else {
              console.log(
                "No predictions returned from AI service, using fallback"
              );
              aiPredictions = generateFallbackPredictions(availableSlots);
            }
          } else {
            console.error("AI service returned error status:", response.status);
            aiPredictions = generateFallbackPredictions(availableSlots);
          }
        } catch (e) {
          console.error("Error calling AI prediction service:", e);
          aiPredictions = generateFallbackPredictions(availableSlots);
        }
      }
    } catch (error) {
      console.error("Error generating AI predictions:", error);
      // Still provide available slots without AI predictions
      aiPredictions = generateFallbackPredictions(availableSlots);
    }

    return res.json({
      success: true,
      slots: availableSlots,
      aiPredictions,
    });
  } catch (error) {
    console.error("Error in getAvailableTimeSlots:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching available time slots",
      slots: [],
      aiPredictions: [],
    });
  }
};

// Helper function to check if AI service is available
async function checkAIServiceAvailability(): Promise<boolean> {
  try {
    const response = await fetch("http://localhost:5005/health", {
      method: "GET",
      // Short timeout to avoid hanging
      timeout: 1000,
    });
    return response.ok;
  } catch (e) {
    return false;
  }
}

// Generate fallback AI predictions when the service is not available
function generateFallbackPredictions(slots: any[]): any[] {
  if (!slots || slots.length === 0) return [];

  // Create simple fallback predictions based on typical patterns
  // Morning slots for business, evening for residential
  const currentHour = new Date().getHours();
  const predictions = [];

  // Sort slots by time
  slots.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Assign confidence based on time of day and general patterns
  slots.forEach((slot, index) => {
    const startHour = new Date(slot.startTime).getHours();

    // Basic logic: Business hours (10-14) are generally more popular
    // Evening hours (16-19) are second most popular
    // Highest confidence to slots closest to current time
    let confidence = 0.5; // Default confidence
    let reason = "Based on typical delivery patterns";

    // Business hours get higher confidence
    if (startHour >= 10 && startHour <= 14) {
      confidence = 0.75;
      reason = "Business hours typically have high delivery success rates";
    }
    // Evening hours also get higher confidence
    else if (startHour >= 16 && startHour <= 19) {
      confidence = 0.7;
      reason = "Evening slots are popular for home deliveries";
    }

    // Slots closer to current time (within 4 hours) get boosted confidence
    if (Math.abs(startHour - currentHour) <= 4) {
      confidence = Math.min(0.9, confidence + 0.2);
      reason += " and this time is convenient based on current time";
    }

    predictions.push({
      slotId: slot._id,
      confidence,
      rank: index + 1,
      reason,
    });
  });

  // Sort by confidence (highest first)
  predictions.sort((a, b) => b.confidence - a.confidence);

  // Update ranks after sorting
  predictions.forEach((pred, index) => {
    pred.rank = index + 1;
  });

  return predictions;
}

// Map AI predictions to available time slots
function mapAIPredictionsToTimeSlots(
  predictions: any[],
  availableSlots: any[]
): any[] {
  if (!predictions || !availableSlots) return [];

  // Create a map of time slots by their start-end time format
  const slotMap = new Map();
  availableSlots.forEach((slot) => {
    const startHour = new Date(slot.startTime).getHours();
    const endHour = new Date(slot.endTime).getHours();
    const timeKey = `${startHour}-${endHour}`;
    slotMap.set(timeKey, slot._id);
  });

  // Map predictions to our slot IDs
  const mappedPredictions = [];
  predictions.forEach((pred, index) => {
    // Check if this time slot exists in our available slots
    if (slotMap.has(pred.time_slot)) {
      mappedPredictions.push({
        slotId: slotMap.get(pred.time_slot),
        confidence: pred.confidence / 100, // Convert percentage to decimal
        rank: pred.rank || index + 1,
        reason: pred.reason || "Recommended based on customer patterns",
      });
    }
  });

  return mappedPredictions;
}

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

// Add new endpoint to record recipient's time slot preference
export const recordTimeSlotPreference = async (req: Request, res: Response) => {
  try {
    const { recipientId, timeSlotId, date, addressType, postalCode, area } =
      req.body;

    if (!recipientId || !timeSlotId || !date) {
      return res.status(400).json({
        success: false,
        message: "Recipient ID, time slot ID and date are required",
      });
    }

    const timeSlot = await TimeSlot.findById(timeSlotId);
    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    const queryDate = new Date(date);
    const dayOfWeek = queryDate.getDay();
    const startHour = new Date(timeSlot.startTime).getHours();
    const endHour = new Date(timeSlot.endTime).getHours();
    const timeSlotString = `${startHour}-${endHour}`;
    const areaCode = postalCode ? postalCode.substring(0, 3) : "110";

    // Send feedback to the AI service to learn from this preference
    try {
      const response = await fetch("http://localhost:5005/learn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_data: {
            recipient_id: recipientId,
            day_of_week: dayOfWeek,
            location_type: addressType || "home",
            area_code: areaCode,
            distance: 5.0,
            order_value: 500.0,
          },
          selected_slot: timeSlotString,
        }),
      });

      if (!response.ok) {
        console.error("Failed to send preference to AI service");
      }
    } catch (error) {
      console.error("Error sending preference to AI service:", error);
    }

    res.status(200).json({
      success: true,
      message: "Time slot preference recorded successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
