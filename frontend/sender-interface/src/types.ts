export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "sender" | "postman";
}

export interface Order {
  _id: string;
  trackingId: string;
  deliveryAddress: string;
  packageType: string;
  status: string;
  priority: "high" | "medium" | "low";
  receiverDetails: {
    name: string;
    address: string;
    phone: string;
    email?: string;
  };
  deliveryDate: string;
  selectedTimeSlot?: string;
}

export interface TimeSlot {
  _id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  available: number;
  area: string;
  isActive: boolean;
  priority: "high" | "medium" | "low";
  aiConfidence?: number;
}

export interface AIPrediction {
  predictedTimeSlot: string;
  confidence: number;
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
}

export interface OptimizedRoute {
  route: number[];
  total_distance: number;
  total_duration: number;
  detailed_route: Array<{
    start_address: string;
    end_address: string;
    distance: number;
    duration: number;
    polyline: string | null;
  }>;
}
