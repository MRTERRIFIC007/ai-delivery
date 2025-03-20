import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Use the environment variables for AI service URLs
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5050";
const AI_TIMESLOT_SERVICE_URL =
  process.env.AI_TIMESLOT_SERVICE_URL || "http://localhost:5050/timeslot";
const AI_ROUTE_SERVICE_URL =
  process.env.AI_ROUTE_SERVICE_URL || "http://localhost:5050/route";

interface TimeSlotPredictionRequest {
  customer_id: string;
  day_of_week?: number;
  address_type?: number;
  location_type?: string; // For backward compatibility
  area_code?: string;
  distance?: number;
  order_value?: number;
  latitude?: number;
  longitude?: number;
  item_type?: string;
  postman_id?: string;
  lead_time?: number;
}

interface RouteOptimizationRequest {
  deliveries: {
    customer_id: string;
    latitude: number;
    longitude: number;
    address_type?: number;
    time_slot?: number;
  }[];
  num_postmen?: number;
  depot_latitude?: number;
  depot_longitude?: number;
  by_time_slot?: boolean;
}

interface TimeSlotPredictionResponse {
  customer_id: string;
  recipient_id?: string; // For backward compatibility
  predicted_time_slot: number;
  predictions?: Array<{
    time_slot: string;
    confidence: number;
    rank: number;
    source: string;
    explanation: string;
  }>;
  confidence: number;
  explanation: string;
  method?: string;
  message?: string;
}

interface RouteOptimizationResponse {
  success: boolean;
  total_postmen: number;
  total_deliveries: number;
  total_distance_km: number;
  total_time_hours: number;
  routes: Array<{
    postman_id: string;
    delivery_count: number;
    route: Array<{
      type: string;
      latitude: number;
      longitude: number;
      name?: string;
      customer_id?: string;
      address_type?: number;
      time_slot?: number;
    }>;
    statistics: {
      total_distance_km: number;
      travel_time_hours: number;
      service_time_hours: number;
      total_time_hours: number;
      estimated_completion_minutes: number;
    };
  }>;
}

/**
 * Predicts the optimal time slots for a delivery
 * @param data Prediction request data
 * @returns Time slot prediction response
 */
export const predictTimeSlot = async (
  data: TimeSlotPredictionRequest
): Promise<TimeSlotPredictionResponse> => {
  try {
    console.log(
      `Calling AI service at ${AI_TIMESLOT_SERVICE_URL}/predict-timeslot`
    );

    // Convert location_type to address_type if needed
    let addressType = 0;
    if (data.location_type) {
      if (
        data.location_type === "commercial" ||
        data.location_type === "office"
      ) {
        addressType = 1;
      } else if (data.location_type === "industrial") {
        addressType = 2;
      } else if (data.location_type === "educational") {
        addressType = 3;
      } else if (data.location_type === "government") {
        addressType = 4;
      }
    }

    // Prepare request data in the format expected by the new AI service
    const requestData = {
      customer_id: data.customer_id,
      day_of_week: data.day_of_week || new Date().getDay(),
      address_type:
        data.address_type !== undefined ? data.address_type : addressType,
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      item_type: data.item_type || "REGULAR",
      lead_time: data.lead_time || 7,
    };

    const response = await axios.post(
      `${AI_TIMESLOT_SERVICE_URL}/predict-timeslot`,
      requestData,
      {
        timeout: 5000, // Add timeout to prevent long-running requests
        headers: { "Content-Type": "application/json" },
      }
    );

    console.log("AI service response:", JSON.stringify(response.data));

    // Convert the new response format to the expected format
    const result: TimeSlotPredictionResponse = {
      customer_id: response.data.customer_id,
      recipient_id: response.data.customer_id, // For backward compatibility
      predicted_time_slot: response.data.predicted_time_slot,
      confidence: response.data.confidence * 100, // Convert from 0-1 to 0-100
      explanation: response.data.explanation,
      method: response.data.method || "machine_learning",
      message: "Time slot prediction generated successfully",
    };

    // Add predictions array for compatibility with existing code
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

    result.predictions = timeSlots
      .map((slot, index) => {
        // Make the predicted slot have the highest confidence
        const isPreferredSlot = index + 1 === response.data.predicted_time_slot;
        const confidence = isPreferredSlot
          ? response.data.confidence * 100
          : Math.max(30, 60 - index * 5);

        return {
          time_slot: slot,
          confidence: isPreferredSlot
            ? response.data.confidence * 100
            : confidence,
          rank: isPreferredSlot ? 1 : index + 2,
          source: isPreferredSlot
            ? response.data.method || "machine_learning"
            : "alternative",
          explanation: isPreferredSlot
            ? response.data.explanation
            : "Alternative time slot",
        };
      })
      .sort((a, b) => b.confidence - a.confidence);

    return result;
  } catch (error: any) {
    console.error(
      "Error calling AI time slot prediction service:",
      error.message
    );

    // Return fallback prediction instead of throwing error
    return generateFallbackPrediction(data);
  }
};

/**
 * Generates a fallback prediction when the AI service is unavailable
 * @param data The prediction request data
 * @returns A fallback prediction response
 */
