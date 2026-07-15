// Import dependencies
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const {
  apiLimiter,
  authLimiter,
} = require("./middleware/rateLimiter");
const cors = require("cors");

// Import routes
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

// Import middleware
const errorHandler = require("./middleware/errorHandler");

// Create the Express app
const app = express();

// Security headers
app.use(helmet());

app.use("/api", apiLimiter);

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
  res.status(200).send("Pathly API is running");
});

// Handle routes that do not exist
app.use((req, res, next) => {
  const error = new Error(
    `Route not found: ${req.method} ${req.originalUrl}`
  );

  error.statusCode = 404;
  next(error);
});

// Global error handler must always be registered last
app.use(errorHandler);

// Export the app
module.exports = app;