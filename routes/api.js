const express = require("express");

const users = require("../controllers/mysql/users");
const tokens = require("../controllers/mysql/tokens");
const apy = require("../controllers/mysql/apy");
const router = express.Router();

router.get("/apy", apy.getApy);
router.post("/apy", apy.updateApy);
router.post("/update", users.qrCode);
router.post("/claimPuml", tokens.claimPumlAPI);
router.post("/nfts", tokens.getNftsAPI);

module.exports = router;
