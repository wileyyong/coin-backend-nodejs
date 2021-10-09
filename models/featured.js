const mongoose = require("mongoose");

const Featured = new mongoose.Schema({
  created_by: {
    type: String,
    default: "admin"
  },
	featured: String,
	featured_name: String,
	featured_price: Number
}, {
	versionKey: false
});

module.exports = mongoose.model("featured", Featured);