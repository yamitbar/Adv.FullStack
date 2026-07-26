const Location = require("../models/Location");
const Memory = require("../models/Memory");
const { deleteLocalUploadedFiles } = require("./mediaCleanup");

// Deletes every memory that belongs to a location, along with any local
// uploaded files those memories reference. Safe to call on a location
// that has no memories.
const deleteMemoriesForLocation = async (locationId) => {
  const memories = await Memory.find({ location: locationId });

  const allImagePaths = memories.flatMap(
    (memory) => memory.images || []
  );

  await deleteLocalUploadedFiles(allImagePaths);
  await Memory.deleteMany({ location: locationId });
};

// Deletes every location that belongs to a trip, and all memories/files
// that belong to those locations, including each location's own cover
// image. Safe to call on a trip that has no locations.
const deleteLocationsForTrip = async (tripId) => {
  const locations = await Location.find({ trip: tripId });

  const coverImagePaths = locations
    .map((location) => location.coverImage)
    .filter(Boolean);

  await deleteLocalUploadedFiles(coverImagePaths);

  for (const location of locations) {
    // eslint-disable-next-line no-await-in-loop
    await deleteMemoriesForLocation(location._id);
  }

  await Location.deleteMany({ trip: tripId });
};

module.exports = {
  deleteMemoriesForLocation,
  deleteLocationsForTrip,
};
