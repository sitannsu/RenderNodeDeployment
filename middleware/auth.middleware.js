const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

function validateToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (err) {
    return { valid: false, error: err.message, name: err.name };
  }
}

async function authenticateToken(req, res, next) {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (authHeader && !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "FAILED",
      message: "Invalid Token Format: Bearer Token Expected"
    });
  }

  if (!token) {
    return res
      .status(401)
      .json({ status: "FAILED", message: "Access Denied: No Token Provided" });
  }

  const { valid, decoded, name } = validateToken(token);

  if (!valid) {
    if (name === "TokenExpiredError") {
      return res
        .status(403)
        .json({ status: "FAILED", message: "Token Expired" });
    } else if (name === "JsonWebTokenError") {
      return res
        .status(403)
        .json({ status: "FAILED", message: "Invalid Token" });
    } else {
      return res.status(403).json({
        status: "FAILED",
        message: "Token Verification Failed"
      });
    }
  }

  // Token is valid, attach user data to the request object
  let user = await User.findOne({ userId: decoded.userId });
  req.user = {
    userId: user.userId,
    userRole: user.userRole,
    userName: user.userName,
    userGroup: user.Group,
    email: user.email,
    tradeName: user.tradeName
  };
  next();
}

module.exports = authenticateToken;
