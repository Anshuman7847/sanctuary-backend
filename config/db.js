const mongoose = require("mongoose");

mongoose.set("strictQuery", true);
mongoose.set("bufferCommands", false);

const connectDB = async () => {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is not set in environment");
  }

  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    console.log("DB Connected");
    return mongoose.connection;
  } catch (error) {
    console.error(
      "Failed to connect to MongoDB:",
      error && error.message ? error.message : error
    );
    throw error;
  }
};

module.exports = connectDB;
