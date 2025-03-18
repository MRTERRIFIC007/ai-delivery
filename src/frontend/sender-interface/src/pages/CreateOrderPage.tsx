import React from "react";
import { Link } from "react-router-dom";
import CreateOrderForm from "../components/CreateOrderForm";

const CreateOrderPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Order</h1>
        <Link
          to="/dashboard"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded inline-flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
        <div className="flex items-center mb-4 text-yellow-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm">
            Please fill out all required fields marked with an asterisk (*). The
            system will help you select an optimal delivery time slot based on
            your location and package details.
          </p>
        </div>
      </div>

      <CreateOrderForm />
    </div>
  );
};

export default CreateOrderPage;
