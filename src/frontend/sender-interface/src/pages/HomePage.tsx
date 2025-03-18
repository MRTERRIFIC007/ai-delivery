import React from "react";
import { Navigate } from "react-router-dom";

const HomePage: React.FC = () => {
  // Redirect to login page if not authenticated
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default HomePage;
