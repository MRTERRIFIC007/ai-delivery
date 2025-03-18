import { useState, useEffect } from "react";
import * as auth from "../utils/auth";

interface AuthState {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
}

const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  // Initialize auth state
  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = auth.isAuthenticated();
      const user = auth.getUser();

      setAuthState({
        isAuthenticated,
        user,
        isLoading: false,
      });
    };

    checkAuth();

    // Listen for storage events (logout in other tabs)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "token" || event.key === "user") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const user = await auth.login(email, password);
      setAuthState({
        isAuthenticated: true,
        user,
        isLoading: false,
      });
      return user;
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Register function
  const register = async (userData: any) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const user = await auth.register(userData);
      setAuthState({
        isAuthenticated: true,
        user,
        isLoading: false,
      });
      return user;
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    auth.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
    });
  };

  // Check if the user has a specific role
  const hasRole = (role: string) => {
    return auth.hasRole(role);
  };

  return {
    ...authState,
    login,
    register,
    logout,
    hasRole,
    getToken: auth.getToken,
    getAuthHeaders: auth.getAuthHeaders,
  };
};

export default useAuth;
