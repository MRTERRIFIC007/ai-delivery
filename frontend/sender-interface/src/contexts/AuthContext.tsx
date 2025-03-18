import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api } from "../services/api";

// Define the User type
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Define the context's value type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: () => {},
  isAuthenticated: false,
});

interface AuthProviderProps {
  children: ReactNode;
}

// Create a provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (token) {
          const response = await api.get("/auth/me");
          setUser(response.data);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("auth_token");
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;

      // Store token and set user
      localStorage.setItem("auth_token", token);
      setUser(user);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  // For demo purposes, set a mock user if none exists
  useEffect(() => {
    if (!loading && !user) {
      // Demo user for testing
      const demoUser = {
        id: "CUST123",
        name: "Demo User",
        email: "demo@example.com",
        role: "customer",
      };

      // For demo only - auto login
      setUser(demoUser);
    }
  }, [loading, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
