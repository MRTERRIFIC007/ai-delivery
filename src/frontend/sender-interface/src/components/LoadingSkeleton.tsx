import React from "react";

interface LoadingSkeletonProps {
  rows?: number;
  height?: string;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 1,
  height = "h-6",
  className = "",
}) => {
  const skeletonRows = [];
  for (let i = 0; i < rows; i++) {
    skeletonRows.push(
      <div key={i} className={`animate-pulse bg-gray-200 rounded ${height}`} />
    );
  }

  return <div className={`w-full space-y-2 ${className}`}>{skeletonRows}</div>;
};

export const LoadingTrackingResult: React.FC = () => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-4">
        <div className="w-full">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="mt-2 sm:mt-0 h-6 bg-gray-200 rounded-full w-24"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
