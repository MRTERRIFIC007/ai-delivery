import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";

interface TimeSlot {
  _id: string;
  startTime: string;
  endTime: string;
  available: number;
  capacity: number;
  priority: "high" | "medium" | "low";
}

interface AIPrediction {
  slotId: string;
  confidence: number;
  reason: string;
}

interface TimeSlotSelectorProps {
  area: string;
  date: Date;
  onSlotSelect: (slotId: string) => void;
  orderId: string;
}

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  area,
  date,
  onSlotSelect,
  orderId,
}) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [aiPredictions, setAIPredictions] = useState<AIPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchAvailableSlots();
  }, [area, date]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${
          import.meta.env.VITE_APP_API_URL
        }/api/timeslots/available?area=${encodeURIComponent(
          area
        )}&date=${format(date, "yyyy-MM-dd")}`,
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
      setSlots(data.slots);
      setAIPredictions(data.aiPredictions || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch time slots"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = async (slotId: string) => {
    try {
      setError(null);
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/api/timeslots/book`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            slotId,
            orderId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to book time slot");
      }

      setSelectedSlot(slotId);
      onSlotSelect(slotId);
      await fetchAvailableSlots(); // Refresh available slots
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book time slot");
    }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Available Time Slots for {format(date, "MMMM d, yyyy")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots.map((slot) => {
          const prediction = aiPredictions.find((p) => p.slotId === slot._id);
          const isSelected = selectedSlot === slot._id;
          const isAvailable = slot.available > 0;

          return (
            <div
              key={slot._id}
              className={`p-4 rounded-lg border ${
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : isAvailable
                  ? "border-gray-200 hover:border-blue-300"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {format(new Date(slot.startTime), "h:mm a")} -{" "}
                    {format(new Date(slot.endTime), "h:mm a")}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {slot.available} of {slot.capacity} slots available
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getSlotPriorityColor(
                    slot.priority
                  )}`}
                >
                  {slot.priority}
                </span>
              </div>

              {prediction && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>AI Recommendation: {prediction.reason}</p>
                  <p className="text-xs text-gray-500">
                    Confidence: {(prediction.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              )}

              <button
                onClick={() => handleSlotSelect(slot._id)}
                disabled={!isAvailable || isSelected}
                className={`mt-3 w-full px-4 py-2 rounded-md text-sm font-medium ${
                  isSelected
                    ? "bg-blue-100 text-blue-800 cursor-default"
                    : isAvailable
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSelected
                  ? "Selected"
                  : isAvailable
                  ? "Select Time Slot"
                  : "No Slots Available"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSlotSelector;
