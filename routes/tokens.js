const express = require("express");
const path = require("path");

const tokens = require("../controllers/mysql/tokens");
const tokenizer = require("../middlewares/tokenizer");
const filer = require("../middlewares/filer");
const router = express.Router();

router.get("/", tokens.getAllTokens);

// router.use("/mvp", express.static(path.resolve(__dirname, "..", "tokens")));
// router.post("/mvp", /*tokenizer.tokenAccess,*/ filer, tokens.createTokenMvp);

router.get("/my", tokenizer.tokenAccess, tokens.getMyTokens);
router.get("/approvednft", tokenizer.tokenAccess, tokens.getMyApprovedTokens);
router.get("/:id.json", tokens.getTokenJson);
router.get("/:id", tokenizer.tokenPipe, tokens.getTokenInfo);
router.post("/:id/chain", tokenizer.tokenAccess, tokens.setTokenChainId);
router.get("/:id/like", tokenizer.tokenAccess, tokens.toggleLike);
router.get("/:id/unlike", tokenizer.tokenAccess, tokens.toggleLike);
router.post("/", tokenizer.tokenAccess, filer, tokens.createToken);
router.delete("/:id/:user", tokens.deleteToken);
router.post(
  "/approvednft",
  tokenizer.tokenAccess,
  filer,
  tokens.createApprovedToken
);
router.delete("/approvednft/:id/:user", tokens.deleteApprovedToken);
router.post("/stake", tokenizer.tokenAccess, tokens.stakeToken);
router.post("/buyToken", tokenizer.tokenAccess, tokens.buyToken);
router.post("/transactionFee", tokens.transactionFee);

module.exports = router;
