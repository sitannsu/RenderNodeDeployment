const { Expo } = require("expo-server-sdk");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const socketManager = require('../utils/socketManager');

exports.createProduct = async (req, res) => {
  try {
    //console.log(req.body);
    //console.log(typeof req.body.price[0]);
    //console.log(typeof req.body.price[1]);
    const product = await Product.create(req.body);
    if (!product) {
      res.status(400).json({ success: false, message: "Product Not Created" });
    } else {
      res.status(201).json({ success: true, product });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getAllProducts = async (req, res) => {
  try {
    const user = await User.find({ userId: req.user.userId });
    
    const products = await Product.find().sort({ createdAt: -1 });
    if (!products) {
      return res.status(400).json({ 
        success: false, 
        message: "Products Not found" 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      products: products 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
exports.getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(400).json({ success: false, message: "Product Not found" });
    } else {
      res.status(200).json({ success: true, product });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    console.log("Updating product:", product.name);
    console.log("Old price:", product.price);
    console.log("New price:", req.body.price);

    if (!req.body.price || !Array.isArray(req.body.price) || req.body.price.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Invalid price format. Expected array with 2 values"
      });
    }

    let newIncOrDec = [...product.IncOrDec]; 
    if (product.price[0] > req.body.price[0]) {
      newIncOrDec[0] = "Dec";
    } else if (product.price[0] < req.body.price[0]) {
      newIncOrDec[0] = "Inc";
    }
    if (product.price[1] > req.body.price[1]) {
      newIncOrDec[1] = "Dec";
    } else if (product.price[1] < req.body.price[1]) {
      newIncOrDec[1] = "Inc";
    }
      if (product.saleOpen == "No" && req.body.saleOpen == "Yes") {
        const saleOpenCount = await Product.find({
          saleOpen: "Yes"
        }).countDocuments();
        if (saleOpenCount == 5) {
          //CODE FOR NOTIFICATION STARTS
          const user = await User.find({
            expoNotificationToken: { $exists: true }
          });
          let somePushTokens = [];
          user.forEach(user => {
            somePushTokens.push(user.expoNotificationToken);
          });
          console.log(somePushTokens);
          let accessToken = "i6cubWZs0I3nUTJpoo_azcBWPS_0pBLyLnzZz6OF";
          let expo = new Expo({
            accessToken: accessToken,
            useFcmV1: true
          });

          let messages = [];
          let message = `Hi, please check the updated price and place your bid soon`;
          for (let pushToken of somePushTokens) {
            if (!Expo.isExpoPushToken(pushToken)) {
              console.error(
                `Push token ${pushToken} is not a valid Expo push token`
              );
              continue;
            }
            messages.push({
              to: pushToken,
              sound: "default",
              body: message,
              data: { withSome: "data" }
            });
          }
          let chunks = expo.chunkPushNotifications(messages);
          let tickets = [];
          (async () => {
            for (let chunk of chunks) {
              try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log(ticketChunk);
                tickets.push(...ticketChunk);
              } catch (error) {
                console.error(error);
              }
            }
          })();
          let receiptIds = [];
          for (let ticket of tickets) {
            if (ticket.status === "ok") {
              receiptIds.push(ticket.id);
            }
          }

          let receiptIdChunks =
            expo.chunkPushNotificationReceiptIds(receiptIds);
          (async () => {
            for (let chunk of receiptIdChunks) {
              try {
                let receipts = await expo.getPushNotificationReceiptsAsync(
                  chunk
                );
                console.log(receipts);
                for (let receiptId in receipts) {
                  let { status, message, details } = receipts[receiptId];
                  console.log(`Status is ${status}`);
                  console.log(`Message is ${message}`);
                  console.log(`Details is ${details}`);
                  if (status === "ok") {
                    continue;
                  } else if (status === "error") {
                    console.error(
                      `There was an error sending a notification: ${message}`
                    );
                    if (details && details.error) {
                      console.error(`The error code is ${details.error}`);
                    }
                  }
                }
              } catch (error) {
                console.error(error);
              }
            }
          })();
        }
      }


    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body, 
        IncOrDec: newIncOrDec 
      },
      {
        new: true,
        runValidators: true
      }
    );

    console.log("Emitting price update for:", updatedProduct.name);
    const io = socketManager.getIO();
    
    // Broadcast to all clients
    io.emit("productPriceUpdate", {
      productId: updatedProduct._id,
      name: updatedProduct.name,
      price: updatedProduct.price,
      category: updatedProduct.category,
      saleOpen: updatedProduct.saleOpen,
      IncOrDec: updatedProduct.IncOrDec
    });

    res.status(200).json({
      success: true,
      product: updatedProduct
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
exports.deleteProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      res.status(400).json({ success: false, message: "Product Not found" });
    } else {
      await product.deleteOne();
      res
        .status(200)
        .json({ success: true, message: "Product Deleted Successfully" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.getProductIds = async (req, res) => {
  try {
    const products = await Product.find().select('_id name price');
    res.status(200).json({
      success: true,
      products: products.map(p => ({
        id: p._id,
        name: p.name,
        currentPrice: p.price
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
