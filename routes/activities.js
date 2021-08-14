const express = require("express");

const activities = require("../controllers/activities");
const router = express.Router();
const tokenizer = require("../middlewares/tokenizer");

router.get("/all", activities.getActivitiesList);
router.get("/my", tokenizer.tokenAccess, activities.getActivitiesList);
router.get("/following", tokenizer.tokenAccess, activities.getActivitiesList);

module.exports = router;