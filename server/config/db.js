const mongoose = require("mongoose");

// Connects to MongoDB using the URI from the environment.
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB connected: ${connection.connection.host}`);
  }
  catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);

    // Let the server entry point decide how to stop startup
    throw error;
  }
};

module.exports = connectDB;
