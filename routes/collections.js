const express = require("express");

const collections = require("../controllers/collections");
const tokenizer = require("../middlewares/tokenizer");
const router = express.Router();
const filer = require("../middlewares/filer");

router.get("/user/:id", tokenizer.tokenAccess, collections.getUserCollections);
router.get("/:id/items/:type", tokenizer.tokenPipe, collections.getCollectionItems);
router.post("/search", collections.searchCollection);
router.get("/:id", tokenizer.tokenPipe, collections.getOneCollection);
router.delete("/:id", collections.deleteCollection);

router.get("/", collections.getCollections);
router.post("/", tokenizer.tokenAccess, filer, collections.createCollection);

module.exports = router;