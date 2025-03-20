import React from "react";
import { Link } from "react-router-dom";
import { Package, Plus, Home } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg">OptiDeliver</span>
        </Link>

        <nav className="flex space-x-4">
          <Link
            to="/dashboard"
            className="flex items-center space-x-1 px-3 py-2 rounded hover:bg-gray-100"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/orders/create"
            className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>New Order</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
