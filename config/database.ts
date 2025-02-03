import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    console.error("MongoDB URL is not defined in the environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUrl);
    console.log("MongoDB connected successfully");
  } catch (err) {
    if (err instanceof Error) {
      console.error("MongoDB connection error:", err.message);
    } else {
      console.error("An unknown error occurred during MongoDB connection.");
    }
    process.exit(1);
  }
};

export default connectDB;
