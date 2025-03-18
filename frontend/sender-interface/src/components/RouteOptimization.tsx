import React, { useEffect, useState, useRef } from "react";
import { Order } from "../types/order";
import { Loader2 } from "lucide-react";
import { predictionAPI } from "../services/api";

interface RouteOptimizationProps {
  orders: Order[];
}

interface OptimizedRoute {
  route: string[];
  totalDistance: number;
  totalDuration: number;
  segments: {
    from: string;
    to: string;
    distance: number;
    duration: number;
  }[];
}

export const RouteOptimization: React.FC<RouteOptimizationProps> = ({
  orders,
}) => {
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(
    null
  );

  useEffect(() => {
    const optimizeRoute = async () => {
      if (orders.length < 2) {
        setError("At least 2 orders are needed for route optimization");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Extract the start location (first order's delivery address)
        const [startLat, startLng] = orders[0].deliveryAddress
          .split(",")
          .map((coord) => parseFloat(coord.trim()));
        const startLocation = { latitude: startLat, longitude: startLng };

        // Prepare delivery locations for the API
        const deliveryLocations = orders.map((order) => {
          const [lat, lng] = order.deliveryAddress
            .split(",")
            .map((coord) => parseFloat(coord.trim()));
          return {
            orderId: order._id,
            latitude: lat,
            longitude: lng,
            address: order.deliveryAddress,
          };
        });

        // Call the route optimization API
        const response = await predictionAPI.optimizeRoute(deliveryLocations);
        setOptimizedRoute(response.data);

        // Initialize Google Maps if not already initialized
        if (!googleMapRef.current && mapRef.current) {
          // Load Google Maps
          if (!window.google || !window.google.maps) {
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
            script.onload = () => initMap(response.data);
          } else {
            initMap(response.data);
          }
        } else if (googleMapRef.current) {
          displayRoute(response.data);
        }
      } catch (error) {
        console.error("Error optimizing route:", error);
        setError("Failed to optimize route. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const initMap = (routeData: OptimizedRoute) => {
      if (!mapRef.current) return;

      // Default center (India)
      const center = { lat: 20.5937, lng: 78.9629 };

      // Create map
      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center,
        zoom: 5,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      // Create directions renderer
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: googleMapRef.current,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: "#4F46E5",
          strokeWeight: 5,
          strokeOpacity: 0.7,
        },
      });

      // Display the optimized route
      displayRoute(routeData);
    };

    const displayRoute = (routeData: OptimizedRoute) => {
      if (!googleMapRef.current || !directionsRendererRef.current) return;

      const directionsService = new google.maps.DirectionsService();

      // Create waypoints from the route
      const waypoints = routeData.route.slice(1, -1).map((address) => ({
        location: address,
        stopover: true,
      }));

      // Get first and last locations for origin and destination
      const origin = routeData.route[0];
      const destination = routeData.route[routeData.route.length - 1];

      // Request directions
      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          optimizeWaypoints: false, // We already optimized the route
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            directionsRendererRef.current?.setDirections(result);
          } else {
            console.error("Error displaying route:", status);
            setError(`Failed to display route: ${status}`);
          }
        }
      );
    };

    if (orders.length > 0) {
      optimizeRoute();
    }

    return () => {
      // Clean up
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [orders]);

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Optimized Delivery Route
      </h3>

      {loading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Optimizing route...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div
            ref={mapRef}
            className="h-96 w-full rounded-md border border-gray-200 mb-4"
          />

          {optimizedRoute && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-500">Total Distance:</span>
                  <span className="ml-2 font-medium">
                    {(optimizedRoute.totalDistance / 1000).toFixed(2)} km
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">
                    Estimated Duration:
                  </span>
                  <span className="ml-2 font-medium">
                    {Math.floor(optimizedRoute.totalDuration / 60)} mins
                  </span>
                </div>
              </div>

              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Route Details
              </h4>
              <div className="space-y-2">
                {optimizedRoute.segments.map((segment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <span>{index + 1}. </span>
                      <span className="font-medium">{segment.from}</span>
                      <span> → </span>
                      <span className="font-medium">{segment.to}</span>
                    </div>
                    <div className="text-gray-500">
                      {(segment.distance / 1000).toFixed(2)} km (
                      {Math.floor(segment.duration / 60)} mins)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
