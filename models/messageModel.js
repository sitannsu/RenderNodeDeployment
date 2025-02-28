const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    sender: {
      type: Number,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Number,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    orderId: {
      type: String,
      required: true,
    },
    fileUrl: { type: String },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Message", messageSchema);
