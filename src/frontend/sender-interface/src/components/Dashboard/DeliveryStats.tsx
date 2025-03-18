import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { deliveryAPI } from "../../utils/api";
import LoadingSkeleton from "../LoadingSkeleton";

interface StatsData {
  totalDeliveries: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  cancelledDeliveries: number;
  onTimeDeliveryRate: number;
  averageDeliveryTime: number;
  dailyStats: {
    date: string;
    count: number;
  }[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  loading = false,
}) => {
  const getTrendIcon = () => {
    if (trend === "up") {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (trend === "down") {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const getTrendClass = () => {
    if (trend === "up") return "text-green-600";
    if (trend === "down") return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          {loading ? (
            <LoadingSkeleton height="h-8" />
          ) : (
            <div className="mt-1">
              <span className="text-2xl font-semibold text-gray-800">
                {value}
              </span>
              {trend && trendValue && (
                <span className={`ml-2 text-xs font-medium ${getTrendClass()}`}>
                  {getTrendIcon()}
                  {trendValue}
                </span>
              )}
            </div>
          )}
          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          )}
        </div>
        <div className="p-2 bg-indigo-50 rounded-lg">{icon}</div>
      </div>
    </div>
  );
};

const DeliveryStats: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await deliveryAPI.getDeliveryStats(token);
        if (response.success && response.stats) {
          setStats(response.stats);
        } else {
          throw new Error("Failed to retrieve delivery statistics");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching statistics");
        console.error("Error fetching delivery stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} mins`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? "hour" : "hours"}`;
    }

    return `${hours}h ${remainingMinutes}m`;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <h3 className="font-medium">Error loading statistics</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">
        Delivery Statistics
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Deliveries"
          value={stats?.totalDeliveries || 0}
          icon={<Package className="h-6 w-6 text-indigo-600" />}
          loading={loading}
        />

        <StatCard
          title="Completed"
          value={stats?.completedDeliveries || 0}
          description={`${
            stats
              ? Math.round(
                  (stats.completedDeliveries / stats.totalDeliveries) * 100
                )
              : 0
          }% of total deliveries`}
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          loading={loading}
        />

        <StatCard
          title="Pending"
          value={stats?.pendingDeliveries || 0}
          icon={<Clock className="h-6 w-6 text-amber-600" />}
          loading={loading}
        />

        <StatCard
          title="Cancelled"
          value={stats?.cancelledDeliveries || 0}
          icon={<AlertTriangle className="h-6 w-6 text-red-600" />}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatCard
          title="On-Time Delivery Rate"
          value={`${stats?.onTimeDeliveryRate || 0}%`}
          trend={stats?.onTimeDeliveryRate >= 90 ? "up" : "down"}
          trendValue={
            stats?.onTimeDeliveryRate >= 90 ? "Good" : "Needs improvement"
          }
          icon={<Activity className="h-6 w-6 text-indigo-600" />}
          loading={loading}
        />

        <StatCard
          title="Average Delivery Time"
          value={stats ? formatDuration(stats.averageDeliveryTime) : "-"}
          icon={<Clock className="h-6 w-6 text-indigo-600" />}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default DeliveryStats;
