// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error";

  // Handle invalid MongoDB ObjectId errors
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for field "${err.path}"`;
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((error) => error.message)
      .join(", ");
  }

  // Handle duplicate MongoDB field errors
  if (err.code === 11000) {
    const duplicatedField = Object.keys(err.keyValue || {})[0];

    statusCode = 409;
    message = duplicatedField
      ? `${duplicatedField} already exists`
      : "A record with this value already exists";
  }

  // Handle invalid or expired JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired";
  }

  // Handle Multer upload errors with a friendly, specific message
  if (err.name === "MulterError") {
    statusCode = 400;

    const multerMessages = {
      LIMIT_FILE_SIZE: "Each image must be 5MB or smaller",
      LIMIT_FILE_COUNT: "You can upload up to 5 images at a time",
      LIMIT_UNEXPECTED_FILE:
        "Too many images, or an unexpected upload field",
    };

    message = multerMessages[err.code] || "Image upload failed";
  }

  // Log the complete error on the server
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.error(err.stack || err);

  const response = {
    success: false,
    message,
  };

  // Expose the stack trace only during development
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;