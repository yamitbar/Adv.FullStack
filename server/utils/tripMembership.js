// Shared trip-membership check, used by every controller that needs to
// decide whether the authenticated user may read or write trip, location,
// or memory content. Previously duplicated identically in
// locationController.js and memoryController.js - kept here as the single
// source of truth instead.
//
// A user is a member of a trip if they created it or if they joined it
// (participants array, populated via the invite-code join flow).
const isTripMember = (trip, userId) => {
  const isCreator =
    trip.createdBy.toString() === userId.toString();

  const isParticipant = trip.participants.some(
    (participantId) =>
      participantId.toString() === userId.toString()
  );

  return isCreator || isParticipant;
};

module.exports = {
  isTripMember,
};
