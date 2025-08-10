const app = require("./app");
const dotenv = require("dotenv");
const connectDatabase = require("./config/database");
const cloudinaryConfig = require("./config/cloudinary.config");

//CONFIGURATION
dotenv.config({ path: `environments/dev.env` });

//CONNECT TO DATABASE
connectDatabase();

//CONNECT TO CLOUDINARY
cloudinaryConfig();

// Start the server
const PORT = process.env.PORT || 5005;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
