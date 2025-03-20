import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { Clock, MapPin, Package, Calendar } from "lucide-react";
import { api } from "../services/api";

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
  const { token } = useAuth();

  const handleCreateOrder = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.post("/orders/create-with-prediction", {
        customerId,
        latitude,
        longitude,
        addressType,
        itemType,
        dayOfWeek,
        deliveryDate: "2024-12-18",
      });

      if (response.status >= 200 && response.status < 300) {
        const data = response.data;
        setOrder(data.order);
        toast.success(
          `Order created with predicted time slot: ${data.order.predictedTimeSlot}`
        );
        if (data.order.explanation) {
          toast.info(data.order.explanation);
        }
      } else {
        const errorData = response.data;
        setError(errorData.message || "Failed to create order");
        toast.error(`Order creation failed: ${errorData.message}`);
      }
    } catch (error: any) {
      setError("Failed to connect to service");
      toast.error(
        error.response?.data?.message || "Failed to connect to order service"
      );
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
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:px-6 flex items-center space-x-2">
        <Clock className="text-blue-600" />
        <h2 className="text-lg font-semibold">Order With AI Predictions</h2>
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Customer ID
            </label>
            <div className="flex items-center border rounded-md">
              <span className="pl-3 text-gray-500">
                <Package size={16} />
              </span>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full p-2 border-0 focus:ring-0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Item Type</label>
            <div className="flex items-center border rounded-md">
              <span className="pl-3 text-gray-500">
                <Package size={16} />
              </span>
              <input
                type="text"
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="w-full p-2 border-0 focus:ring-0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Latitude</label>
            <div className="flex items-center border rounded-md">
              <span className="pl-3 text-gray-500">
                <MapPin size={16} />
              </span>
              <input
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                step="0.000001"
                className="w-full p-2 border-0 focus:ring-0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Longitude</label>
            <div className="flex items-center border rounded-md">
              <span className="pl-3 text-gray-500">
                <MapPin size={16} />
              </span>
              <input
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                step="0.000001"
                className="w-full p-2 border-0 focus:ring-0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Address Type
            </label>
            <select
              value={addressType}
              onChange={(e) => setAddressType(parseInt(e.target.value))}
              className="w-full p-2 border rounded-md"
            >
              <option value={0}>Residential</option>
              <option value={1}>Commercial</option>
              <option value={2}>Industrial</option>
              <option value={3}>Educational</option>
              <option value={4}>Government</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Day of Week
            </label>
            <div className="flex items-center border rounded-md">
              <span className="pl-3 text-gray-500">
                <Calendar size={16} />
              </span>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                className="w-full p-2 border-0 focus:ring-0"
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
        </div>

        <button
          onClick={handleCreateOrder}
          disabled={isLoading}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <Clock size={16} />
              <span>Create Order & Predict Optimal Time Slot</span>
            </>
          )}
        </button>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        {order && (
          <div className="mt-6 p-4 border rounded-lg bg-blue-50">
            <h3 className="font-bold text-lg mb-4 text-blue-800">
              Order Created Successfully
            </h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <span className="font-medium text-sm text-blue-700">
                  Order ID:
                </span>
                <p className="text-gray-900">{order.orderId}</p>
              </div>
              <div>
                <span className="font-medium text-sm text-blue-700">
                  Customer ID:
                </span>
                <p className="text-gray-900">{order.customerId}</p>
              </div>
              <div>
                <span className="font-medium text-sm text-blue-700">
                  Postman ID:
                </span>
                <p className="text-gray-900">{order.postmanId}</p>
              </div>
              <div>
                <span className="font-medium text-sm text-blue-700">
                  Item Type:
                </span>
                <p className="text-gray-900">{order.itemType}</p>
              </div>
              <div>
                <span className="font-medium text-sm text-blue-700">
                  Address:
                </span>
                <p className="text-gray-900">{order.deliveryAddress}</p>
              </div>
              <div>
                <span className="font-medium text-sm text-blue-700">
                  Address Type:
                </span>
                <p className="text-gray-900">
                  {getAddressTypeLabel(order.addressType)}
                </p>
              </div>

              <div className="col-span-2 mt-4 mb-2">
                <h4 className="font-bold text-blue-800">Prediction Results</h4>
              </div>

              <div>
                <span className="font-medium text-sm text-blue-700">
                  Time Slot:
                </span>
                <p className="text-gray-900 font-bold">
                  {getTimeSlotLabel(order.predictedTimeSlot)}
                </p>
              </div>
              <div>
                <span className="font-medium text-sm text-blue-700">
                  Confidence:
                </span>
                <p
                  className={`font-bold ${
                    order.confidence > 80
                      ? "text-green-600"
                      : order.confidence > 60
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {formatConfidence(order.confidence)}
                </p>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-sm text-blue-700">
                  Explanation:
                </span>
                <p className="text-gray-900">{order.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotPrediction;
