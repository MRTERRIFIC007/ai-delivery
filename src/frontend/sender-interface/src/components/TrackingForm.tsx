import React, { useState } from "react";
import { OrderStatus } from "../types/order";
import { deliveryAPI } from "../utils/api";
import { LoadingTrackingResult } from "./LoadingSkeleton";
import { Icons } from "./Icons";

interface TrackingResult {
  trackingNumber: string;
  status: OrderStatus;
  recipient: string;
  address: string;
  createdAt: string;
  deliveredAt?: string;
  scheduledDelivery?: string;
}

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "Pending",
  [OrderStatus.CONFIRMED]: "Confirmed",
  [OrderStatus.ASSIGNED]: "Assigned",
  [OrderStatus.IN_TRANSIT]: "In Transit",
  [OrderStatus.DELIVERED]: "Delivered",
  [OrderStatus.CANCELLED]: "Cancelled",
};

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [OrderStatus.CONFIRMED]: "bg-blue-100 text-blue-800",
  [OrderStatus.ASSIGNED]: "bg-purple-100 text-purple-800",
  [OrderStatus.IN_TRANSIT]: "bg-indigo-100 text-indigo-800",
  [OrderStatus.DELIVERED]: "bg-green-100 text-green-800",
  [OrderStatus.CANCELLED]: "bg-red-100 text-red-800",
};

const TrackingForm: React.FC = () => {
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await deliveryAPI.trackDelivery(trackingNumber);

      if (response.success && response.tracking) {
        setTrackingResult(response.tracking);
      } else {
        throw new Error("Invalid tracking information received");
      }
    } catch (error: any) {
      setError(
        error.message ||
          "Failed to find package. Please check the tracking number."
      );
      setTrackingResult(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Track Your Package
      </h2>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-grow">
            <label htmlFor="tracking-number" className="sr-only">
              Tracking Number
            </label>
            <input
              type="text"
              id="tracking-number"
              placeholder="Enter your tracking number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Tracking...
              </span>
            ) : (
              <span className="flex items-center">
                <Icons.Search size={16} className="mr-2" />
                Track Package
              </span>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingTrackingResult />
      ) : (
        trackingResult && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-4">
              <div>
                <h3 className="font-bold text-lg">
                  {trackingResult.trackingNumber}
                </h3>
                <p className="text-sm text-gray-600">
                  Created on {formatDate(trackingResult.createdAt)}
                </p>
              </div>
              <div
                className={`mt-2 sm:mt-0 px-4 py-1 rounded-full text-sm font-semibold ${
                  statusColors[trackingResult.status]
                }`}
              >
                {statusLabels[trackingResult.status]}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm text-gray-500 mb-1">Recipient</h4>
                <p className="font-semibold">{trackingResult.recipient}</p>
              </div>

              <div>
                <h4 className="text-sm text-gray-500 mb-1">Delivery Address</h4>
                <p className="font-semibold">{trackingResult.address}</p>
              </div>

              <div>
                <h4 className="text-sm text-gray-500 mb-1">
                  Scheduled Delivery
                </h4>
                <p className="font-semibold">
                  {trackingResult.scheduledDelivery
                    ? formatDate(trackingResult.scheduledDelivery)
                    : "To be scheduled"}
                </p>
              </div>

              <div>
                <h4 className="text-sm text-gray-500 mb-1">Delivery Status</h4>
                <p className="font-semibold">
                  {trackingResult.status === OrderStatus.DELIVERED
                    ? `Delivered on ${formatDate(
                        trackingResult.deliveredAt || ""
                      )}`
                    : statusLabels[trackingResult.status]}
                </p>
              </div>
            </div>
          </div>
        )
      )}

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>
          Need help? Contact our support at{" "}
          <a
            href="mailto:support@indiapost.gov.in"
            className="text-indigo-600 hover:text-indigo-800"
          >
            support@indiapost.gov.in
          </a>
        </p>
      </div>
    </div>
  );
};

export default TrackingForm;
