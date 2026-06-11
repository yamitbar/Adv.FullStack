// Load environment variables from the .env file
require("dotenv").config();

// Import the Express application
const app = require("./app");

// Import the database connection function
const connectDB = require("./config/db");

// Define the port for the server
const PORT = process.env.PORT || 5000;

// Connect to MongoDB before starting the server
connectDB();

// Start listening for requests
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});