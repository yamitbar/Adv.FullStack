// Load environment variables from the .env file
require("dotenv").config();

// Import the Express application
const app = require("./app");

// Import the database connection function
const connectDB = require("./config/db");

// Define the port for the server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Do not accept requests until MongoDB is ready
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
