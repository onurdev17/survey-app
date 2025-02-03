import mongoose, { Document, Schema } from "mongoose";
import argon2 from "argon2";

export interface IUser extends Document {
  email: string;
  username: string;
  password: string;
  createdAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    sessionToken: { type: String, default: null },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await argon2.hash(this.password);
  next();
});

UserSchema.methods.comparePassword = async function (password: string) {
  return argon2.verify(this.password, password);
};

const User = mongoose.model<IUser>("user", UserSchema);

export default User;
