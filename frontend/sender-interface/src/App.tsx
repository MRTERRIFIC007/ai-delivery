import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import CreateOrderPage from "./pages/CreateOrderPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import TrackingPage from "./pages/TrackingPage";
import NotFoundPage from "./pages/NotFoundPage";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [apiStatus, setApiStatus] = useState<"loading" | "connected" | "error">(
    "loading"
  );

  useEffect(() => {
    // Apply the theme from localStorage
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    // Test API connectivity
    const testApiConnection = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_APP_API_URL || "http://localhost:5003"
          }/api/health`
        );
        if (response.ok) {
          setApiStatus("connected");
        } else {
          setApiStatus("error");
        }
      } catch (error) {
        setApiStatus("error");
        console.error("API Connection Error:", error);
      }
    };

    testApiConnection();

    // Set up a periodic check every 30 seconds
    const intervalId = setInterval(testApiConnection, 30000);

    // Clean up on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <ErrorBoundary>
      <Router>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-gray-50">
          {apiStatus === "error" && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded fixed top-0 left-0 right-0 m-4 z-50">
              <p className="font-bold">API Connection Error</p>
              <p className="text-sm">
                Could not connect to the backend API. Some features may not work
                correctly.
              </p>
            </div>
          )}

          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/track" element={<TrackingPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/create"
              element={
                <ProtectedRoute>
                  <CreateOrderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <button
            onClick={toggleTheme}
            className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg hover:bg-blue-700 transition-colors"
            aria-label={`Switch to ${
              theme === "light" ? "dark" : "light"
            } mode`}
          >
            Switch to {theme === "light" ? "Dark" : "Light"} Mode
          </button>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
