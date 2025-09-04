import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  studentId: string;
  phoneNumber: string;
  phoneVerified: boolean;
  phoneVerificationCode?: string;
  phoneVerificationExpires?: Date;
  studentIdValidated: boolean;
  studentIdValidationScore?: number;
  verificationStatus: "pending_verification" | "verified" | "rejected";
  profileImage?: string;
  studentIdImage?: {
    url: string;
    publicId: string;
  };
  selfieImage?: {
    url: string;
    publicId: string;
  };
  rating: number;
  totalDeliveries: number;
  joinedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    studentId: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true, unique: true },
    phoneVerified: { type: Boolean, default: false },
    phoneVerificationCode: { type: String },
    phoneVerificationExpires: { type: Date },
    studentIdValidated: { type: Boolean, default: false },
    studentIdValidationScore: { type: Number },
    verificationStatus: {
      type: String,
      enum: ["pending_verification", "verified", "rejected"],
      default: "pending_verification",
    },
    profileImage: { type: String },
    studentIdImage: {
      url: { type: String },
      publicId: { type: String },
    },
    selfieImage: {
      url: { type: String },
      publicId: { type: String },
    },
    rating: { type: Number, default: 5.0, min: 0, max: 5 },
    totalDeliveries: { type: Number, default: 0 },
    joinedDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
