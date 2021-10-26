const express = require("express");

const tokenizer = require("../middlewares/tokenizer");
const offers = require("../controllers/mysql/offers");
const router = express.Router();

router.get("/", (req, res) => res.redirect("/offers/explore"));
router.post("/", tokenizer.tokenAccess, offers.createOffer);
router.post("/search", tokenizer.tokenPipe, offers.searchOffers);
router.get("/:type", tokenizer.tokenPipe, offers.getAuctions);
router.post("/:id/bid", tokenizer.tokenAccess, offers.addBid);
router.post("/:id/buy", tokenizer.tokenAccess, offers.buyDirectOffer);

module.exports = router;