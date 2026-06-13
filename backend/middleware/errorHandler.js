const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${req.method} ${req.path} — ${err.message}`);

  // Custom thrown errors
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
    });
  }

  // Joi validation errors
  if (err.isJoi) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      details: err.details.map(d => d.message),
    });
  }

  // PostgreSQL errors
  if (err.code === "23505") {
    return res.status(400).json({
      success: false,
      message: "Record already exists",
    });
  }

  if (err.code === "23503") {
    return res.status(400).json({
      success: false,
      message: "Referenced record not found",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired. Please login again.",
    });
  }

  // Default 500
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
  });
};

module.exports = errorHandler;