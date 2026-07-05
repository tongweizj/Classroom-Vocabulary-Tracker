require("dotenv").config();

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (!MONGODB_URI) {
    console.error("FATAL: MONGODB_URI is not set in environment variables.");
    console.error("Create a .env file with MONGODB_URI=mongodb://... or export it.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected:", mongoose.connection.host);
  } catch (err) {
    console.error("FATAL: Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }
}

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Attempting reconnect...");
});

module.exports = { connectDB, mongoose };
