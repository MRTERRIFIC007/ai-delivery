"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAIServiceHealth = exports.predictTimeSlot = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5001";
/**
 * Predicts the optimal time slot for a delivery
 * @param data Prediction request data
 * @returns Prediction response
 */
const predictTimeSlot = async (data) => {
    try {
        const response = await axios_1.default.post(`${AI_SERVICE_URL}/predict`, data);
        return response.data;
    }
    catch (error) {
        console.error("Error calling AI prediction service:", error.message);
        throw new Error("Failed to get prediction from AI service");
    }
};
exports.predictTimeSlot = predictTimeSlot;
/**
 * Checks if the AI service is healthy
 * @returns True if the service is healthy, false otherwise
 */
const checkAIServiceHealth = async () => {
    try {
        const response = await axios_1.default.get(`${AI_SERVICE_URL}/health`);
        return response.data.status === "healthy";
    }
    catch (error) {
        console.error("AI service health check failed");
        return false;
    }
};
exports.checkAIServiceHealth = checkAIServiceHealth;
