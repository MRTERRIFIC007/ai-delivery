import axios from "axios";

const API_URL = import.meta.env.VITE_APP_API_URL || "http://localhost:5001/api";
const MAX_RETRIES = 2;

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Increase timeout to 10 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Helper function to retry requests
const retryRequest = async (
  fn: () => Promise<any>,
  retries = MAX_RETRIES
): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`Request failed, retrying... (${retries} attempts left)`);
      // Wait 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
};

// Define prediction API methods
export const predictionAPI = {
  predictTimeSlot: async (data: {
    customerId: string;
    latitude: number;
    longitude: number;
    addressType: string;
  }) => {
    return retryRequest(() => api.post("/predictions/predict", data));
  },

  optimizeRoute: async (orders: any[]) => {
    return retryRequest(() =>
      api.post("/predictions/optimize-route", { orders })
    );
  },
};

export default api;
