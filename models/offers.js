const mongoose = require("mongoose");
const { bidSchema } = require("./schemas");

const Offers = new mongoose.Schema({
	type: {
		type: String,
		enum: ["auction", "direct", "both"],
		require: true
	},
	status: {
		type: String,
		enum: ["pending", "expired", "completed", "closed"],
		default: "pending"
	},
	token: {
		type: mongoose.Types.ObjectId,
		ref: "tokens",
		required: true
	},
	creator: {
		type: mongoose.Types.ObjectId,
		ref: "users",
		required: true
	},
	buyer: {
		type: mongoose.Types.ObjectId,
		ref: "users"
	},
	purchase_type: {
		type: String,
		enum: ["auction", "direct"]
	},
	categories: [{
		type: String,
		ref: "categories"
	}],
	bids: [ bidSchema ],
	offer_price: Number,
	min_bid: Number,
	date_sell: Date,
	date_start: {
		type: Date,
		default: () => Date.now()
	},
	date_end: Date,
	date_create: {
		type: Date,
		default: () => Date.now()
	}
}, {
	versionKey: false
});


module.exports = mongoose.model("offers", Offers);