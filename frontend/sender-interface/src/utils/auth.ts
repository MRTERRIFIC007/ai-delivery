import { authAPI } from "./api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const TOKEN_KEY = "token";
const USER_KEY = "user";

/**
 * Set authentication data in local storage
 */
export const setAuthData = (token: string, user: User): void => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Get the current authentication token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get the current authenticated user
 */
export const getUser = (): User | null => {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getToken() && !!getUser();
};

/**
 * Check if user has a specific role
 */
export const hasRole = (role: string): boolean => {
  const user = getUser();
  return !!user && user.role === role;
};

/**
 * Log in a user
 */
export const login = async (email: string, password: string): Promise<User> => {
  try {
    const response = await authAPI.login(email, password);

    if (response.token && response.user) {
      setAuthData(response.token, response.user);
      return response.user;
    }

    throw new Error("Invalid response data");
  } catch (error: any) {
    throw new Error(error.message || "Login failed");
  }
};

/**
 * Log out the current user
 */
export const logout = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  // Redirect to login page
  window.location.href = "/";
};

/**
 * Register a new user
 */
export const register = async (userData: any): Promise<User> => {
  try {
    const response = await authAPI.register(userData);

    if (response.token && response.user) {
      setAuthData(response.token, response.user);
      return response.user;
    }

    throw new Error("Invalid response data");
  } catch (error: any) {
    throw new Error(error.message || "Registration failed");
  }
};

/**
 * Get auth headers for API requests
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export default {
  setAuthData,
  getToken,
  getUser,
  isAuthenticated,
  hasRole,
  login,
  logout,
  register,
  getAuthHeaders,
};
