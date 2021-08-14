const express = require("express");

const auth = require("../controllers/auth");
const router = express.Router();

router.post("/signin", auth.signIn);
router.post("/signup", auth.signUp);
router.post("/wallet", auth.byWallet);

module.exports = router;