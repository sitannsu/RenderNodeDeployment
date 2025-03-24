const Order = require("../models/orderModel");
const { clients } = require("../utils/otpUtils");
const triggerMail = require("../config/nodemailerConfig");
const { sendFCMNotification } = require("../utils/notifications");
const User = require("../models/userModel");
exports.createOrder = async (req, res) => {
  try {
    let order;
    if (req.user.userRole == "user") {
      order = await Order.create({ ...req.body, user: req?.user });
      let intervalCount = 1;
      let autoDeclineDuration = 10; //10 minutes
      let increaseTimerDuration = 10; //10 minutes
      let intervalID = setInterval(async () => {
        let recentOrder = await Order.findById(order._id);
        if (recentOrder?.status == "Bid pending") {
          if (recentOrder.bidTimerIncCount == intervalCount) {
            const query = { _id: order._id };
            const update = {
              $set: { status: "Bid declined" }
            };
            const options = {};
            Order.updateOne(query, update, options)
              .then(obj => {
                //console.log("Updated - " + obj);
                triggerMail(
                  order.user.email,
                  "Bid declined",
                  `Hi ${req.user.userName}<br><br>Your Bid Request got DECLINED for Order ID #${order.orderId}.<br> <br>Bid Details:  ${order.oldProdName} at ₹${order.bidPrice} for quantity ${order.quantity}. <br><br>Regards, <br>Team Durgapur Steel Tech`
                );
              })
              .catch(err => {
                console.log("Error: " + err);
              });
            clearInterval(intervalID);
          } else {
            intervalCount = intervalCount + increaseTimerDuration;
            //console.log(`intervalCount ${intervalCount}`);
            //console.log(`bidTimerIncCount ${recentOrder.bidTimerIncCount}`);
          }
        } else {
          // console.log(
          //   `order #${recentOrder?.orderId}status ${recentOrder?.status}`
          // );
          clearInterval(intervalID);
        }
      }, 1000 * 60 * autoDeclineDuration); //for 2 minutes
      const admins = clients.get("99999");
      admins &&
        Object.keys(admins).forEach(key => {
          admins[key]?.emit("orderRequest", {
            userId: req.user.userId,
            data: order
          });
        });
    } else {
      order = await Order.create({ ...req.body });
    }

    if (!order) {
      res.status(400).json({ success: false, message: "Order Not Created" });
    } else {
      res.status(201).json({ success: true, order });
      if (req.user.userRole == "user") {
        //console.log(req.user);
        triggerMail(
          req.user.email,
          "Bid Request placed successfully",
          `Hi ${req.user.userName}<br><br>Your Bid Request is placed successfully for ${order.oldProdName} at ₹${order.bidPrice} for quantity ${order.quantity}. Please wait for our team to review your request and we will shorty update your order status for Order ID #${order.orderId}.<br><br>Regards, <br>Team Durgapur Steel Tech`
        );
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getAllOrders = async (req, res) => {
  const { status } = req.query;
  try {
    const orders =
      status == undefined
        ? await Order.find().populate("product").sort({ createdAt: -1 })
        : await Order.find({ status: status })
            .populate("product")
            .sort({ createdAt: -1 });
    // const orders = await Order.find();
    const pendingTrucksCount = await Order.find({
      $or: [
        { status: "Bid accepted" },
        { status: "Self Truck" },
        { status: "Easy Ship" }
      ]
    }).countDocuments();
    const allSalesCount = await Order.find({
      $or: [
        { status: "Bid accepted" },
        { status: "Self Truck" },
        { status: "Easy Ship" },
        { status: "Completed Payment" }
      ]
    }).countDocuments();
    const completedPaymentCount = await Order.find({
      status: "Completed Payment"
    }).countDocuments();
    if (!orders) {
      res.status(400).json({ success: false, message: "Orders Not found" });
    } else {
      res.status(200).json({
        success: true,
        orders,
        pendingTrucksCount,
        allSalesCount,
        completedPaymentCount
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getLastTwoDaysOrders = async (req, res) => {
  const { status } = req.query;
  function subtractDaysToDate(date, days) {
    var new_date = new Date(date);
    new_date.setDate(new_date.getDate() - days);
    return new_date;
  }
  var today = new Date();
  var two_days_ago = subtractDaysToDate(today, 2);
  //console.log(new Date("2024-08-26T18:43:07.754Z") > two_days_ago);
  try {
    const orders =
      status == "Bid declined"
        ? await Order.find({
            status: "Bid declined",
            createdAt: { $gte: two_days_ago }
          })
            .populate("product")
            .sort({ createdAt: -1 })
        : await Order.find({
            $or: [
              { status: "Bid accepted" },
              { status: "Self Truck" },
              { status: "Easy Ship" },
              { status: "Completed Payment" }
            ],
            // createdAt: { $gte: new Date(new Date() - 1000 * 86400 * 2) }
            //createdAt: { $gte: new Date(new Date() - two_days_ago) }
            createdAt: { $gte: two_days_ago }
          })
            .populate("product")
            .sort({ createdAt: -1 });
    const ordersCount = await Order.find({
      createdAt: { $gte: two_days_ago }
    }).countDocuments();
    if (!orders) {
      res.status(400).json({ success: false, message: "Orders Not found" });
    } else {
      res.status(200).json({
        success: true,
        orders,
        ordersCount
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getSameDayOrders = async (req, res) => {
  var today = new Date();
  try {
    const orders = await Order.find({
      createdAt: {
        $gte: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          0,
          0,
          0
        )
      }
    })
      .populate("product")
      .sort({ createdAt: -1 });
    if (!orders) {
      res.status(400).json({ success: false, message: "Orders Not found" });
    } else {
      res.status(200).json({
        success: true,
        orders
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("product");
    if (!order) {
      res.status(400).json({ success: false, message: "Order Not found" });
    } else {
      res.status(200).json({ success: true, order });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateOrder = async (req, res) => {
  try {
    let oldOrder = await Order.findById(req.params.id);
    if (!oldOrder) {
      res.status(400).json({ success: false, message: "Order Not found" });
    } else {
      if (
        req.body.status == "Bid declined" &&
        oldOrder.status !== "Bid pending"
      ) {
        return res.status(400).json({
          success: false,
          message: `Order status as ${oldOrder.status} already updated for order #${oldOrder.orderId} `
        });
      }
      //console.log(oldOrder.status);
      let toUpdate = req.body;
      if (req.body.status == "Self Truck" || req.body.status == "Easy Ship") {
        toUpdate = { ...toUpdate, shipmentType: req.body.status };
      }
      if (req.body.status == "Bid accepted") {
        toUpdate = { ...toUpdate, shipmentType: "Not selected" };
      }
      //console.log(toUpdate);
      let order = await Order.findByIdAndUpdate(req.params.id, toUpdate, {
        new: true,
        runValidators: true,
        useFindAndModify: false
      });
      res.status(200).json({ success: true, order });

      if (
        req.body.status !== "Bid pending" &&
        oldOrder.status !== req.body.status
      ) {
        triggerMail(
          order.user.email,
          `Bid Request status updated`,
          `Hi ${order.user.userName}<br><br>${req.body.status} for Order ID #${order.orderId}.<br> <br>Bid Details:  ${order.oldProdName} at ₹${order.bidPrice} for quantity ${order.quantity}. <br><br>Regards, <br>Team Durgapur Steel Tech`
        );
      }

      if (
        req.user.userRole == "superadmin" ||
        req.user.userRole == "admin1" ||
        req.user.userRole == "admin2"
      ) {
        if (
          order.status == "Bid accepted" ||
          order.status == "Bid declined" ||
          order.status == "Completed Payment"
        ) {
          const clientSocket = clients.get(Number(order.user.userId));
          let message = `Your order #${order.orderId} is updated to "${order.status}" with truck tracking status as "${order.truckTracking}"`;
          clientSocket?.emit("orderUpdated", {
            userId: req.user.userId,
            data: order
          });
          //CODE FOR NOTIFICATION STARTS
          let receiverId = order.user.userId;
          console.log(receiverId);
          const user = await User.find({ userId: Number(receiverId) });
          const fcmToken = user[0].fcmToken;
          
          if (fcmToken) {
            try {
              await sendFCMNotification(
                fcmToken,
                'Order Status Update',
                message,
                { type: 'order_update', orderId: order._id.toString() }
              );
            } catch (error) {
              console.error('Error sending FCM notification:', error);
            }
          } else {
            console.log('No FCM token found for user:', receiverId);
          }
          //CODE FOR NOTIFICATION ENDS
        }
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.deleteOrder = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);
    if (!order) {
      res.status(400).json({ success: false, message: "Order Not found" });
    } else {
      await order.deleteOne();
      res
        .status(200)
        .json({ success: true, message: "Order Deleted Successfully" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
