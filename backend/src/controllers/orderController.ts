import { Request, Response } from "express";
import Order, { IOrder, OrderStatus } from "../models/Order";
import TimeSlot from "../models/TimeSlot";
import mongoose from "mongoose";

// Create a new order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    // Check if the timeslot exists and is available
    const timeSlotId = req.body.timeSlotId;
    if (timeSlotId) {
      const timeSlot = await TimeSlot.findById(timeSlotId);
      if (!timeSlot) {
        return res.status(404).json({ message: "Time slot not found" });
      }

      if (!timeSlot.isAvailable()) {
        return res
          .status(400)
          .json({ message: "Time slot is no longer available" });
      }

      // Decrement the available count in the time slot
      timeSlot.available -= 1;
      await timeSlot.save();
    }

    // Create the order with the sender being the current user
    const orderData = {
      ...req.body,
      sender: userId,
      status: OrderStatus.PENDING,
    };

    const newOrder = new Order(orderData);
    await newOrder.save();

    res.status(201).json({
      success: true,
      order: newOrder,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all orders (with pagination and filtering)
export const getOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Filter options
    const filter: any = {};

    // Apply status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Apply date range filter if provided
    if (req.query.fromDate && req.query.toDate) {
      filter.createdAt = {
        $gte: new Date(req.query.fromDate as string),
        $lte: new Date(req.query.toDate as string),
      };
    }

    // For non-admin users, only show their own orders
    if ((req as any).user.role !== "admin") {
      filter.sender = (req as any).user._id;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("timeSlotId", "startTime endTime")
      .populate("assignedTo", "name email");

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      orders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single order by tracking number
export const getOrderByTracking = async (req: Request, res: Response) => {
  try {
    const trackingNumber = req.params.trackingNumber;

    const order = await Order.findOne({ trackingNumber })
      .populate("timeSlotId", "startTime endTime")
      .populate("assignedTo", "name");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get a single order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(orderId)
      .populate("timeSlotId", "startTime endTime")
      .populate("assignedTo", "name");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if user has permission to view this order
    if (
      (req as any).user.role !== "admin" &&
      order.sender.toString() !== (req as any).user._id.toString() &&
      order.assignedTo?.toString() !== (req as any).user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this order",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Set delivered date if status is DELIVERED
    if (
      status === OrderStatus.DELIVERED &&
      order.status !== OrderStatus.DELIVERED
    ) {
      order.deliveredAt = new Date();
    }

    order.status = status as OrderStatus;
    await order.save();

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Assign delivery personnel to an order
export const assignOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { deliveryPersonnelId } = req.body;

    if (!deliveryPersonnelId) {
      return res.status(400).json({
        success: false,
        message: "Delivery personnel ID is required",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.assignedTo = new mongoose.Types.ObjectId(deliveryPersonnelId);
    order.status = OrderStatus.ASSIGNED;

    await order.save();

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get orders assigned to the logged-in delivery personnel
export const getAssignedOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const orders = await Order.find({
      assignedTo: userId,
      status: { $in: [OrderStatus.ASSIGNED, OrderStatus.IN_TRANSIT] },
    })
      .populate("timeSlotId", "startTime endTime")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete an order (admin only)
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user is an admin
    if ((req as any).user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete orders",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // If the order has a time slot, increment its available count
    if (order.timeSlotId) {
      const timeSlot = await TimeSlot.findById(order.timeSlotId);
      if (timeSlot) {
        timeSlot.available += 1;
        await timeSlot.save();
      }
    }

    await Order.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
