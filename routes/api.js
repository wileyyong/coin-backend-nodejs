const express = require("express");

const users = require("../controllers/mysql/users");
const apy = require("../controllers/mysql/apy");
const router = express.Router();

router.get("/apy", apy.getApy);
router.post("/apy", apy.updateApy);
router.post("/update", users.qrCode);

module.exports = router;