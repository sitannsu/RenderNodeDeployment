const express = require("express");
const router = express.Router();
const { getVersionInfo } = require("../controllers/versionController");

router.get("/check", getVersionInfo);

module.exports = router;