const express = require("express");

const categories = require("../controllers/mysql/categories");
const tokenizer = require("../middlewares/tokenizer");
const router = express.Router();

router.get("/", categories.getAllCategories);
router.post("/", categories.createCategory);
router.delete("/:id", categories.deleteCategory);

module.exports = router;