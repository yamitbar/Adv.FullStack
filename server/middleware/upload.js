const multer = require("multer");
const {
  UPLOADS_DIR,
  ensureUploadsDir,
} = require("../utils/mediaCleanup");

// Multer does not create its destination directory, and "uploads/" is
// gitignored so it will not exist on a clean clone or a fresh deploy.
// Create it once when this module is first loaded.
ensureUploadsDir();

// Configure where uploaded files are stored
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, UPLOADS_DIR);
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

  const error = new Error(
    "Only JPEG, PNG and WebP images are allowed"
  );

  error.statusCode = 400;

  callback(error, false);
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