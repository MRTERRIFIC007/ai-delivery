import React, { useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polyline,
} from "@react-google-maps/api";
import { Icons } from "../../components/Icons";

interface Delivery {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  status: string;
}

interface DeliveryMapProps {
  deliveries: Delivery[];
  startLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  onRouteOptimized?: (route: any) => void;
}

const containerStyle = {
  width: "100%",
  height: "500px",
};

const defaultCenter = {
  lat: 20.5937, // India's center
  lng: 78.9629,
};

const DeliveryMap: React.FC<DeliveryMapProps> = ({
  deliveries,
  startLocation,
  onRouteOptimized,
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeRoute = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("http://localhost:5004/optimize-route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveries: deliveries.map((d) => ({
            latitude: d.latitude,
            longitude: d.longitude,
            address: d.address,
          })),
          start_location: `${startLocation.latitude},${startLocation.longitude}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to optimize route");
      }

      const data = await response.json();
      setOptimizedRoute(data);
      onRouteOptimized?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to optimize route");
    } finally {
      setLoading(false);
    }
  };

  const fitBounds = () => {
    if (!mapRef.current) return;

    const bounds = new google.maps.LatLngBounds();

    // Add start location
    bounds.extend(
      new google.maps.LatLng(startLocation.latitude, startLocation.longitude)
    );

    // Add all delivery points
    deliveries.forEach((delivery) => {
      bounds.extend(
        new google.maps.LatLng(delivery.latitude, delivery.longitude)
      );
    });

    mapRef.current.fitBounds(bounds);
  };

  useEffect(() => {
    if (mapRef.current) {
      fitBounds();
    }
  }, [deliveries, startLocation]);

  return (
    <div className="relative">
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={5}
          onLoad={(map) => {
            mapRef.current = map;
            fitBounds();
          }}
        >
          {/* Start Location Marker */}
          <Marker
            position={{
              lat: startLocation.latitude,
              lng: startLocation.longitude,
            }}
            icon={{
              url: "/warehouse-icon.svg",
              scaledSize: new google.maps.Size(30, 30),
            }}
            title="Start Location"
          />

          {/* Delivery Points */}
          {deliveries.map((delivery, index) => (
            <Marker
              key={delivery.id}
              position={{ lat: delivery.latitude, lng: delivery.longitude }}
              title={`Delivery ${index + 1}`}
              label={`${index + 1}`}
            />
          ))}

          {/* Optimized Route */}
          {optimizedRoute?.detailed_route.map((segment: any, index: number) => (
            <Polyline
              key={index}
              path={google.maps.geometry.encoding.decodePath(segment.polyline)}
              options={{
                strokeColor: "#2563eb",
                strokeOpacity: 0.8,
                strokeWeight: 3,
              }}
            />
          ))}
        </GoogleMap>
      </LoadScript>

      {/* Controls */}
      <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg">
        <button
          onClick={optimizeRoute}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Icons.Loader className="animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Icons.Route />
              Optimize Route
            </>
          )}
        </button>
      </div>

      {/* Route Information */}
      {optimizedRoute && (
        <div className="mt-4 bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Route Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Distance</p>
              <p className="font-medium">
                {(optimizedRoute.total_distance / 1000).toFixed(2)} km
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estimated Duration</p>
              <p className="font-medium">
                {Math.round(optimizedRoute.total_duration / 60)} minutes
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default DeliveryMap;
