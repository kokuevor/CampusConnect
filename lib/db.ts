import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      console.log("Already connected to db");
      return;
    }

    // Check if DB_URI is defined
    const dbUri = process.env.DB_URI;
    if (!dbUri) {
      console.error("DB_URI environment variable is not defined");
      throw new Error("Database connection string not configured");
    }

    mongoose.set("strictQuery", false);
    const conn = await mongoose.connect(dbUri);
    console.log(`DB Connected - ${conn.connection.host}`);
  } catch (error) {
    console.log("DB connection failed", error);
    throw error;
  }
};

export default dbConnect;
