// "createdBy" fields can come back as either a raw ObjectId string or a
// populated object ({ _id, name, ... }) depending on the endpoint -
// these helpers make id comparisons safe regardless of which shape it is.

export function getEntityId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value._id) {
    return String(value._id);
  }

  return String(value);
}

export function isSameEntity(a, b) {
  const idA = getEntityId(a);
  const idB = getEntityId(b);

  return Boolean(idA && idB && idA === idB);
}

// Counts unique travelers (creator + participants), de-duplicated by id
// since the creator is normally also in `participants`.
export function getTravelerCount(trip) {
  if (!trip) {
    return 1;
  }

  const uniqueIds = new Set();

  const creatorId = getEntityId(trip.createdBy);

  if (creatorId) {
    uniqueIds.add(creatorId);
  }

  if (Array.isArray(trip.participants)) {
    trip.participants.forEach((participant) => {
      const participantId = getEntityId(participant);

      if (participantId) {
        uniqueIds.add(participantId);
      }
    });
  }

  // A trip always has at least one traveler (its creator), even if the
  // data above is somehow incomplete.
  return uniqueIds.size > 0 ? uniqueIds.size : 1;
}

// "1 traveler" / "2 travelers"
export function formatTravelerCount(count) {
  return `${count} traveler${count === 1 ? "" : "s"}`;
}

// Builds the read-only traveler list for display (creator first, then
// each unique participant); a raw id with no name falls back to a
// generic label rather than showing a bare ObjectId.
export function getTravelerList(trip) {
  if (!trip) {
    return [];
  }

  const seenIds = new Set();
  const travelers = [];

  const addTraveler = (value, isCreator) => {
    const id = getEntityId(value);

    if (!id || seenIds.has(id)) {
      return;
    }

    seenIds.add(id);

    const name =
      typeof value === "object" && value?.name
        ? value.name
        : "Trip member";

    travelers.push({ _id: id, name, isCreator });
  };

  addTraveler(trip.createdBy, true);

  if (Array.isArray(trip.participants)) {
    trip.participants.forEach((participant) => {
      addTraveler(participant, false);
    });
  }

  return travelers;
}
