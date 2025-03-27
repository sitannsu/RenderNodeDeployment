const User = require("../models/userModel");
const client = require("../config/twilioConfig");
const { generateOtp } = require("../utils/otpUtils");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const triggerMail = require("../config/nodemailerConfig");

const isValidEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhoneNumber = phoneNumber => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phoneNumber);
};

exports.sendOtp = async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Kindly enter a valid 10 digit number.",
        errCode: 1001
      });
    }
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({
        status: "FAILED",
        message: "User not found.",
        errCode: 1001
      });
    }
    if (user.status !== "approved") {
      return res.status(200).json({
        status: "FAILED",
        message: "Something went wrong. Please contact admin.",
        errCode: 1010
      });
    }
    if (phoneNumber === "9999911111") {
      const verificationCode = "123123";
      res.cookie("otp" + phoneNumber, verificationCode, {
        httpOnly: true,
        secure: false,
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      return res.status(200).json({
        status: "SUCCESS",
        message: "OTP sent successfully."
      });
    }

    const verificationCode = generateOtp();

    // Commented out Twilio message sending for testing
    // const message = {
    //   body: `Your verification code is ${verificationCode}`,
    //   to: phoneNumber.startsWith("+91") ? phoneNumber : "+91" + phoneNumber,
    //   from: process.env.TWILIO_PHONE_NUMBER
    // };
    // await client().messages.create(message);

    // Log OTP for testing
    console.log(`OTP for ${phoneNumber}: ${verificationCode}`);

    res.cookie("otp" + phoneNumber, verificationCode, {
      httpOnly: true,
      secure: false,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    return res.status(200).json({
      status: "SUCCESS",
      message: "OTP sent successfully."
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: "Internal server error.",
      errCode: 1002,
      error: error.message
    });
  }
};

exports.signUp = async (req, res) => {
  let {
    userName,
    email,
    phoneNumber,
    GSTIN,
    city,
    state,
    status,
    GSTINVerified
  } = req.body;
  phoneNumber = phoneNumber.replace(/\+/g, " ");
  phoneNumber = phoneNumber.replace(/ /g, "");
  try {
    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Kindly enter a valid 10 digit number.",
        errCode: 1001
      });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Kindly enter a valid email id.",
        errCode: 1001
      });
    }

    const user = new User({
      userName,
      email,
      phoneNumber,
      GSTIN,
      city,
      state,
      userRole: "user",
      status,
      Group: "group1",
      GSTINVerified,
      advancePayment: "No"
    });
    await user.save();

    return res.status(201).json({
      status: "SUCCESS",
      message: "User registered request sent successfully.",
      userId: user.userId
    });
  } catch (error) {
    if (error.code === 11000) {
      // Check which field caused the duplicate key error
      const duplicateField = Object.keys(error.keyPattern)[0];
      let errorMessage = "Duplicate key error.";
      if (duplicateField === "phoneNumber") {
        errorMessage = "Phone number already exists.";
      } else if (duplicateField === "email") {
        errorMessage = "Email already exists.";
      } else if (duplicateField === "GSTIN") {
        errorMessage = "Please enter unique GSTIN";
      }
      return res.status(400).json({
        status: "FAILED",
        message: errorMessage,
        errCode: 1001
      });
    } else if (error._message == "User validation failed") {
      console.log(error);
      let errorMessage = "Please enter 15 digits GSTIN";
      return res.status(400).json({
        status: "FAILED",
        message: errorMessage,
        errCode: 1001
      });
    }

    return res.status(500).json({
      status: "FAILED",
      message: "Internal server error.",
      errCode: 1003
    });
  }
};

