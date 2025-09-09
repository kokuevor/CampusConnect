import mongoose, { Schema, type Document } from "mongoose";
import { KNUST_CAMPUS_LOCATIONS } from "@/lib/types/trip";

export { KNUST_CAMPUS_LOCATIONS };

export type CampusLocation = (typeof KNUST_CAMPUS_LOCATIONS)[number];

export interface ILocation {
  type: "campus" | "off-campus";
  campusLocation?: CampusLocation;
  offCampusAddress?: string;
}

export interface ITrip extends Document {
  travelerId: mongoose.Types.ObjectId;
  fromLocation: ILocation;
  toLocation: ILocation;
  departureTime: Date;
  transportMethod: string;
  maxDeliveries: number;
  currentDeliveries: number;
  pricePerDelivery: number; // Price in Ghana Cedi (GHC)
  isRecurring: boolean;
  status: "active" | "completed" | "cancelled";
  matchedRequests: mongoose.Types.ObjectId[];
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

const TripSchema = new Schema<ITrip>(
  {
    travelerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fromLocation: { type: LocationSchema, required: true },
    toLocation: { type: LocationSchema, required: true },
    departureTime: { type: Date, required: true },
    transportMethod: { type: String, required: true },
    maxDeliveries: { type: Number, required: true, min: 1 },
    currentDeliveries: { type: Number, default: 0 },
    pricePerDelivery: { type: Number, required: true, min: 0 }, // Price in GHC
    isRecurring: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    matchedRequests: [{ type: Schema.Types.ObjectId, ref: "DeliveryRequest" }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Trip ||
  mongoose.model<ITrip>("Trip", TripSchema);
