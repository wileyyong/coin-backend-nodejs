const mongoose = require("mongoose");

const Users = new mongoose.Schema({
	wallet: {
		type: String,
		required: true,
		select: false
	},
	name: {
		type: String,
		required: true,
		default: "Username"
	},
	email: {
		type: String,
		select: false
	},
	bio: {
		type: String,
		select: false
	},
	twitter: {
		type: String,
		select: false
	},
	instagram: {
		type: String,
		select: false
	},
	link: String,
	avatar: {
		type: String,
		default: "/content/avatar/default.png"
	},
	cover: String,
	verified: {
		type: Boolean,
		default: false
	},
	featured: String,
	featured_name: String,
	featured_price: Number,
	date_create: {
		type: Date,
		default: () => Date.now()
	},
	following: {
		type: [{
			type: mongoose.Types.ObjectId,
			ref: "users"
		}],
		default: [],
		select: false
	},
	royalties: {
		type: Number,
		default: 0,
		select: false
	}
}, {
	versionKey: false
});


module.exports = mongoose.model("users", Users);