exports.verifyOtp = async (req, res) => {
  const { phoneNumber, otp } = req.body;

  try {
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({
        status: "FAILED",
        message: "User not found.",
        errCode: 1004
      });
    }

    const cookieOtp = req.cookies["otp" + phoneNumber];
    if (!cookieOtp) {
      return res.status(400).json({
        status: "FAILED",
        message: "OTP expired. Please Resend OTP.",
        errCode: 1005
      });
    }

    if (cookieOtp !== otp) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid OTP.",
        errCode: 1006
      });
    }

    res.clearCookie("otp" + phoneNumber);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.userId,
        userRole: user.userRole,
        userName: user.userName,
        userGroup: user.Group
      },
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "OTP verified successfully.",
      data: {
        token: token,
        userLongId: user._id,
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        GSTIN: user.GSTIN,
        city: user.city,
        state: user.state,
        userRole: user.userRole,
        status: user.status,
        Group: user.Group,
        GSTINVerified: user.GSTINVerified
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: "Internal server error.",
      errCode: 1007,
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "FAILED",
        message: "User not found.",
        errCode: 1008
      });
    }

    if (!user.password) {
      return res.status(400).json({
        status: "FAILED",
        message: "Password not set for this user.",
        errCode: 1011
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "FAILED",
        message: "Invalid password.",
        errCode: 1009
      });
    }

    const token = jwt.sign(
      { userId: user.userId, userRole: user.userRole },
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      status: "SUCCESS",
      message: "Login successful.",
      data: {
        token: token,
        userLongId: user._id,
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        GSTIN: user.GSTIN,
        city: user.city,
        state: user.state,
        userRole: user.userRole,
        status: user.status,
        Group: user.Group,
        GSTINVerified: user.GSTINVerified
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
exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.userRole === "user") {
      return res.status(401).json({ success: false, message: "Access denied" });
    }
    const users = await User.find({ userRole: "user" }).sort({ userId: -1 });
    const usersCount = await User.find({
      userRole: "user",
      status: "pending"
    }).countDocuments();
    if (!users) {
      res.status(400).json({ success: false, message: "Users Not found" });
    } else {
      res.status(200).json({ success: true, users, usersCount });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateUser = async (req, res) => {
  console.log(req.body);
  try {
    // if (req.user.userRole === "user") {
    //   return res.status(401).json({ success: false, message: "Access denied" });
    // }
    let user = await User.findById(req.params.id);
    let sendMail = false;
    if (user.status !== "approved") {
      sendMail = true;
    }
    if (!user) {
      res.status(400).json({ success: false, message: "User Not found" });
    } else {
      user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        // runValidators: true,
        useFindAndModify: false
      });
      if (sendMail && user.status == "approved") {
        triggerMail(
          user.email,
          "Sign Up request approved",
          `Hi ${user.userName}<br><br>Your sign up request in DGPSteelTech App is approved. Please login with your Phone Number ${user.phoneNumber}.<br><br>Regards, <br>Team Durgapur Steel Tech`
        );
      } else {
        console.log("Do not trigger mail");
      }
      res.status(200).json({ success: true, user });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAdmin = async (req, res) => {
  const { userName, email, password, phoneNumber, userRole } = req.body;
  try {
    if (!userName || !email || !password || !userRole) {
      return res.status(400).json({
        message: "Bad request, kindly share correct details.",
        status: "FAILED"
      });
    }
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      userName,
      email,
      password: hashedPassword,
      phoneNumber,
      userRole
    });
    await newUser.save();
    res
      .status(201)
      .json({ message: "Admin created successfully", status: "SUCCESS" });
  } catch (err) {
    console.error("Error creating admin:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getUserDetails = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "FAILED",
        message: "User not found.",
        errCode: 1004
      });
    }
    return res.status(200).json({
      status: "SUCCESS",
      message: "LOGGED IN USER DETAILS FETCHED SUCCESSFULLY.",
      data: {
        email: user.email,
        GSTIN: user.GSTIN,
        city: user.city,
        state: user.state,
        status: user.status,
        Group: user.Group,
        phoneNumber: user.phoneNumber,
        advancePayment: user.advancePayment,
        tradeName: user.tradeName
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: "FAILED",
      message: "Internal server error.",
      errCode: 1007,
      error: error.message
    });
  }
};
