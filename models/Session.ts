import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 60 * 60 * 1000) }, // 1 hour
  },
  { timestamps: true }
);

const Session = mongoose.model<ISession>("Session", SessionSchema);

export default Session;
