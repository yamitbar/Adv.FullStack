// Import Express
const express = require("express");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const tripRoutes = require("./routes/tripRoutes");

// Create the Express app
const app = express();

// Parse incoming JSON requests
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/trips", tripRoutes);

// Health check routes
app.get("/", (req, res) => {
  res.send("Pathly API is running");
});

// Export the app
module.exports = app;