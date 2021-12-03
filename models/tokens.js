const mongoose = require("mongoose");
// const Categories = require("./categories");
// const Users = require("./users");

const { ownerSchema } = require("./schemas");

const Tokens = new mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	description: String,
	media: {
		type: String,
		default: "/media/html.jpg"
		// required: true
	},
	attributes: {
		type: Array,
		default: []
	},
	thumbnail: {
		type: String,
		default: null
	},
	chain_id: Number,
	royalties: {
		type: Number,
		default: 0
	},
	collections: {
		type: mongoose.Types.ObjectId,
		ref: "collections",
		default: null
	},
	categories: [{
		type: String,
		ref: "categories"
	}],
	creator: {
		type: mongoose.Types.ObjectId,
		ref: "users",
		required: true
	},
	owners: [ ownerSchema ],
	is_sponsored: {
		type: Boolean,
		default: undefined
	},
	locked: {
		type: String,
		default: undefined,
		select: false
	},
	offchain: {
		type: Boolean,
		default: false
	},
	likes: {
		type: [{
			type: mongoose.Types.ObjectId,
			ref: "users"
		}],
		default: [],
		select: false
	},
	date_create: {
		type: Date,
		default: () => Date.now()
	},
	date_resale: {
		type: Date,
		default: () => Date.now()
	}
}, {
	versionKey: false
});


module.exports = mongoose.model("tokens", Tokens);