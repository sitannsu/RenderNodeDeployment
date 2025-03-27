const User = require("../models/userModel");

exports.updateFCMToken = async (req, res) => {
  const { userId, fcmToken } = req.body;

  try {
    if (!userId || !fcmToken) {
      return res.status(400).json({
        status: "FAILED",
        message: "User ID and FCM token are required.",
        errCode: 1012
      });
    }

    // Try to find user by userId (both as number and string)
let user = await User.findOne({ userId: Number(userId) });
if (!user) {
  user = await User.findOne({ userId: userId.toString() });
}
    if (!user) {
      return res.status(404).json({
        status: "FAILED",
        message: "User not found.",
        errCode: 1008
      });
    }

    // Update FCM token
    user.fcmToken = fcmToken;
    await user.save();

    return res.status(200).json({
      status: "SUCCESS",
      message: "FCM token updated successfully.",
      data: {
        userId: user.userId,
        fcmToken: user.fcmToken
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: "Internal server error.",
      errCode: 1010,
      error: error.message
    });
  }
};
