import React, { useState, useEffect } from "react";
import { OrderList } from "../components/OrderList";
import TimeSlotSelector from "../components/TimeSlotSelector";
import { Order } from "../types";
import { Calendar, LogOut, Loader2, Plus, Map } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ordersAPI, timeSlotsAPI } from "../utils/api";

export const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [timeSlots, setTimeSlots] = useState<
    { time: string; available: number }[]
  >([]);
  const [showChangedOrders, setShowChangedOrders] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // If no token is found, redirect to login
    if (!token) {
      navigate("/");
      return;
    }

    // Fetch orders and time slots
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const ordersData = await ordersAPI.getOrders(token);
        setOrders(ordersData);

        try {
          const timeSlotsData = await timeSlotsAPI.getAvailableTimeSlots(token);
          // Transform the API response to match our component's expected format
          if (timeSlotsData.timeSlots) {
            const formattedTimeSlots = timeSlotsData.timeSlots.map((slot) => ({
              time: slot.name,
              available: 10, // Default value, adjust based on your API response
            }));
            setTimeSlots(formattedTimeSlots);
          }
        } catch (error) {
          console.error("Error fetching time slots:", error);
          // Fallback to default time slots
          setTimeSlots([
            { time: "Morning (8-12)", available: 10 },
            { time: "Afternoon (12-4)", available: 10 },
            { time: "Evening (4-8)", available: 9 },
          ]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        toast.error("Failed to load orders. Please try again.");
        // Fallback to empty arrays if API calls fail
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    toast.success("Logged out successfully");
  };

  const handleSelectTimeSlot = (slot: string) => {
    if (selectedOrder) {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication error. Please login again.");
        navigate("/");
        return;
      }

      // In a real app, you would update the order via API
      // For now, we'll update the local state
      const updatedOrders = orders.map((order) =>
        order._id === selectedOrder._id
          ? { ...order, selectedTimeSlot: slot, status: "scheduled" }
          : order
      );
      setOrders(updatedOrders);

      const updatedTimeSlots = timeSlots.map((timeSlot) =>
        timeSlot.time === slot
          ? { ...timeSlot, available: timeSlot.available - 1 }
          : timeSlot
      );
      setTimeSlots(updatedTimeSlots);

      toast.success("Delivery time slot scheduled successfully!");
      setSelectedOrder(null);
    }
  };

  const handleShowChangedOrders = () => {
    setShowChangedOrders(true);
  };

  const handleShowYourOrders = () => {
    setShowChangedOrders(false);
  };

  const filteredOrders = showChangedOrders
    ? orders.filter(
        (order) =>
          order.status === "scheduled" && order.selectedTimeSlot !== null
      )
    : orders;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto text-blue-600" />
          <p className="mt-4 text-lg text-gray-600">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-[#E52D27] to-[#FF6B35] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Calendar className="text-white" size={24} />
              <h1 className="ml-2 text-xl font-semibold text-white">
                India Post Delivery System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="flex items-center text-white hover:text-gray-200 transition-colors"
              >
                <LogOut size={20} className="mr-1" />
                Logout
              </button>
              <img
                src="./india post logo.png"
                alt="India Post Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="dashboard-buttons flex space-x-4 bg-blue-100 p-4 rounded-md">
              <button
                onClick={handleShowYourOrders}
                className={`px-4 py-2 rounded shadow transition ${
                  !showChangedOrders
                    ? "bg-blue-600 text-white"
                    : "bg-white text-blue-600 hover:bg-blue-50"
                }`}
              >
                Your Orders
              </button>
              <button
                onClick={handleShowChangedOrders}
                className={`px-4 py-2 rounded shadow transition ${
                  showChangedOrders
                    ? "bg-blue-600 text-white"
                    : "bg-white text-blue-600 hover:bg-blue-50"
                }`}
              >
                Scheduled Orders
              </button>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/delivery-map"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow flex items-center transition-colors"
              >
                <Map size={20} className="mr-1" />
                Delivery Map
              </Link>
              <Link
                to="/orders/create"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow flex items-center transition-colors"
              >
                <Plus size={20} className="mr-1" />
                New Order
              </Link>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-lg text-gray-600 mb-4">
                No orders found. Create a new order to get started!
              </p>
              <Link
                to="/orders/create"
                className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md shadow-md transition-colors"
              >
                <Plus size={20} className="mr-2" />
                Create Your First Order
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  {showChangedOrders ? "Scheduled Orders" : "Your Orders"}
                </h2>
                <OrderList
                  orders={filteredOrders}
                  onSelectOrder={setSelectedOrder}
                />
              </div>
              {selectedOrder && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-lg font-semibold mb-4">
                    Schedule Delivery for Order #{selectedOrder.trackingId}
                  </h2>
                  <TimeSlotSelector
                    slots={timeSlots}
                    selectedSlot={selectedOrder.selectedTimeSlot}
                    onSelectSlot={handleSelectTimeSlot}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
