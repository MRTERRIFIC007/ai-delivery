import React, { useState, useEffect } from "react";
import DeliveryMap from "../components/DeliveryMap";
import { Icons } from "../components/Icons";

interface Delivery {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  status: string;
}

const mockDeliveries: Delivery[] = [
  {
    id: "1",
    latitude: 19.076,
    longitude: 72.8777,
    address: "Mumbai, Maharashtra",
    status: "pending",
  },
  {
    id: "2",
    latitude: 28.6139,
    longitude: 77.209,
    address: "Delhi, Delhi",
    status: "pending",
  },
  {
    id: "3",
    latitude: 12.9716,
    longitude: 77.5946,
    address: "Bangalore, Karnataka",
    status: "pending",
  },
];

const startLocation = {
  latitude: 20.5937,
  longitude: 78.9629,
  address: "Nagpur, Maharashtra",
};

const DeliveryMapPage: React.FC = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>(mockDeliveries);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null
  );
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);

  const handleRouteOptimized = (route: any) => {
    setOptimizedRoute(route);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Delivery Route Optimization</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Icons.ArrowLeft />
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <DeliveryMap
            deliveries={deliveries}
            startLocation={startLocation}
            onRouteOptimized={handleRouteOptimized}
          />
        </div>

        {/* Delivery List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Delivery Points</h2>
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedDelivery?.id === delivery.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
                onClick={() => setSelectedDelivery(delivery)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{delivery.address}</h3>
                    <p className="text-sm text-gray-500">
                      {delivery.latitude.toFixed(4)},{" "}
                      {delivery.longitude.toFixed(4)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      delivery.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {delivery.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Route Details */}
      {optimizedRoute && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Optimized Route Details
          </h2>
          <div className="space-y-4">
            {optimizedRoute.detailed_route.map(
              (segment: any, index: number) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Segment {index + 1}</h3>
                    <span className="text-sm text-gray-500">
                      {(segment.distance / 1000).toFixed(2)} km
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    From: {segment.start_address}
                    <br />
                    To: {segment.end_address}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryMapPage;