const generateFallbackPrediction = (
  data: TimeSlotPredictionRequest
): TimeSlotPredictionResponse => {
  console.log("Generating fallback prediction for:", data);

  // Basic heuristics for time slot selection
  let bestTimeSlot = 4; // Default afternoon slot (13-14)
  let bestTimeSlotStr = "13-14";

  // Determine address type
  let addressType = 0;
  if (data.address_type !== undefined) {
    addressType = data.address_type;
  } else if (data.location_type) {
    if (
      data.location_type === "commercial" ||
      data.location_type === "office"
    ) {
      addressType = 1;
    }
  }

  // If address type is commercial, prefer business hours
  if (addressType === 1) {
    bestTimeSlot = 3; // Mid-day for commercial addresses (12-13)
    bestTimeSlotStr = "12-13";
  }
  // If address type is residential, prefer evening
  else {
    bestTimeSlot = 6; // Evening for residential addresses (15-16)
    bestTimeSlotStr = "15-16";
  }

  // Generate predictions with fallback algorithm
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

  const predictions = timeSlots
    .map((slot, index) => {
      // Give higher confidence to the best time slot
      const confidence =
        slot === bestTimeSlotStr ? 75.0 : Math.max(30, 60 - index * 5);

      return {
        time_slot: slot,
        confidence,
        rank: slot === bestTimeSlotStr ? 1 : index + 2,
        source: "fallback_algorithm",
        explanation: `This time slot was suggested based on address type (${
          addressType === 1 ? "commercial" : "residential"
        }). Service is currently operating in fallback mode.`,
      };
    })
    .sort((a, b) => b.confidence - a.confidence);

  return {
    customer_id: data.customer_id,
    recipient_id: data.customer_id, // For backward compatibility
    predicted_time_slot: bestTimeSlot,
    confidence: 75.0,
    explanation: `This time slot was suggested based on address type (${
      addressType === 1 ? "commercial" : "residential"
    }). Service is currently operating in fallback mode.`,
    predictions,
    method: "fallback_algorithm",
    message:
      "Time slot predictions generated using fallback algorithm (AI service unavailable)",
  };
};

/**
 * Optimizes a delivery route
 * @param data Route optimization request data
 * @returns Optimized route
 */
export const optimizeRoute = async (
  data: RouteOptimizationRequest
): Promise<RouteOptimizationResponse> => {
  try {
    const response = await axios.post(
      `${AI_ROUTE_SERVICE_URL}/optimize-routes`,
      data,
      {
        timeout: 10000, // Longer timeout for route optimization
        headers: { "Content-Type": "application/json" },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(
      "Error calling AI route optimization service:",
      error.message
    );
    throw new Error("Failed to get route optimization from AI service");
  }
};

/**
 * Create a new order with time slot prediction
 * @param data Order creation data
 * @returns Created order with predicted time slot
 */
export const createOrderWithPrediction = async (data: {
  customer_id: string;
  latitude: number;
  longitude: number;
  address_type: number;
  item_type?: string;
  day_of_week?: number;
  delivery_date?: string;
}) => {
  try {
    console.log(`Calling AI service at ${AI_SERVICE_URL}/create-order`);

    const response = await axios.post(`${AI_SERVICE_URL}/create-order`, data, {
      timeout: 5000,
      headers: { "Content-Type": "application/json" },
    });

    console.log("AI service created order:", JSON.stringify(response.data));
    return response.data;
  } catch (error: any) {
    console.error("Error calling AI service to create order:", error.message);
    throw new Error("Failed to create order with AI service");
  }
};

/**
 * Checks if the AI service is healthy
 * @returns True if the service is healthy, false otherwise
 */
export const checkAIServiceHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/health`);
    return response.data.status === "healthy";
  } catch (error) {
    console.error("AI service health check failed");
    return false;
  }
};

/**
 * Checks if the AI time slot service is healthy
 * @returns True if the service is healthy, false otherwise
 */
export const checkTimeSlotServiceHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${AI_TIMESLOT_SERVICE_URL}/health`);
    return response.data.status === "healthy";
  } catch (error) {
    console.error("AI time slot service health check failed");
    return false;
  }
};

/**
 * Checks if the AI route optimization service is healthy
 * @returns True if the service is healthy, false otherwise
 */
export const checkRouteServiceHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${AI_ROUTE_SERVICE_URL}/health`);
    return response.data.status === "healthy";
  } catch (error) {
    console.error("AI route service health check failed");
    return false;
  }
};

/**
 * Checks if all AI services are healthy
 * @returns True if all services are healthy, false otherwise
 */
export const checkAllAIServicesHealth = async (): Promise<boolean> => {
  try {
    const [serviceHealthy, timeSlotHealthy, routeHealthy] = await Promise.all([
      checkAIServiceHealth(),
      checkTimeSlotServiceHealth(),
      checkRouteServiceHealth(),
    ]);
    return serviceHealthy && timeSlotHealthy && routeHealthy;
  } catch (error) {
    console.error("AI services health check failed");
    return false;
  }
};
