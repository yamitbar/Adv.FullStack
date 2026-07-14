// Import Express
const express = require("express");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const tripRoutes = require("./routes/tripRoutes");

const {
  tripLocationRouter,
  locationRouter,
} = require("./routes/locationRoutes");

const {
  locationMemoryRouter,
  memoryRouter,
} = require("./routes/memoryRoutes");

// Create the Express app
const app = express();

// Parse incoming JSON requests
app.use(express.json());

// Serve uploaded files as static files
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Authentication and user routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Trip routes
app.use("/api/trips", tripRoutes);

// Location routes
app.use(
  "/api/trips/:tripId/locations",
  tripLocationRouter
);

app.use(
  "/api/locations",
  locationRouter
);

// Memory routes
app.use(
  "/api/locations/:locationId/memories",
  locationMemoryRouter
);

app.use(
  "/api/memories",
  memoryRouter
);

// Health check route
app.get("/", (req, res) => {
  res.send("Pathly API is running");
});

// Export the app
module.exports = app;