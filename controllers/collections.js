const mongoose = require("mongoose");
const Collections = require("../models/collections");
const Tokens = require("../models/tokens");
const Offers = require("../models/offers");
const path = require("path");
const helpers = require("../helpers");

const Controller = {
	async getCollections(req, res) {
		try {
			var type = req.query.type;

			var paginator_data = await helpers.paginator(req.query.page, {}, Collections);
			var pagination = paginator_data.info;

			var collections = await Collections.find({})
				.sort({date_create: -1})
				.limit(20)
				.skip(paginator_data.skip)
				.populate("creator", "+wallet")
				.lean();
				
			res.send({collections, ...pagination});
		}
		catch(error) {
			console.log("Collection get all error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async getOneCollection(req, res) {
		try {
			var id = req.params.id;

			var collection = await Collections.findOne({_id: id})
				.populate("creator", "+wallet")
				.lean();
			
			if (!collection)
				return res.status(404).send({error: "Collection not found"});
			
			var stats = {
				on_sale: 0,
				owned: 0
			};

			var tokens = await Tokens.find({collections: id, chain_id: {$exists: true}}, "_id").lean();
			var tokens_array = tokens.map(t => t._id);

			stats.on_sale = await Offers.countDocuments({status: "pending", token: {$in: tokens_array}}).exec();
			stats.owned = tokens.length;
				
			res.send({collection, stats});
		}
		catch(error) {
			console.log("Collection get one error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async getCollectionItems(req, res) {
		try {
			var id = req.params.id;
			var type = req.params.type;
			var items = [];
			var pagination = {};

			if (!type || !["on_sale", "owned"].includes(type))
				return res.status(422).send({error: "Bad type of items"});

			if (type == "on_sale") {
				var tokens = await Tokens.find({collections: id}, "_id").lean();
				tokens = tokens.map(t => t._id);

				var query = {status: "pending", token: {$in: tokens}};
				var paginator_data = await helpers.paginator(req.query.page, query, Offers);
				pagination = paginator_data.info;

				items = await Offers.find(query)
					.sort({date_create: -1})
					.limit(20)
					.skip(paginator_data.skip)
					.populate("creator", "+wallet")
					.populate("categories")
					.populate("token", "+likes")
					.lean();
			}

			if (type == "owned") {
				var query = {collections: id, chain_id: {$exists: true}};
				var paginator_data = await helpers.paginator(req.query.page, query, Tokens);
				pagination = paginator_data.info;

				items = await Tokens.find(query, "+likes")
					.limit(20)
					.skip(paginator_data.skip)
					.populate("creator", "+wallet")
					.populate("categories")
					.lean()
			}

			helpers.calcLikesArray(items, req.user);
			res.send({items, ...pagination});
		}
		catch(error) {
			console.log("Collection get tokens error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async getUserCollections(req, res) {
		var user_id = req.params.id;

		if (user_id == "my") {
			if (req.user) 
				user_id = req.user.id;
			else 
				return res.status(403).send({error: "Forbidden"});
		}

		try {
			var collections = await Collections.find({creator: user_id})
				.sort({date_create: -1})
				.populate("creator", "+wallet")
				.lean();

			res.send({collections});
		}
		catch(error) {
			console.log("Collection get my error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async createCollection(req, res) {
		try {
			var { name, symbol, description, short, contract_address, engine_address, network } = req.body;
			var creator = req.user.id;
			var id = mongoose.Types.ObjectId();
			var collection = {_id: id, name, creator, symbol, description, short, contract_address, engine_address, network};

			if (!name) return res.status(422).send({error: "Not all fields has filled"});

			if (req.files.image) {
				var image = await helpers.uploadToIPFS(req.files.image.data, collection._id);
				if (!image) image = await helpers.uploadFile(req.files.image, collection._id, "content/collection");
				collection.image = image;
			}
			if (req.files.cover) {
				var cover = await helpers.uploadToIPFS(req.files.cover.data, collection._id);
				if (!cover) cover = await helpers.uploadFile(req.files.cover, collection._id, "content/cover");
				collection.cover = cover;
			}

			var collection = await Collections.create(collection);
			await collection.populate("creator", "+wallet").execPopulate();
			res.send({message: "Collection success created", collection});
		}
		catch(error) {
			console.log("Collection create error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async deleteCollection(req, res) {
		try {
			var id = req.params.id;

			var collection = await Collections.findOne({_id: id}).lean();
			if (!collection) 
				return res.status(404).send({error: "Collection not found"});
			
			if (collection.creator.toString() != req.user.id) 
				return res.status(403).send({error: "Forbidden"});
			
			await Collections.deleteOne({_id: id}).exec();
			await Tokens.updateMany({collections: id}, {$set: {collections: null}}).exec();

			res.send({message: "Collection success deleted"});
		}
		catch(error) {
			console.log("Collection delete error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async searchCollection(req, res) {
		try {
			if (!Object.keys(req.body).length) 
				return res.status(422).send({error: "No one search params"});

			var { name, description, date_from } = req.body;
			var query = {};

			if (name) query.name = new RegExp(name, "gi");
			if (description) query.description = new RegExp(description, "gi");
			if (date_from) query.date_create = { $gte: date_from };

			var paginator_data = await helpers.paginator(req.query.page, query, Collections);
			var pagination = paginator_data.info;

			var collections = await Collections.find(query)
				.sort({date_create: -1})
				.limit(20)
				.skip(paginator_data.skip)
				.populate("creator", "+wallet")
				.lean();

			res.send({collections, ...pagination});
		}
		catch(error) {
			console.log("Collection search error", error);
			res.status(500).send({error: "Server error"});
		}
	}
};

module.exports = Controller;