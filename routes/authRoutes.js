const express = require("express");
const {
  sendOtp,
  signUp,
  verifyOtp,
  login,
  getAllUsers,
  updateUser,
  createAdmin,
  getUserDetails
} = require("../controllers/authController");
const authenticateToken = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/sign-up", signUp);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.get("/allusers", authenticateToken, getAllUsers);
router.put("/updateone/:id", authenticateToken, updateUser);
router.post("/create-admin", authenticateToken, createAdmin);
// router.post("/create-admin", createAdmin);
router.get("/getuser/:id", authenticateToken, getUserDetails);

module.exports = router;
