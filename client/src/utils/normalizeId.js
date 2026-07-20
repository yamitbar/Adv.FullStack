// Trip/Location/Memory "createdBy" fields can come back from the API as
// either a raw ObjectId string or a populated object (e.g. { _id, name,
// email }) depending on the endpoint. These helpers make id comparisons
// safe regardless of which shape is present, instead of duplicating the
// same `typeof` checks in every component.

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

// Counts the unique travelers on a trip: the creator plus every
// participant, without double-counting the creator when they also
// appear in `participants` (which they normally do - the backend adds
// the creator to `participants` on trip creation - but this stays
// correct even for older/edge-case data where that isn't true, where
// `participants` is missing entirely, or where it contains duplicate
// ids). Works whether `createdBy`/`participants` entries are raw
// ObjectId strings or populated user objects.
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
