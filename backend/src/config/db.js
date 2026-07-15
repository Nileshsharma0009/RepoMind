


import mongoose from "mongoose";
import env from './env.js';
let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URL;

  if (!uri) {
    throw new Error("❌ Missing MONGODB_URL environment variable");
  }

  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = db.connections[0].readyState === 1;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error; // let Vercel handle the error
  }
};

export default connectDB;
