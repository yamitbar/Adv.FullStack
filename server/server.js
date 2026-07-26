require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

// Falls back to 3000 to match server/.env.example and the client's
// default VITE_API_URL, so a fresh checkout works even if PORT is unset.
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Do not accept requests until MongoDB is ready
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
