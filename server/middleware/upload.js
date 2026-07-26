const multer = require("multer");

// Images are held in memory only long enough to be streamed to
// Cloudinary in the controller - nothing is written to local disk, so
// there is no local file to orphan if validation or the upload fails.
const storage = multer.memoryStorage();

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
