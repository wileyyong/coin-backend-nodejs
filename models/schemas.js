const mongoose = require("mongoose");

const bidSchema = {
	_id: false,
	user: {
		type: mongoose.Types.ObjectId,
		ref: "users",
		required: true
	},
	price: {
		type: Number,
		default: 0,
	},
	hash: {
		type: String,
		required: true
	},
	date: {
		type: Date,
		default: () => Date.now()
	}
};

const ownerSchema = {
	_id: false,
	user: {
		type: mongoose.Types.ObjectId,
		ref: "users",
		required: true
	},
	price: {
		type: Number,
		default: 0,
	},
	date: {
		type: Date,
		default: () => Date.now()
	}
};


module.exports = {
	bidSchema,
	ownerSchema
};