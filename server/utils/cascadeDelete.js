const Location = require("../models/Location");
const Memory = require("../models/Memory");
const { destroyCloudinaryAssets } = require("./cloudinaryUpload");

// Deletes every memory that belongs to a location, along with any
// Cloudinary images those memories reference. Safe to call on a location
// that has no memories.
const deleteMemoriesForLocation = async (locationId) => {
  const memories = await Memory.find({ location: locationId });

  const allPublicIds = memories.flatMap(
    (memory) => memory.imagePublicIds || []
  );

  await destroyCloudinaryAssets(allPublicIds);
  await Memory.deleteMany({ location: locationId });
};

// Deletes every location that belongs to a trip, and all memories/images
// that belong to those locations, including each location's own cover
// image. Safe to call on a trip that has no locations.
const deleteLocationsForTrip = async (tripId) => {
  const locations = await Location.find({ trip: tripId });

  const coverImagePublicIds = locations
    .map((location) => location.coverImagePublicId)
    .filter(Boolean);

  await destroyCloudinaryAssets(coverImagePublicIds);

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
