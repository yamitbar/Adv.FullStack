// Import Express
const express = require("express");
const authRoutes = require("./routes/authRoutes");

// Create the Express app
const app = express();

// Parse incoming JSON requests
app.use(express.json());

app.use("/api/auth", authRoutes);

// Health check route
app.get("/", (req, res) => {
  res.send("Pathly API is running");
});

// Export the app
module.exports = app;