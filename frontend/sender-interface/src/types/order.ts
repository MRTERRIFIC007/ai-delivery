export enum OrderStatus {
  PENDING = "pending",
  SCHEDULED = "scheduled",
  IN_TRANSIT = "in_transit",
  DELIVERED = "delivered",
  FAILED = "failed",
}

export enum AddressType {
  RESIDENTIAL = "residential",
  COMMERCIAL = "commercial",
  INDUSTRIAL = "industrial",
}

export interface ILocation {
  latitude: number;
  longitude: number;
}

export interface IRecipient {
  name: string;
  phone: string;
  email?: string;
}

export interface IDeliveryAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  location: ILocation;
  addressType: AddressType;
}

export interface IPackageDetails {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  description: string;
}

export interface ITimeSlot {
  _id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  available: number;
  area: string;
  isActive: boolean;
  priority: "high" | "medium" | "low";
}

export interface IOrder {
  _id: string;
  sender:
    | string
    | {
        _id: string;
        name: string;
        email: string;
      };
  recipient: IRecipient;
  deliveryAddress: IDeliveryAddress;
  packageDetails: IPackageDetails;
  timeSlot: number;
  timeSlotId?: string | ITimeSlot;
  assignedTo?:
    | string
    | {
        _id: string;
        name: string;
      };
  status: OrderStatus;
  trackingNumber: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  scheduledDeliveryTime?: string;
  notes?: string;
}

export interface IOrderResponse {
  success: boolean;
  order: IOrder;
}

export interface IOrdersResponse {
  success: boolean;
  count: number;
  total: number;
  totalPages: number;
  currentPage: number;
  orders: IOrder[];
}

export interface Order {
  _id: string;
  trackingNumber: string;
  customerId: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  deliveryAddress: string; // Format: "latitude,longitude"
  addressType: AddressType;
  packageType: string;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  description?: string;
  status: OrderStatus;
  scheduledTime?: string;
  predictedTimeSlot?: string;
  predictedConfidence?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TimeSlot {
  id: string;
  start: string;
  end: string;
  capacity: number;
  available: boolean;
}

export interface Prediction {
  orderId: string;
  predictedTimeSlot: string;
  confidence: number;
  factors: {
    addressType: string;
    distance: number;
    dayOfWeek: string;
    timeOfDay: string;
  };
}
