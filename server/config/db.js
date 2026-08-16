const mongoose = require("mongoose");

const connectDB = async () => {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGO_URL ||
    "mongodb://127.0.0.1:27017/projectAnji";

  if (!uri) {
    throw new Error(
      "MONGO_URI is not set. Please configure it in the .env file."
    );
  }

  await mongoose.connect(uri);
  console.log("MongoDB Connected");
};

module.exports = connectDB;
