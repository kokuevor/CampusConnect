import mongoose, { Schema, type Document } from "mongoose"

export interface IMessage extends Document {
  conversationId: string
  senderId: mongoose.Types.ObjectId
  content: string
  type: "text" | "system"
  createdAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ["text", "system"], default: "text" },
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema)
