import { Request, Response } from "express";
import Order, { OrderStatus } from "../models/Order";
import User, { UserRole } from "../models/User";
import mongoose from "mongoose";

// Get all deliveries for a postman
export const getPostmanDeliveries = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { status, date } = req.query;

    // Check if the user is a postman
    const user = await User.findById(userId);
    if (!user || user.role !== UserRole.POSTMAN) {
      return res.status(403).json({
        success: false,
        message: "Only postmen can access their deliveries",
      });
    }

    // Build filter
    const filter: any = {
      assignedTo: userId,
    };

    // Apply status filter if provided
    if (status) {
      filter.status = status;
    } else {
      // By default, show only active deliveries (assigned or in transit)
      filter.status = { $in: [OrderStatus.ASSIGNED, OrderStatus.IN_TRANSIT] };
    }

    // Apply date filter if provided
    if (date) {
      const queryDate = new Date(date as string);
      const startOfDay = new Date(queryDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(queryDate);
      endOfDay.setHours(23, 59, 59, 999);

      filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    // Get deliveries with pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const deliveries = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name email phone")
      .populate("timeSlotId", "startTime endTime");

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: deliveries.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      deliveries,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update delivery status
export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).user._id;

    // Validate status
    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // Get the order
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if the user has permission to update this order
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Postmen can only update orders assigned to them
    if (user.role === UserRole.POSTMAN) {
      if (order.assignedTo?.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this delivery",
        });
      }

      // Postmen can only update to certain statuses
      const allowedStatusesForPostman = [
        OrderStatus.IN_TRANSIT,
        OrderStatus.DELIVERED,
      ];

      if (!allowedStatusesForPostman.includes(status as OrderStatus)) {
        return res.status(403).json({
          success: false,
          message: "Postmen can only update to in_transit or delivered status",
        });
      }
    } else if (user.role !== UserRole.ADMIN) {
      // Only admins and assigned postmen can update delivery status
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this delivery",
      });
    }

    // Update order status
    order.status = status as OrderStatus;

    // If status is DELIVERED, set deliveredAt
    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }

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

// Track delivery by tracking number
export const trackDelivery = async (req: Request, res: Response) => {
  try {
    const { trackingNumber } = req.params;

    const order = await Order.findOne({ trackingNumber })
      .select(
        "status trackingNumber recipient deliveryAddress deliveredAt createdAt scheduledDeliveryTime"
      )
      .populate("timeSlotId", "startTime endTime");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      tracking: {
        trackingNumber: order.trackingNumber,
        status: order.status,
        recipient: order.recipient.name,
        address: `${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.postalCode}`,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt,
        scheduledDelivery:
          order.scheduledDeliveryTime || (order.timeSlotId as any)?.startTime,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get delivery statistics
export const getDeliveryStats = async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if ((req as any).user.role !== UserRole.ADMIN) {
      return res.status(403).json({
        success: false,
        message: "Only admins can access delivery statistics",
      });
    }

    // Get count of orders by status
    const statusStats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format status stats
    const statusCounts: Record<string, number> = {};
    statusStats.forEach((stat) => {
      statusCounts[stat._id] = stat.count;
    });

    // Get count of orders by date (last 7 days)
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const dailyStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: lastWeek },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get count of orders by area
    const areaStats = await Order.aggregate([
      {
        $group: {
          _id: "$deliveryAddress.city",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 5,
      },
    ]);

    // Get completed deliveries per postman
    const postmanStats = await Order.aggregate([
      {
        $match: {
          status: OrderStatus.DELIVERED,
          assignedTo: { $exists: true },
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Populate postman details
    const postmenIds = postmanStats.map((stat) => stat._id);
    const postmen = await User.find({ _id: { $in: postmenIds } }).select(
      "name"
    );

    const postmanDeliveries = postmanStats.map((stat) => {
      const postman = postmen.find(
        (p) => p._id.toString() === stat._id.toString()
      );
      return {
        postmanId: stat._id,
        name: postman ? postman.name : "Unknown",
        deliveries: stat.count,
      };
    });

    res.status(200).json({
      success: true,
      stats: {
        byStatus: statusCounts,
        byDate: dailyStats,
        byArea: areaStats,
        byPostman: postmanDeliveries,
        total: await Order.countDocuments(),
        delivered: statusCounts[OrderStatus.DELIVERED] || 0,
        pending: statusCounts[OrderStatus.PENDING] || 0,
        inTransit: statusCounts[OrderStatus.IN_TRANSIT] || 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add delivery notes
export const addDeliveryNotes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = (req as any).user._id;

    if (!notes) {
      return res.status(400).json({
        success: false,
        message: "Notes are required",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if user has permission (must be admin or assigned postman)
    if (
      (req as any).user.role !== UserRole.ADMIN &&
      order.assignedTo?.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to add notes to this delivery",
      });
    }

    order.notes = notes;
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
