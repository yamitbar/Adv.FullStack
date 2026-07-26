const cloudinary = require("../config/cloudinary");

// Uploads a single in-memory buffer (from Multer's memoryStorage) to
// Cloudinary. Returns { url, publicId } to store on the owning document.
// Throws on failure - the caller decides how to respond (no DB write
// should happen until this resolves).
const uploadBufferToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

// Deletes a single Cloudinary asset by public_id. Never throws - a
// cleanup failure must never block the request it's attached to (same
// contract as the local-disk cleanup helpers in mediaCleanup.js).
const destroyCloudinaryAsset = async (publicId) => {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(
      `Failed to remove Cloudinary asset ${publicId}:`,
      error.message
    );
  }
};

// Deletes multiple Cloudinary assets by public_id. Never throws.
const destroyCloudinaryAssets = async (publicIds = []) => {
  await Promise.all(
    (publicIds || [])
      .filter(Boolean)
      .map((publicId) => destroyCloudinaryAsset(publicId))
  );
};

module.exports = {
  uploadBufferToCloudinary,
  destroyCloudinaryAsset,
  destroyCloudinaryAssets,
};
