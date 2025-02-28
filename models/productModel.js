const mongoose = require("mongoose");
const productSchema = mongoose.Schema({
  // _id: String,
  name: {
    type: String,
    required: [true, "Please Enter Product's Name"],
    trim: true
  },
  price: {
    type: [Number],
    maxLength: [8, "Price cannot exceed 8 characters"]
  },
  category: {
    type: String,
    enum: ["TMT", "ANGLE"],
    default: "TMT"
  },
  // yesterdayClosing: {
  //   type: [Number],
  //   maxLength: [8, "Price cannot exceed 8 characters"]
  // },
  IncOrDec: { type: [String] },
  saleOpen: {
    type: String,
    enum: ["Yes", "No"],
    default: "Yes"
  },
  // modifiedAt: {
  //   type: Date,
  //   default: Date.now
  // },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model("Product", productSchema);
