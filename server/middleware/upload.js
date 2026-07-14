const multer = require("multer");
const path = require("path");

// Configure where uploaded files are stored
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, path.join(__dirname, "../uploads"));
  },

  filename: (req, file, callback) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}`;

    callback(
      null,
      uniqueName + path.extname(file.originalname).toLowerCase()
    );
  },
});

// Allow image files only
const imageFileFilter = (req, file, callback) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    return callback(null, true);
  }

  callback(
    new Error("Only JPEG, PNG and WebP images are allowed"),
    false
  );
};

// Create the Multer middleware
const uploadImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
});

module.exports = {
  uploadImages,
};