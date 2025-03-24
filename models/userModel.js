const mongoose = require("mongoose");
const Counter = require("./counterModel"); // Import the Counter model

const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      unique: true
    },
    userName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true
    },
    GSTIN: {
      type: String,
      required: true,
      minlength: 15,
      maxlength: 15
    },
    city: {
      type: String
    },
    state: {
      type: String
    },
    userRole: {
      type: String,
      enum: ["admin1", "admin2", "user", "superadmin"],
      default: "user"
    },
    status: {
      type: String,
      enum: ["approved", "rejected", "pending", "suspended"],
      default: "pending"
    },
    password: {
      type: String
    },
    Group: {
      type: String,
      enum: ["group1", "group2"],
      default: "group1"
    },
    GSTINVerified: {
      type: String,
      enum: ["pending", "verified"],
      default: "pending"
    },
    advancePayment: {
      type: String,
      enum: ["Yes", "No"],
      default: "No"
    },
    tradeName: {
      type: String
    },
    comments: {
      type: String
    },
    fcmToken: {
      type: String
    },
    installedVersion: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

UserSchema.pre("save", async function (next) {
  const user = this;
  if (user.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "userId" },
        { $inc: { sequenceValue: 1 } },
        { new: true, upsert: true }
      );
      user.userId = counter.sequenceValue;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});
// UserSchema.index({ phoneNumber: 1 }); // schema level indexing
// module.exports = mongoose.model("User", UserSchema);
const User = mongoose.model("User", UserSchema);
User.createIndexes({ phoneNumber: 1, GSTIN: 1 });
module.exports = User;
