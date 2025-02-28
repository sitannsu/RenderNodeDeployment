const Product = require("../models/productModel");
const User = require("../models/userModel");
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
    if (user[0].installedVersion !== "1.0.2") {
      // res.status(400).json({
      //   success: false,
      //   message:
      //     "We have released a new and improved version. To continue using, please update the app for a better user experience."
      // });
      // res.writeHead(302, {
      //   Location: "https://itunes.apple.com/in/lookup?bundleId=com.durgapur.dgp"
      // });
      // response.end();
      res.redirect(
        "https://itunes.apple.com/in/lookup?bundleId=com.durgapur.dgp"
      );
      // throw new Error(
      //   "We have released a new and improved version. To continue using, please update the app for a better user experience."
      // );
    } else {
      const products = await Product.find().sort({ createdAt: -1 });
      if (!products) {
        res.status(400).json({ success: false, message: "Products Not found" });
      } else {
        res.status(200).json({ success: true, products });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  // var today = new Date();
  // var myToday = new Date(
  //   today.getFullYear(),
  //   today.getMonth(),
  //   today.getDate(),
  //   1,
  //   59,
  //   0
  // );
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      res.status(400).json({ success: false, message: "Product Not found" });
    } else {
      // let finalUpdate = req.body;
      let newIncOrDec = product.IncOrDec;
      // let yesterdayClosing = product.yesterdayClosing;
      // if (new Date(product.modifiedAt) < myToday) {
      //   yesterdayClosing = product.price; //Putting data here as price can be updated many times in one day
      // }
      // if (product.yesterdayClosing[0] > req.body.price[0]) {
      //   newIncOrDec[0] = "Dec";
      // }
      // if (product.yesterdayClosing[1] > req.body.price[1]) {
      //   newIncOrDec[1] = "Dec";
      // }
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
      finalUpdate = {
        ...req.body,
        IncOrDec: newIncOrDec
      };
      //console.log(finalUpdate);
      product = await Product.findByIdAndUpdate(req.params.id, finalUpdate, {
        new: true,
        runValidators: true,
        useFindAndModify: false
      });
      res.status(200).json({ success: true, product });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
