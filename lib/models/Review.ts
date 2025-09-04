import mongoose, { Schema, type Document } from "mongoose"

export interface IReview extends Document {
  reviewerId: mongoose.Types.ObjectId
  revieweeId: mongoose.Types.ObjectId
  rating: number
  comment: string
  deliveryId: mongoose.Types.ObjectId
  type: "sender" | "traveler"
  createdAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    reviewerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    revieweeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    deliveryId: { type: Schema.Types.ObjectId, ref: "DeliveryRequest", required: true },
    type: { type: String, enum: ["sender", "traveler"], required: true },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema)
