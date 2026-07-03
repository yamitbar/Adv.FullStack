// Generate a random invite code for a trip
const generateInviteCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";

  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomPart += characters[randomIndex];
  }

  return `PTR-${randomPart}`;
};

module.exports = generateInviteCode;