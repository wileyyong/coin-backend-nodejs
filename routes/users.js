const express = require("express");

const users = require("../controllers/users");
const router = express.Router();
const tokenizer = require("../middlewares/tokenizer");
const filer = require("../middlewares/filer");

// router.get("/me", users.getCurrentUser);
router.get("/settings", tokenizer.tokenAccess, users.getUserSettings);
router.post("/settings", tokenizer.tokenAccess, filer, users.updateUserSettings);
router.get("/verify", tokenizer.tokenAccess, users.verifyUser);
router.post("/cover", tokenizer.tokenAccess, filer, users.changeCoverImage);

router.post("/search", users.searchUser);
router.get("/tops/:type", users.getTopUsers);

router.get("/:id/items/:type", users.getUserItems);
router.get("/:id/follow", tokenizer.tokenAccess, users.toggleFollow);
router.get("/:id/unfollow", tokenizer.tokenAccess, users.toggleFollow);
router.get("/:id", tokenizer.tokenPipe, users.getOneUser);

module.exports = router;