import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const AI_TIMESLOT_SERVICE_URL =
  process.env.AI_TIMESLOT_SERVICE_URL || "http://localhost:5015";
const AI_ROUTE_SERVICE_URL =
  process.env.AI_ROUTE_SERVICE_URL || "http://localhost:5017";

interface TimeSlotPredictionRequest {
  customer_id: string;
  day_of_week?: number;
  location_type?: string;
  area_code?: string;
  distance?: number;
  order_value?: number;
}

interface RouteOptimizationRequest {
  deliveries: {
    latitude: number;
    longitude: number;
  }[];
  start_location: string;
}

interface TimeSlotPredictionResponse {
  recipient_id: string;
  predictions: Array<{
    time_slot: string;
    confidence: number;
    rank: number;
    source: string;
    explanation: string;
  }>;
  message: string;
}

interface RouteOptimizationResponse {
  route: number[];
  total_distance: number;
  total_duration: number;
  detailed_route: Array<{
    start_address: string;
    end_address: string;
    distance: number;
    duration: number;
    polyline: string | null;
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
    const response = await axios.post(
      `${AI_TIMESLOT_SERVICE_URL}/predict-timeslot`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Error calling AI time slot prediction service:",
      error.message
    );
    throw new Error("Failed to get time slot prediction from AI service");
  }
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
      `${AI_ROUTE_SERVICE_URL}/optimize-route`,
      data
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
    const [timeSlotHealthy, routeHealthy] = await Promise.all([
      checkTimeSlotServiceHealth(),
      checkRouteServiceHealth(),
    ]);
    return timeSlotHealthy && routeHealthy;
  } catch (error) {
    console.error("AI services health check failed");
    return false;
  }
};
