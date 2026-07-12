const mongoose = require("mongoose");
const config = require("./config");

const connectDB = async () => {
  const uri = config.databaseURI;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const conn = await mongoose.connect(uri);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.log(`❌ DB connection attempt ${attempt} failed: ${error.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  console.error("❌ Unable to connect to MongoDB. Exiting.");
  process.exit(1);
};

module.exports = connectDB;
