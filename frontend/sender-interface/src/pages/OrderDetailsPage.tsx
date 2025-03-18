import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { IOrder, OrderStatus } from "../types/order";
import {
  Loader2,
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  CheckCircle,
  Calendar,
  User,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import { ordersAPI } from "../utils/api";
import useAuth from "../hooks/useAuth";

const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const token = getToken();

        if (!token) {
          navigate("/");
          return;
        }

        if (!id) {
          throw new Error("Order ID is missing");
        }

        const response = await ordersAPI.getOrderById(id, token);
        setOrder(response.order);
      } catch (error: any) {
        setError(error.message || "Failed to fetch order details");
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, navigate, getToken]);

  const getStatusStepNumber = (status: OrderStatus): number => {
    switch (status) {
      case OrderStatus.PENDING:
        return 1;
      case OrderStatus.CONFIRMED:
        return 2;
      case OrderStatus.ASSIGNED:
        return 3;
      case OrderStatus.IN_TRANSIT:
        return 4;
      case OrderStatus.DELIVERED:
        return 5;
      case OrderStatus.CANCELLED:
        return 0;
      default:
        return 0;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto text-blue-600" />
          <p className="mt-4 text-lg text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:px-6 lg:px-8">
        <div className="bg-red-100 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-800 mb-4">Error</h2>
          <p className="text-red-700">{error || "Order not found"}</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getStatusStepNumber(order.status as OrderStatus);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#E52D27] to-[#FF6B35] p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Order #{order.trackingNumber}
              </h1>
              <p className="text-white opacity-90 mt-1">
                Created on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="mt-3 md:mt-0 px-4 py-2 bg-white rounded-md font-semibold text-[#E52D27]">
              {order.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Delivery Status Timeline */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Delivery Status</h2>
          <div className="relative">
            <div className="absolute left-0 inset-y-0 w-0.5 bg-gray-200 ml-6"></div>

            <div className="flex items-center mb-8 relative">
              <div
                className={`rounded-full h-12 w-12 flex items-center justify-center z-10 ${
                  currentStep >= 1 ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <Package className="text-white" size={20} />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold">Order Placed</h3>
                <p className="text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center mb-8 relative">
              <div
                className={`rounded-full h-12 w-12 flex items-center justify-center z-10 ${
                  currentStep >= 2 ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <CheckCircle className="text-white" size={20} />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold">Order Confirmed</h3>
                <p className="text-sm text-gray-500">
                  {currentStep >= 2
                    ? "Your order has been confirmed"
                    : "Waiting for confirmation"}
                </p>
              </div>
            </div>

            <div className="flex items-center mb-8 relative">
              <div
                className={`rounded-full h-12 w-12 flex items-center justify-center z-10 ${
                  currentStep >= 3 ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <User className="text-white" size={20} />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold">
                  Assigned to Delivery Personnel
                </h3>
                <p className="text-sm text-gray-500">
                  {currentStep >= 3
                    ? `Assigned to ${
                        typeof order.assignedTo === "object" &&
                        order.assignedTo?.name
                          ? order.assignedTo.name
                          : "a delivery person"
                      }`
                    : "Waiting for assignment"}
                </p>
              </div>
            </div>

            <div className="flex items-center mb-8 relative">
              <div
                className={`rounded-full h-12 w-12 flex items-center justify-center z-10 ${
                  currentStep >= 4 ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <Truck className="text-white" size={20} />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold">In Transit</h3>
                <p className="text-sm text-gray-500">
                  {currentStep >= 4
                    ? "Your package is on the way"
                    : "Waiting for dispatch"}
                </p>
              </div>
            </div>

            <div className="flex items-center relative">
              <div
                className={`rounded-full h-12 w-12 flex items-center justify-center z-10 ${
                  currentStep >= 5 ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <MapPin className="text-white" size={20} />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold">Delivered</h3>
                <p className="text-sm text-gray-500">
                  {currentStep >= 5
                    ? `Delivered on ${
                        order.deliveredAt
                          ? formatDate(order.deliveredAt)
                          : "N/A"
                      }`
                    : "Waiting for delivery"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Order Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="mb-3">
                <span className="block text-sm text-gray-500">
                  Tracking Number
                </span>
                <span className="block font-semibold">
                  {order.trackingNumber}
                </span>
              </div>

              <div className="mb-3">
                <span className="block text-sm text-gray-500">Time Slot</span>
                <span className="block font-semibold flex items-center">
                  <Clock size={16} className="mr-1 text-gray-600" />
                  {typeof order.timeSlotId === "object" && order.timeSlotId
                    ? `${new Date(
                        order.timeSlotId.startTime
                      ).toLocaleTimeString()} - ${new Date(
                        order.timeSlotId.endTime
                      ).toLocaleTimeString()}`
                    : `Time Slot ${order.timeSlot}`}
                </span>
              </div>

              <div className="mb-3">
                <span className="block text-sm text-gray-500">
                  Scheduled Delivery
                </span>
                <span className="block font-semibold flex items-center">
                  <Calendar size={16} className="mr-1 text-gray-600" />
                  {order.scheduledDeliveryTime
                    ? formatDate(order.scheduledDeliveryTime)
                    : "To be scheduled"}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">
              Recipient Information
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="mb-3">
                <span className="block text-sm text-gray-500">Name</span>
                <span className="block font-semibold">
                  {order.recipient.name}
                </span>
              </div>

              <div className="mb-3">
                <span className="block text-sm text-gray-500">Phone</span>
                <span className="block font-semibold">
                  {order.recipient.phone}
                </span>
              </div>

              {order.recipient.email && (
                <div className="mb-3">
                  <span className="block text-sm text-gray-500">Email</span>
                  <span className="block font-semibold">
                    {order.recipient.email}
                  </span>
                </div>
              )}

              <div>
                <span className="block text-sm text-gray-500">Address</span>
                <span className="block font-semibold">
                  {order.deliveryAddress.street}, {order.deliveryAddress.city},{" "}
                  {order.deliveryAddress.state},{" "}
                  {order.deliveryAddress.postalCode}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Package Details */}
        <div className="p-6 border-t">
          <h2 className="text-xl font-semibold mb-4">Package Details</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <span className="block text-sm text-gray-500">Weight</span>
                <span className="block font-semibold">
                  {order.packageDetails.weight} kg
                </span>
              </div>

              <div>
                <span className="block text-sm text-gray-500">Dimensions</span>
                <span className="block font-semibold">
                  {order.packageDetails.dimensions.length} ×{" "}
                  {order.packageDetails.dimensions.width} ×{" "}
                  {order.packageDetails.dimensions.height} cm
                </span>
              </div>

              <div className="md:col-span-2">
                <span className="block text-sm text-gray-500">Description</span>
                <span className="block font-semibold">
                  {order.packageDetails.description ||
                    "No description provided"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {order.notes && (
          <div className="p-6 border-t">
            <h2 className="text-xl font-semibold mb-4">Delivery Notes</h2>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p>{order.notes}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 flex justify-end">
          {order.status === OrderStatus.PENDING && (
            <button
              className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-md mr-2 transition-colors"
              onClick={() => {
                // Would implement cancel logic here
                toast.error("Cancellation feature coming soon!");
              }}
            >
              Cancel Order
            </button>
          )}
          <Link
            to="/orders/create"
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
          >
            Create Similar Order
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
