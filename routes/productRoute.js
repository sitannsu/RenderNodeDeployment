const express = require("express");
const {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getProductIds
} = require("../controllers/productController");
const authenticateToken = require("../middleware/auth.middleware");
const router = express.Router();

router.post("/createnew", authenticateToken, createProduct);

router.get("/getall", authenticateToken, getAllProducts);

router.get("/getone/:id", authenticateToken, getSingleProduct);

router.put("/updateone/:id", authenticateToken, updateProduct);

router.delete("/deleteone/:id", authenticateToken, deleteProduct);

router.get("/ids", getProductIds);

module.exports = router;
