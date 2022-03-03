const mongoose = require("mongoose");

const Collections = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	symbol: String,
	description: String,
	short: String,
	image: String,
	cover: String,
	creator: {
		type: mongoose.Types.ObjectId,
		ref: "users",
		required: true
	},
	contract_address: String,
	engine_address: String,
	network: {
		type: String,
		default: "ETH"
	},
	date_create: {
		type: Date,
		default: () => Date.now()
	}
}, {
	versionKey: false
});


module.exports = mongoose.model("collections", Collections);