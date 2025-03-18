import React, { useEffect, useRef } from "react";
import { Order } from "../types";

interface MapViewProps {
  orders: Order[];
  predictions: Record<string, any>;
}

const MapView: React.FC<MapViewProps> = ({ orders, predictions }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    // Load Google Maps script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (mapRef.current) {
        // Initialize map centered on India
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: { lat: 20.5937, lng: 78.9629 },
          zoom: 5,
        });

        // Clear existing markers
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        // Add markers for each order
        orders.forEach((order) => {
          const [lat, lng] = order.deliveryAddress
            .split(",")
            .map((coord) => parseFloat(coord.trim()));

          if (!isNaN(lat) && !isNaN(lng)) {
            const prediction = predictions[order._id];
            const marker = new google.maps.Marker({
              position: { lat, lng },
              map: mapInstance.current,
              title: `Order #${order.trackingId}`,
              label: {
                text: prediction?.predictedTimeSlot || "?",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "bold",
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor:
                  prediction?.confidence > 0.8
                    ? "#4CAF50"
                    : prediction?.confidence > 0.6
                    ? "#FFC107"
                    : "#F44336",
                fillOpacity: 0.8,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              },
            });

            // Add info window with order details
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div class="p-2">
                  <h3 class="font-bold">Order #${order.trackingId}</h3>
                  <p>Status: ${order.status}</p>
                  ${
                    prediction
                      ? `
                    <p>Predicted Time: ${prediction.predictedTimeSlot}</p>
                    <p>Confidence: ${(prediction.confidence * 100).toFixed(
                      1
                    )}%</p>
                  `
                      : ""
                  }
                </div>
              `,
            });

            marker.addListener("click", () => {
              infoWindow.open(mapInstance.current, marker);
            });

            markersRef.current.push(marker);
          }
        });
      }
    };

    return () => {
      document.head.removeChild(script);
      markersRef.current.forEach((marker) => marker.setMap(null));
    };
  }, [orders, predictions]);

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export { MapView };
