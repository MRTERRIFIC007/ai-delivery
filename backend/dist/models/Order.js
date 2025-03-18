"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressType = exports.OrderStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["CONFIRMED"] = "confirmed";
    OrderStatus["IN_TRANSIT"] = "in_transit";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["ASSIGNED"] = "assigned";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var AddressType;
(function (AddressType) {
    AddressType[AddressType["RESIDENTIAL"] = 1] = "RESIDENTIAL";
    AddressType[AddressType["COMMERCIAL"] = 2] = "COMMERCIAL";
    AddressType[AddressType["INDUSTRIAL"] = 3] = "INDUSTRIAL";
})(AddressType || (exports.AddressType = AddressType = {}));
const orderSchema = new mongoose_1.Schema({
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
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
    timeSlotId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "TimeSlot",
    },
    predictedTimeSlot: {
        type: Number,
        min: 1,
        max: 5,
    },
    deliveryPersonnel: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    assignedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
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
    deliveredAt: {
        type: Date,
    },
    scheduledDeliveryTime: {
        type: Date,
    },
    notes: {
        type: String,
        trim: true,
    },
    deliveryDistance: {
        type: Number,
    },
    deliveryPriority: {
        type: String,
        enum: ["high", "medium", "low"],
        default: "medium",
    },
}, {
    timestamps: true,
});
// Generate tracking number before saving
orderSchema.pre("save", async function (next) {
    if (this.isNew) {
        this.trackingNumber = generateTrackingNumber();
    }
    next();
});
// Function to generate a unique tracking number
function generateTrackingNumber() {
    const prefix = "OD";
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return `${prefix}${timestamp}${random}`;
}
exports.default = mongoose_1.default.model("Order", orderSchema);
