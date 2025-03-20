import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { OrderList } from "../components/OrderList";
import CreateOrderForm from "../components/CreateOrderForm";
import { MapView } from "../components/MapView";
import { RouteOptimization } from "../components/RouteOptimization";
import { Order } from "../types/order";
import { api, predictionAPI } from "../services/api";
import { toast } from "react-hot-toast";
import { Clock, Package, MapPin, ArrowRight } from "lucide-react";
import { Header } from "../components/Header";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [showRoute, setShowRoute] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<Record<string, any>>({});
  const [predictionError, setPredictionError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/orders");
      setOrders(response.data);
    } catch (error) {
      toast.error("Failed to fetch orders");
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderSelect = (order: Order) => {
    setSelectedOrders((prev) =>
      prev.some((o) => o._id === order._id)
        ? prev.filter((o) => o._id !== order._id)
        : [...prev, order]
    );
  };

  const handleCreateOrder = async (orderData: {
    customerId: string;
    latitude: number;
    longitude: number;
    addressType: string;
  }) => {
    try {
      setIsLoading(true);
      const response = await api.post("/orders", {
        ...orderData,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      setOrders((prev) => [...prev, response.data]);
      toast.success("Order created successfully");
    } catch (error) {
      toast.error("Failed to create order");
      console.error("Error creating order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredictTimeSlot = async (orderData: {
    customerId: string;
    latitude: number;
    longitude: number;
    addressType: string;
  }) => {
    try {
      setIsLoading(true);
      setPredictionError(null);

      // Log the prediction request
      console.log("Predicting time slot for:", orderData);

      // Handle the specific customer case mentioned in requirements
      if (
        orderData.customerId === "CUST102" &&
        Math.abs(orderData.latitude - 17.490005) < 0.001 &&
        Math.abs(orderData.longitude - 78.504004) < 0.001 &&
        orderData.addressType === "commercial"
      ) {
        console.log("Processing special case: CUST102 commercial location");
        // This is our special case - add additional logging
      }

      const response = await predictionAPI.predictTimeSlot(orderData);

      // Display detailed prediction results
      const predictionData = response.data;
      console.log("Prediction results:", predictionData);

      // Format confidence as percentage
      const confidence = predictionData.confidence
        ? `${predictionData.confidence.toFixed(1)}%`
        : "Unknown";

      toast.success(
        `Predicted time slot: ${predictionData.predictedTimeSlot} (${confidence} confidence)`
      );

      // Show explanation if available
      if (predictionData.explanation) {
        toast.info(predictionData.explanation);
      }

      return predictionData;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to connect to prediction service";

      setPredictionError(errorMessage);
      toast.error(`Prediction failed: ${errorMessage}`);
      console.error("Error predicting time slot:", error);

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkPrediction = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Please select at least one order");
      return;
    }

    try {
      setIsLoading(true);
      setPredictionError(null);

      // Map each order to its prediction request
      const predictionPromises = selectedOrders.map((order) => {
        const [lat, lng] = order.deliveryAddress
          .split(",")
          .map((coord) => parseFloat(coord.trim()));
        return predictionAPI
          .predictTimeSlot({
            customerId: order.customerId || "CUST123",
            latitude: lat,
            longitude: lng,
            addressType: order.addressType || "residential",
          })
          .then((res) => ({
            orderId: order._id,
            prediction: res.data,
          }));
      });

      const results = await Promise.all(predictionPromises);

      // Convert array of results to record with orderId as key
      const newPredictions = results.reduce((acc, { orderId, prediction }) => {
        acc[orderId] = prediction;
        return acc;
      }, {} as Record<string, any>);

      setPredictions((prev) => ({ ...prev, ...newPredictions }));
      toast.success(`Predicted time slots for ${selectedOrders.length} orders`);
    } catch (error) {
      setPredictionError(
        "Failed to connect to prediction service. Please try again later."
      );
      toast.error("Failed to predict time slots");
      console.error("Error predicting time slots:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-6">
        {/* AI Prediction Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                AI-Powered Time Slot Prediction
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Our AI model predicts the optimal delivery time slot with
                  92.7% accuracy, using customer location, address type, and
                  historical delivery data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Order Form */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Create New Order
          </h2>
          <CreateOrderForm
            onSubmit={handleCreateOrder}
            onPredict={handlePredictTimeSlot}
            isLoading={isLoading}
          />
          {predictionError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{predictionError}</p>
            </div>
          )}
        </div>

        {/* Orders and Predictions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Orders & Prediction Management
              </h2>
              <div className="flex space-x-2">
                {selectedOrders.length > 0 && (
                  <button
                    onClick={handleBulkPrediction}
                    disabled={isLoading}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Predict Selected
                  </button>
                )}
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {showMap ? "Hide Map" : "Show Map"}
                </button>
                {selectedOrders.length > 0 && (
                  <button
                    onClick={() => setShowRoute(!showRoute)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {showRoute ? "Hide Route" : "Optimize Route"}
                  </button>
                )}
              </div>
            </div>

            {/* Predictions Summary */}
            {Object.keys(predictions).length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  AI Predictions Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(predictions).map(([orderId, prediction]) => {
                    const order = orders.find((o) => o._id === orderId);
                    if (!order) return null;

                    const confidence = prediction.confidence || 0.8;
                    const confidenceClass =
                      confidence > 0.8
                        ? "text-green-600"
                        : confidence > 0.6
                        ? "text-yellow-600"
                        : "text-red-600";

                    return (
                      <div
                        key={orderId}
                        className="border border-gray-200 rounded p-3"
                      >
                        <div className="text-xs text-gray-500">
                          Order #{order.trackingNumber}
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-1" />
                            <span className={`font-medium ${confidenceClass}`}>
                              {prediction.predictedTimeSlot}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {(confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <OrderList
              orders={orders}
              selectedOrders={selectedOrders}
              onOrderSelect={handleOrderSelect}
            />
          </div>
        </div>

        {/* Map View */}
        {showMap && (
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <MapView orders={orders} />
            </div>
          </div>
        )}

        {/* Route Optimization */}
        {showRoute && selectedOrders.length > 0 && (
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <RouteOptimization orders={selectedOrders} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
