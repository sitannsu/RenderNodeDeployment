const mongoose = require("mongoose");

const connectDatabase = () => {
  const mongoUrl = process.env.MONGODB_URI;
  console.log("MongoDB URL:", mongoUrl); // Added for debugging

  mongoose
    .connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(data => {
      console.log(`MongoDB connected with server: ${data.connection.host}`);
    })
    .catch(err => {
      console.log("❌ MongoDB connection error:", err);
    });
};

module.exports = connectDatabase;
