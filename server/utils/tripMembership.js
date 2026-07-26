// A user is a trip member if they created it or joined it via invite code.
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
