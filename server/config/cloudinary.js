const cloudinary = require("cloudinary").v2;

// Credentials come only from environment variables - never hardcoded or
// committed. See .env.example for the required keys.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;
