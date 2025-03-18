import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icons } from "../components/Icons";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="flex justify-center">
            <div className="bg-indigo-100 p-6 rounded-full">
              <div className="text-7xl font-bold text-indigo-600">404</div>
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Page Not Found
        </h1>

        <p className="text-gray-600 mb-8">
          We couldn't find the page you're looking for. The page may have been
          moved, deleted, or never existed in the first place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <Icons.ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </button>

          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <Icons.Home className="mr-2 h-4 w-4" />
            Home Page
          </Link>

          <Link
            to="/track"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            <Icons.Search className="mr-2 h-4 w-4" />
            Track a Package
          </Link>
        </div>
      </div>

      <div className="mt-12 text-center text-gray-500">
        <p>
          If you believe this is an error, please contact our
          <a
            href="mailto:support@indiapost.gov.in"
            className="text-indigo-600 hover:text-indigo-800"
          >
            support team
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
