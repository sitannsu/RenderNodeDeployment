const express = require("express");
const {
  createOrder,
  getAllOrders,
  getSingleOrder,
  updateOrder,
  deleteOrder,
  getLastTwoDaysOrders,
  getSameDayOrders
} = require("../controllers/orderController");
const authenticateToken = require("../middleware/auth.middleware");
const router = express.Router();

router.post("/createnew", authenticateToken, createOrder);

router.get("/getall", authenticateToken, getAllOrders);
router.get("/getlasttwodays", authenticateToken, getLastTwoDaysOrders);
router.get("/getsameday", authenticateToken, getSameDayOrders);
router.get("/getone/:id", authenticateToken, getSingleOrder);

router.put("/updateone/:id", authenticateToken, updateOrder);

router.delete("/deleteone/:id", authenticateToken, deleteOrder);

module.exports = router;
