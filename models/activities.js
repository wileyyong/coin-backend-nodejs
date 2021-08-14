const mongoose = require("mongoose");

const Activities = new mongoose.Schema({
	type: {
		type: String,
		required: true,
		enum: ["minted", "listed", "offered", "purchased", "following", "liked", "transferred"]
	},
	user: {
		type: mongoose.Types.ObjectId,
		ref: "users",
		required: true
	},
	to_user: {
		type: mongoose.Types.ObjectId,
		ref: "users"
	},
	token: {
		type: mongoose.Types.ObjectId,
		ref: "tokens"
	},
	offer: {
		type: mongoose.Types.ObjectId,
		ref: "offers"
	},
	price: Number,
	date: {
		type: Date,
		default: () => Date.now()
	}
}, {
	versionKey: false
});


module.exports = mongoose.model("activities", Activities);