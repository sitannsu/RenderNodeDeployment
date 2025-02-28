const mongoose = require("mongoose");
const Counter = require("./counterModel"); // Import the Counter model
const orderSchema = mongoose.Schema(
  {
    orderId: {
      type: Number,
      unique: true
    },
    user: {
      type: Object,
      required: true
    },
    product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product"
    },
    // oldProdName: {
    //   type: String
    // },
    // oldPrice: {
    //   type: Number
    // },
    bidPrice: {
      type: Number,
      default: 0,
      maxLength: [8, "Price cannot exceed 8 characters"]
    },
    quantity: {
      type: Number,
      default: 1,
      maxLength: [8, "Quantity cannot exceed 8 characters"]
    },
    remarks: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: [
        "Bid pending",
        "Bid accepted",
        "Bid declined",
        "Self Truck",
        "Easy Ship",
        "Completed Payment"
      ],
      default: "Bid pending"
    },
    invoiceNumber: {
      type: String
    },
    paymentGroup: {
      type: String
    },
    freight: {
      type: Number
    },
    truckNumber: {
      type: String
    },
    driverNumber: {
      type: String
    },
    dispatchDate: {
      type: String
    },
    transporterNumber: {
      type: String
    },
    transporterID: {
      type: String
    },
    oldProdName: { type: String },
    comments: {
      type: String
    },
    bidTimerIncCount: {
      type: Number,
      default: 1
    },
    billAmt: {
      type: Number
    },
    shipmentType: {
      type: String,
      enum: ["Not selected", "Self Truck", "Easy Ship"],
      default: "Not selected"
    },
    truckTracking: {
      type: String,
      enum: [
        "Not initialised",
        "Initialised",
        "Loading",
        "On Road",
        "On Hold",
        "Delivered"
      ],
      default: "Not initialised"
    }
  },
  {
    timestamps: true
  }
);
orderSchema.pre("save", async function (next) {
  const order = this;
  if (order.isNew) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: "orderId" },
        { $inc: { sequenceValue: 1 } },
        { new: true, upsert: true }
      );
      order.orderId = counter.sequenceValue;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});
module.exports = mongoose.model("Order", orderSchema);
