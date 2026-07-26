const fs = require("fs");
const path = require("path");

// The single directory Multer is allowed to write to and this module is
// allowed to delete from. Every path resolved below is checked against
// this directory before any filesystem operation happens.
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

// Multer does not create its destination directory. On a clean clone or
// a fresh deployment "uploads/" does not exist (it is gitignored), so this
// must run before the server starts accepting upload requests.
const ensureUploadsDir = () => {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
};

// Resolves a stored "/uploads/<filename>" path to an absolute path
// guaranteed to live inside the uploads directory, or null for anything
// else (external URLs, empty values, etc.) so callers can skip it safely.
const resolveUploadFilePath = (storedPath) => {
  if (typeof storedPath !== "string" || !storedPath.startsWith("/uploads/")) {
    return null;
  }

  // path.basename collapses away every directory segment (including any
  // "../" traversal attempt), so the result can never escape the uploads
  // directory regardless of what the stored string contains.
  const safeFileName = path.basename(storedPath);

  if (!safeFileName || safeFileName === "." || safeFileName === "..") {
    return null;
  }

  const resolvedPath = path.resolve(UPLOADS_DIR, safeFileName);

  // Defense in depth: confirm the resolved path is still inside the
  // uploads directory before ever touching the filesystem.
  if (
    resolvedPath !== path.join(UPLOADS_DIR, safeFileName) ||
    !resolvedPath.startsWith(UPLOADS_DIR + path.sep)
  ) {
    return null;
  }

  return resolvedPath;
};

// Deletes local uploaded files for the given stored paths. Ignores
// non-local paths and missing files, and never throws - a cleanup
// failure must never block the database operation it's attached to.
const deleteLocalUploadedFiles = async (storedPaths = []) => {
  const filePaths = (storedPaths || [])
    .map(resolveUploadFilePath)
    .filter(Boolean);

  await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        await fs.promises.unlink(filePath);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error(
            `Failed to remove uploaded file ${filePath}:`,
            error.message
          );
        }
      }
    })
  );
};

// Removes files Multer just wrote for the current request, using the
// absolute paths Multer itself reports on req.files. Used to roll back
// an upload when the database operation right after it fails, so a
// failed request never leaves orphan files behind. Never throws.
const deleteFilesByAbsolutePath = async (absolutePaths = []) => {
  await Promise.all(
    (absolutePaths || []).map(async (filePath) => {
      try {
        await fs.promises.unlink(filePath);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error(
            `Failed to remove orphaned upload ${filePath}:`,
            error.message
          );
        }
      }
    })
  );
};

module.exports = {
  UPLOADS_DIR,
  ensureUploadsDir,
  resolveUploadFilePath,
  deleteLocalUploadedFiles,
  deleteFilesByAbsolutePath,
};
