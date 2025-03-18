import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthForm } from "../components/AuthForm";
import { Icons } from "../components/Icons";
import toast from "react-hot-toast";
import * as auth from "../utils/auth";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (data: { email: string; password: string }) => {
    // Reset previous errors
    setError(null);
    setIsLoading(true);

    try {
      // For development/testing, we can bypass the actual API call
      if (
        import.meta.env.DEV &&
        import.meta.env.VITE_USE_MOCK_AUTH === "true"
      ) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Store mock user data
        auth.setAuthData("mock-jwt-token", {
          id: "1",
          name: "Test User",
          email: data.email,
          role: "user",
        });

        toast.success("Login successful!");
        navigate("/dashboard");
        return;
      }

      // Real authentication
      await auth.login(data.email, data.password);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
      toast.error(err.message || "Login failed");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Icons.Package className="text-blue-600" size={48} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          OptiDeliver
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to manage your deliveries
        </p>
        <div className="mt-2 text-center text-sm">
          <div className="bg-yellow-100 p-2 rounded">
            <strong>Test Mode:</strong> <br />
            Any email/password combination will work
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 p-3 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <AuthForm
            isLogin={true}
            onSubmit={handleLogin}
            isLoading={isLoading}
          />

          <div className="mt-6 text-center">
            <Link to="/register" className="text-blue-600 hover:text-blue-500">
              Don't have an account? Sign up
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/track"
              className="text-gray-600 hover:text-gray-800 flex justify-center items-center"
            >
              <Icons.Search className="mr-2" size={16} />
              Track a package without logging in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
