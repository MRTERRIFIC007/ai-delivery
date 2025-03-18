import axios from "axios";

// Create axios instance with default config
export const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API_URL || "http://localhost:5003",
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
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Define prediction API methods
export const predictionAPI = {
  predictTimeSlot: async (data: {
    customerId: string;
    latitude: number;
    longitude: number;
    addressType: string;
  }) => {
    return api.post("/predict", data);
  },

  optimizeRoute: async (orders: any[]) => {
    return api.post("/optimize-route", { orders });
  },
};

export default api;
