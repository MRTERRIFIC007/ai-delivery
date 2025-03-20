import React, { useState } from "react";
import { toast } from "react-hot-toast";

interface TimeSlotPredictionProps {
  initialCustomerId?: string;
  initialLatitude?: number;
  initialLongitude?: number;
  initialAddressType?: number;
}

const TimeSlotPrediction: React.FC<TimeSlotPredictionProps> = ({
  initialCustomerId = "CUST102",
  initialLatitude = 17.490005,
  initialLongitude = 78.504004,
  initialAddressType = 1, // Commercial
}) => {
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [addressType, setAddressType] = useState(initialAddressType);
  const [itemType, setItemType] = useState("GID-PAN");
  const [dayOfWeek, setDayOfWeek] = useState(3); // Wednesday
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  const handleCreateOrder = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/orders/create-with-prediction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          customerId,
          latitude,
          longitude,
          addressType,
          itemType,
          dayOfWeek,
          deliveryDate: "2024-12-18",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        toast.success(
          `Order created with predicted time slot: ${data.order.predictedTimeSlot}`
        );
        if (data.order.explanation) {
          toast.info(data.order.explanation);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create order");
        toast.error(`Order creation failed: ${errorData.message}`);
      }
    } catch (error) {
      setError("Failed to connect to service");
      toast.error("Failed to connect to order service");
    } finally {
      setIsLoading(false);
    }
  };

  // Get the time slot label (e.g., "12-13") from the time slot number
  const getTimeSlotLabel = (slotNumber: number): string => {
    const timeSlots = [
      "10-11",
      "11-12",
      "12-13",
      "13-14",
      "14-15",
      "15-16",
      "16-17",
      "17-18",
      "18-19",
    ];
    return timeSlots[slotNumber - 1] || "Unknown";
  };

  // Get address type label
  const getAddressTypeLabel = (type: number): string => {
    const types = [
      "Residential",
      "Commercial",
      "Industrial",
      "Educational",
      "Government",
    ];
    return types[type] || "Unknown";
  };

  // Format confidence as percentage
  const formatConfidence = (confidence?: number): string => {
    if (confidence === undefined) return "N/A";
    return `${Math.round(confidence)}%`;
  };

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">Sender Interface</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block mb-1">Customer ID</label>
          <input
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Item Type</label>
          <input
            type="text"
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Latitude</label>
          <input
            type="number"
            value={latitude}
            onChange={(e) => setLatitude(parseFloat(e.target.value))}
            step="0.000001"
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Longitude</label>
          <input
            type="number"
            value={longitude}
            onChange={(e) => setLongitude(parseFloat(e.target.value))}
            step="0.000001"
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Address Type</label>
          <select
            value={addressType}
            onChange={(e) => setAddressType(parseInt(e.target.value))}
            className="w-full p-2 border rounded"
          >
            <option value={0}>Residential</option>
            <option value={1}>Commercial</option>
            <option value={2}>Industrial</option>
            <option value={3}>Educational</option>
            <option value={4}>Government</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Day of Week</label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
            className="w-full p-2 border rounded"
          >
            <option value={0}>Monday</option>
            <option value={1}>Tuesday</option>
            <option value={2}>Wednesday</option>
            <option value={3}>Thursday</option>
            <option value={4}>Friday</option>
            <option value={5}>Saturday</option>
            <option value={6}>Sunday</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleCreateOrder}
        disabled={isLoading}
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
      >
        {isLoading
          ? "Processing..."
          : "Create Order & Predict Optimal Time Slot"}
      </button>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {order && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h3 className="font-bold text-lg mb-2">Order Created Successfully</h3>
          <div className="grid grid-cols-2 gap-2">
            <p>
              <span className="font-semibold">Order ID:</span> {order.orderId}
            </p>
            <p>
              <span className="font-semibold">Customer ID:</span>{" "}
              {order.customerId}
            </p>
            <p>
              <span className="font-semibold">Postman ID:</span>{" "}
              {order.postmanId}
            </p>
            <p>
              <span className="font-semibold">Item Type:</span> {order.itemType}
            </p>
            <p>
              <span className="font-semibold">Address:</span>{" "}
              {order.deliveryAddress}
            </p>
            <p>
              <span className="font-semibold">Address Type:</span>{" "}
              {getAddressTypeLabel(order.addressType)}
            </p>

            <div className="col-span-2 mt-4 mb-2">
              <h4 className="font-bold">Prediction Results</h4>
            </div>

            <p>
              <span className="font-semibold">Time Slot:</span>{" "}
              {getTimeSlotLabel(order.predictedTimeSlot)}
            </p>
            <p>
              <span className="font-semibold">Confidence:</span>{" "}
              {formatConfidence(order.confidence)}
            </p>
            <p className="col-span-2">
              <span className="font-semibold">Explanation:</span>{" "}
              {order.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotPrediction;
