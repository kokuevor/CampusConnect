import mongoose, { Schema, type Document } from "mongoose";
import { KNUST_CAMPUS_LOCATIONS } from "@/lib/types/trip";

export { KNUST_CAMPUS_LOCATIONS };

export type CampusLocation = (typeof KNUST_CAMPUS_LOCATIONS)[number];

export interface ILocation {
  type: "campus" | "off-campus";
  campusLocation?: CampusLocation;
  offCampusAddress?: string;
}

export interface IDeliveryRequest extends Document {
  userId: mongoose.Types.ObjectId;
  pickupLocation: ILocation;
  dropoffLocation: ILocation;
  itemDescription: string;
  itemSize: "Small" | "Medium" | "Large";
  priority: "normal" | "high" | "urgent";
  paymentAmount: number; // Payment in Ghana Cedi (GHC)
  pickupDate: Date;
  pickupTime: string;
  contactInfo: string;
  specialInstructions: string;
  status: "pending" | "matched" | "in-transit" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    type: { type: String, enum: ["campus", "off-campus"], required: true },
    campusLocation: { type: String, enum: KNUST_CAMPUS_LOCATIONS },
    offCampusAddress: { type: String },
  },
  { _id: false }
);

const DeliveryRequestSchema = new Schema<IDeliveryRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pickupLocation: { type: LocationSchema, required: true },
    dropoffLocation: { type: LocationSchema, required: true },
    itemDescription: { type: String, required: true, trim: true },
    itemSize: {
      type: String,
      enum: ["Small", "Medium", "Large"],
      default: "Small",
    },
    priority: {
      type: String,
      enum: ["normal", "high", "urgent"],
      default: "normal",
    },
    paymentAmount: { type: Number, required: true, min: 0 }, // Payment in GHC
    pickupDate: { type: Date, required: true },
    pickupTime: { type: String, default: "" },
    contactInfo: { type: String, default: "" },
    specialInstructions: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "matched", "in-transit", "delivered", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Safely check if model already exists
let DeliveryRequestModel;
try {
  DeliveryRequestModel = mongoose.models.DeliveryRequest;
  // If model exists, delete it to force recreation with new schema
  if (DeliveryRequestModel) {
    delete mongoose.models.DeliveryRequest;
  }
} catch (error) {
  DeliveryRequestModel = null;
}

export default mongoose.model<IDeliveryRequest>(
  "DeliveryRequest",
  DeliveryRequestSchema
);
