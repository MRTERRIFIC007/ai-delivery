export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  IN_TRANSIT = "in_transit",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  ASSIGNED = "assigned",
}

export enum AddressType {
  RESIDENTIAL = 1,
  COMMERCIAL = 2,
  INDUSTRIAL = 3,
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
