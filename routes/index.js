const express = require("express");
const router = express.Router();
const chatRoutes = require("./chatRoutes");
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoute");
const orderRoutes = require("./orderRoute");
const versionRoutes = require("./versionRoute");

router.use("/chat", chatRoutes);
router.use("/auth", authRoutes);
router.use("/product", productRoutes);
router.use("/order", orderRoutes);
router.use("/version", versionRoutes);

module.exports = router;
