import mongoose, { Document, Schema } from "mongoose";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  IN_TRANSIT = "in_transit",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
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

export interface IOrder extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: {
    name: string;
    phone: string;
    email?: string;
  };
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    location: ILocation;
    addressType: AddressType;
  };
  packageDetails: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    description: string;
  };
  timeSlot: number;
  predictedTimeSlot?: number;
  deliveryPersonnel?: mongoose.Types.ObjectId;
  status: OrderStatus;
  trackingNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      name: {
        type: String,
        required: [true, "Recipient name is required"],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, "Recipient phone is required"],
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
    },
    deliveryAddress: {
      street: {
        type: String,
        required: [true, "Street address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      postalCode: {
        type: String,
        required: [true, "Postal code is required"],
        trim: true,
      },
      country: {
        type: String,
        required: [true, "Country is required"],
        trim: true,
        default: "India",
      },
      location: {
        latitude: {
          type: Number,
          required: [true, "Latitude is required"],
        },
        longitude: {
          type: Number,
          required: [true, "Longitude is required"],
        },
      },
      addressType: {
        type: Number,
        enum: Object.values(AddressType),
        required: [true, "Address type is required"],
      },
    },
    packageDetails: {
      weight: {
        type: Number,
        required: [true, "Package weight is required"],
      },
      dimensions: {
        length: {
          type: Number,
          required: [true, "Package length is required"],
        },
        width: {
          type: Number,
          required: [true, "Package width is required"],
        },
        height: {
          type: Number,
          required: [true, "Package height is required"],
        },
      },
      description: {
        type: String,
        trim: true,
      },
    },
    timeSlot: {
      type: Number,
      required: [true, "Time slot is required"],
      min: 1,
      max: 5,
    },
    predictedTimeSlot: {
      type: Number,
      min: 1,
      max: 5,
    },
    deliveryPersonnel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate tracking number before saving
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    this.trackingNumber = generateTrackingNumber();
  }
  next();
});

// Function to generate a unique tracking number
function generateTrackingNumber(): string {
  const prefix = "OD";
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}${timestamp}${random}`;
}

export default mongoose.model<IOrder>("Order", orderSchema);
