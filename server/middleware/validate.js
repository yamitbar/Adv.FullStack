const {
  deleteFilesByAbsolutePath,
} = require("../utils/mediaCleanup");

// `options` can override the defaults below (e.g. { stripUnknown: false }
// to reject unknown fields instead of silently dropping them, used by
// the user-update route so a spoofed field like "role" is rejected
// rather than quietly ignored).
const validate = (schema, options = {}) => {
  return async (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      ...options,
    });

    if (error) {
      // Multer uses memoryStorage (see middleware/upload.js), so a file
      // that fails validation here was never written anywhere - nothing
      // to clean up. This guard only matters if a route ever reintroduces
      // disk storage, in which case req.file.path would be set again.
      const orphanedPaths = [
        ...(req.file?.path ? [req.file.path] : []),
        ...(req.files ? req.files.map((file) => file.path).filter(Boolean) : []),
      ];

      if (orphanedPaths.length > 0) {
        await deleteFilesByAbsolutePath(orphanedPaths);
      }

      const errorMessages = error.details.map((detail) => detail.message);

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errorMessages,
      });
    }

    req.body = value;
    next();
  };
};

module.exports = validate;