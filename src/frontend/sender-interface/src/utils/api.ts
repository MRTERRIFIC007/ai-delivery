import { IOrder, IOrderResponse, IOrdersResponse } from "../types/order";

// Base API URL from environment variables
const API_URL = import.meta.env.VITE_APP_API_URL || "http://localhost:5003";

/**
 * Generic API request handler
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized errors
    if (response.status === 401) {
      // Clear auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login page
      window.location.href = "/";
      throw new Error("Your session has expired. Please login again.");
    }

    // Handle other non-2xx responses
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "An error occurred");
    }

    return await response.json();
  } catch (error: any) {
    console.error("API Request Error:", error);
    throw error;
  }
}

/**
 * Authentication API
 */
export const authAPI = {
  login: async (email: string, password: string) => {
    return apiRequest<{ token: string; user: any }>("/api/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (userData: any) => {
    return apiRequest<{ token: string; user: any }>("/api/users/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },
};

/**
 * Orders API
 */
export const ordersAPI = {
  getOrders: async (token?: string, page = 1, limit = 10) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return apiRequest<IOrdersResponse>(
      `/api/orders?page=${page}&limit=${limit}`,
      {
        headers,
      }
    );
  },

  getOrderById: async (id: string, token: string) => {
    return apiRequest<IOrderResponse>(`/api/orders/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getOrderByTracking: async (trackingNumber: string) => {
    return apiRequest<IOrderResponse>(`/api/orders/tracking/${trackingNumber}`);
  },

  createOrder: async (orderData: Partial<IOrder>, token: string) => {
    return apiRequest<IOrderResponse>(`/api/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });
  },

  updateOrderStatus: async (id: string, status: string, token: string) => {
    return apiRequest<IOrderResponse>(`/api/orders/${id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
  },
};

/**
 * Time Slots API
 */
export const timeSlotsAPI = {
  getTimeSlots: async (token: string, area?: string, date?: string) => {
    let queryString = "";

    if (area) {
      queryString += `area=${encodeURIComponent(area)}&`;
    }

    if (date) {
      queryString += `date=${encodeURIComponent(date)}&`;
    }

    return apiRequest<{ success: boolean; timeSlots: any[] }>(
      `/api/timeslots?${queryString}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  getAvailableTimeSlots: async (token: string, area: string, date: string) => {
    return apiRequest<{ success: boolean; timeSlots: any[] }>(
      `/api/timeslots/available?area=${encodeURIComponent(
        area
      )}&date=${encodeURIComponent(date)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
};

/**
 * Delivery API
 */
export const deliveryAPI = {
  trackDelivery: async (trackingNumber: string) => {
    return apiRequest<{ success: boolean; tracking: any }>(
      `/api/deliveries/track/${trackingNumber}`
    );
  },

  getDeliveryStats: async (token: string) => {
    return apiRequest<{ success: boolean; stats: any }>(
      `/api/deliveries/stats`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  updateDeliveryStatus: async (id: string, status: string, token: string) => {
    return apiRequest<{ success: boolean; order: IOrder }>(
      `/api/deliveries/${id}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    );
  },

  addDeliveryNotes: async (id: string, notes: string, token: string) => {
    return apiRequest<{ success: boolean; order: IOrder }>(
      `/api/deliveries/${id}/notes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes }),
      }
    );
  },
};

export default {
  auth: authAPI,
  orders: ordersAPI,
  timeSlots: timeSlotsAPI,
  delivery: deliveryAPI,
};
