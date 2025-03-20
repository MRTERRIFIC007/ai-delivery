import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { Clock, Star } from "lucide-react";

interface TimeSlot {
  _id: string;
  startTime: string;
  endTime: string;
  available: number;
  capacity: number;
  priority: "high" | "medium" | "low";
  aiConfidence?: number;
}

interface AIPrediction {
  slotId: string;
  confidence: number;
  reason: string;
  rank: number;
}

interface TimeSlotSelectorProps {
  slots?: { time: string; available: number }[];
  selectedSlot?: string | null;
  onSelectSlot: (slot: string) => void;
  area?: string;
  date?: Date;
  orderId?: string;
  isBulkMode?: boolean;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  slots: providedSlots,
  selectedSlot,
  onSelectSlot,
  area = "default",
  date = new Date(),
  orderId,
  isBulkMode = false,
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [aiPredictions, setAIPredictions] = useState<AIPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    // If slots are provided directly (legacy mode), use them
    if (providedSlots && providedSlots.length > 0) {
      const formattedSlots = providedSlots.map((slot, index) => ({
        _id: slot.time,
        startTime: slot.time.split("-")[0],
        endTime: slot.time.split("-")[1],
        available: slot.available,
        capacity: slot.available,
        priority: "medium" as "high" | "medium" | "low",
        aiConfidence: undefined,
      }));
      setTimeSlots(formattedSlots);
      setLoading(false);
    } else {
      // Otherwise fetch from API
      fetchAvailableSlots();
    }
  }, [area, date, providedSlots]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      const formattedDate = format(date, "yyyy-MM-dd");
      console.log(`Fetching time slots for ${area} on ${formattedDate}`);

      const response = await fetch(
        `${
          import.meta.env.VITE_APP_API_URL || "http://localhost:5003"
        }/api/timeslots/available?area=${encodeURIComponent(
          area
        )}&date=${formattedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch time slots");
      }

      const data = await response.json();

      if (data.slots && Array.isArray(data.slots)) {
        setTimeSlots(data.slots);
      } else {
        // Default slots if none returned
        setTimeSlots(getDefaultTimeSlots());
      }

      if (data.aiPredictions && Array.isArray(data.aiPredictions)) {
        setAIPredictions(data.aiPredictions);
      }
    } catch (err) {
      console.error("Error fetching time slots:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch time slots"
      );
      // Set default time slots
      setTimeSlots(getDefaultTimeSlots());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTimeSlots = (): TimeSlot[] => {
    const defaultSlots = [];
    const baseDate = new Date();
    baseDate.setHours(10, 0, 0, 0);

    for (let i = 0; i < 4; i++) {
      const startHour = 10 + i * 2;
      const endHour = startHour + 2;

      const startTime = new Date(baseDate);
      startTime.setHours(startHour);

      const endTime = new Date(baseDate);
      endTime.setHours(endHour);

      defaultSlots.push({
        _id: `${startHour}-${endHour}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        available: 10 - i,
        capacity: 10,
        priority: "medium" as "high" | "medium" | "low",
        aiConfidence: undefined,
      });
    }

    return defaultSlots;
  };

  const handleSlotSelect = (slotId: string) => {
    onSelectSlot(slotId);
  };

  const getSlotPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Find AI prediction for a slot
  const getAIPrediction = (slotId: string) => {
    return aiPredictions.find((p) => p.slotId === slotId);
  };

  // Check if slot has highest AI recommendation
  const isRecommended = (slotId: string) => {
    if (aiPredictions.length === 0) return false;

    const prediction = getAIPrediction(slotId);
    if (!prediction) return false;

    // Find the prediction with rank 1 (highest)
    const bestPrediction = aiPredictions.find((p) => p.rank === 1);
    return bestPrediction && bestPrediction.slotId === slotId;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Filter out any invalid time slots
  const validTimeSlots = timeSlots.filter((slot) => {
    try {
      // Check if dates are valid
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);
      return !isNaN(startTime.getTime()) && !isNaN(endTime.getTime());
    } catch {
      return false;
    }
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-lg font-semibold">
          {isBulkMode ? "Bulk Time Slot Selection" : "Select Time Slot"}
        </h2>
      </div>
      <div className="border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {validTimeSlots.map((slot) => (
            <button
              key={slot._id}
              onClick={() => handleSlotSelect(slot._id)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedSlot === slot._id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock size={16} className="text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {format(new Date(slot.startTime), "h:mm a")} -{" "}
                    {format(new Date(slot.endTime), "h:mm a")}
                  </span>
                </div>
                {slot.aiConfidence && (
                  <span
                    className={`text-sm font-medium ${
                      slot.aiConfidence > 0.8
                        ? "text-green-600"
                        : slot.aiConfidence > 0.6
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {(slot.aiConfidence * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              {isBulkMode && (
                <p className="mt-2 text-sm text-gray-500">
                  This time slot will be applied to all selected orders
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeSlotSelector;
