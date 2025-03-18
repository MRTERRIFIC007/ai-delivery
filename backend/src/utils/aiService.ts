import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";

interface PredictionRequest {
  customer_id: string;
  latitude: number;
  longitude: number;
  address_type: number;
}

interface PredictionResponse {
  customer_id: string;
  predicted_time_slot: number;
  accuracy: number;
}

/**
 * Predicts the optimal time slot for a delivery
 * @param data Prediction request data
 * @returns Prediction response
 */
export const predictTimeSlot = async (
  data: PredictionRequest
): Promise<PredictionResponse> => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/predict`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error calling AI prediction service:", error.message);
    throw new Error("Failed to get prediction from AI service");
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
