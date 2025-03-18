import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, hasRole } from "../utils/auth";
import LoadingSkeleton from "./LoadingSkeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  allowedRoles = [],
  redirectTo = "/",
}) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if the user is authenticated
    const checkAuth = async () => {
      try {
        // If authentication is not required, allow access
        if (!requireAuth) {
          setIsAuthorized(true);
          return;
        }

        // Check if the user is authenticated
        const authenticated = isAuthenticated();

        if (!authenticated) {
          setIsAuthorized(false);
          return;
        }

        // If roles are specified, check if the user has the required role
        if (allowedRoles.length > 0) {
          const authorized = allowedRoles.some((role) => hasRole(role));
          setIsAuthorized(authorized);
          return;
        }

        // If we got here, the user is authenticated and no specific roles are required
        setIsAuthorized(true);
      } catch (error) {
        console.error("Authentication check failed:", error);
        setIsAuthorized(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [requireAuth, allowedRoles, location.pathname]);

  // Show loading state while checking authorization
  if (isChecking) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-full max-w-md p-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Verifying access...
          </h2>
          <LoadingSkeleton rows={5} />
        </div>
      </div>
    );
  }

  // If not authorized, redirect to the specified route
  if (!isAuthorized) {
    // Save the current location to redirect back after login
    const currentPath = location.pathname + location.search + location.hash;
    return <Navigate to={redirectTo} state={{ from: currentPath }} replace />;
  }

  // If authorized, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
