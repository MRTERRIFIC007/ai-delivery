import React from "react";
import { Order } from "../types/order";
import { Clock, MapPin, Package, CheckCircle } from "lucide-react";

interface OrderListProps {
  orders: Order[];
  selectedOrders: Order[];
  onOrderSelect: (order: Order) => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  selectedOrders,
  onOrderSelect,
}) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new order.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {orders.map((order) => {
          const isSelected = selectedOrders.some((o) => o._id === order._id);
          return (
            <li
              key={order._id}
              className={`p-4 hover:bg-gray-50 cursor-pointer ${
                isSelected ? "bg-blue-50" : ""
              }`}
              onClick={() => onOrderSelect(order)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      Order #{order.trackingNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.packageType} - {order.weight}kg
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    {order.deliveryAddress}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {order.status === "scheduled"
                      ? order.scheduledTime
                      : "Not scheduled"}
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
