// middleware/upload.js
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinaryConfig = require("../config/cloudinary.config");
const storage = new CloudinaryStorage({
  cloudinary: cloudinaryConfig(),
  params: {
    folder: "chat_uploads",
    allowedFormats: ["jpg", "jpeg", "png", "gif", "pdf", "docx"],
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
