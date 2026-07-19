const mongoose = require("mongoose");

// Create a connection to the MongoDB database
const connectDB = async () => {
  try {
    // Connect using the URI stored in the .env file
    const connection = await mongoose.connect(process.env.MONGO_URI);

    // Log a success message when the connection is established
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } 
  catch (error) {
    // Log the error message if the connection fails
    console.error(`MongoDB connection error: ${error.message}`);

    // Let the server entry point decide how to stop startup
    throw error;
  }
};

// Export the connection function for use in server.js
module.exports = connectDB;
