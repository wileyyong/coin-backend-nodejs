const mongoose = require("mongoose");

const Categories = new mongoose.Schema({
	_id: {
		type: String
	},
	name: String,
	hidden: {
		type: Boolean,
		default: false,
		select: false
	}
}, {
	_id: false,
	versionKey: false
});

module.exports = mongoose.model("categories", Categories);