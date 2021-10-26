const mongoose = require("mongoose");
const Tokens = require("../models/tokens");
const Offers = require("../models/offers");
const Activities = require("../models/activities");
const helpers = require("../helpers");

const Controller = {
	async getAllTokens(req, res) {
		try {
			var query = {chain_id: {$exists: true}};
			var paginator_data = await helpers.paginator(req.query.page, query, Tokens);
			var pagination = paginator_data.info;

			var tokens = await Tokens.find(query, "+likes")
				.sort({date_create: -1})
				.limit(20)
				.skip(paginator_data.skip)
				.populate("collections")
				.populate("creator")
				.populate("owners.user")
				.populate("categories")
				.lean();
			
			helpers.calcLikesArray(tokens, req.user);

			res.send({tokens, ...pagination});
		}
		catch(error) {
			console.log("Token get all error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	
	async getMyTokens(req, res) {
		try {
			var query = {
				$or: [{creator: req.user.id}, {"owners.0.user": req.user.id}],
				chain_id: {$exists: true}
			};

			var paginator_data = await helpers.paginator(req.query.page, query, Tokens);
			var pagination = paginator_data.info;

			var tokens = await Tokens.find(query, "+likes")
				.sort({date_create: -1})
				.limit(20)
				.skip(paginator_data.skip)
				.populate("collections")
				.populate("creator")
				.populate("owners.user")
				.populate("categories")
				.lean();

			helpers.calcLikesArray(tokens, req.user);

			res.send({tokens, ...pagination});
		}
		catch(error) {
			console.log("Token get my error", error);
			res.status(500).send({error: "Server error"});
		}
	},


	async getTokenInfo(req, res) {
		try {
			var token_id = req.params.id;
			var token = await Tokens.findOne({_id: token_id, chain_id: {$exists: true}}, "+likes")
				.populate("collections")
				.populate("creator", "+wallet")
				.populate("owners.user", "+wallet")
				.populate("categories")
				.lean();

			if (!token) 
				return res.status(404).send({error: "Token not found"});
			
			helpers.calcLikes(token, req.user);

			var offer = await Offers.findOne({token: token_id})
				.sort({date_create: -1})
				.populate("creator", "+wallet")
				.populate("buyer", "+wallet")
				.populate("bids.user", "+wallet")
				.lean();

			var history = await Activities.find({token: token_id})
				.sort({date: -1})
				.populate("user", "+wallet")
				.populate("to_user", "+wallet")
				.populate("token", "name media thumbnail")
				.populate("offer")
				.lean();
			
			res.send({token, offer, history});
		}
		catch(error) {
			console.log("Token get error", error);
			res.status(500).send({error: "Server error"});
		}
	},


	async getTokenJson(req, res) {
		try {
			var token_id = req.params.id;
			var token = await Tokens.findOne({_id: token_id}).lean();

			if (!token) 
				return res.status(404).send({error: "Token not found"});
			
			res.send({
				name: token.name,
				description: token.description,
				attributes: token.attributes,
				image_url: token.thumbnail || token.media,
				properties: token.properties
			});
		}
		catch(error) {
			console.log("Token JSON error", error);
			res.status(500).send({error: "Token JSON error"});
		}
	},


	async createToken(req, res) {
		var { name, description, properties, collection, categories, royalties, locked, offchain } = helpers.parseFormData(req.body);

		var token_id = mongoose.Types.ObjectId();

		if (!req.files || !req.files.media) 
			return res.status(422).send({error: "Image or other media is required"});

		try {
			var media = await helpers.uploadFile(req.files.media, token_id, "content/media");

			var token_data = {
				_id: token_id,
				name,
				royalties,
				categories: categories.split("|"), // Todo: Add categories check exists
				owners: [{user: req.user.id}],
				creator: req.user.id,
				offchain: offchain || false,
				media
			};

			if (req.files.thumbnail) {
				var thumbnail = await helpers.uploadFile(req.files.thumbnail, token_id, "content/thumbnail");
				token_data.thumbnail = thumbnail;
			}

			if (locked) token_data.locked = locked;
			if (description) token_data.description = description;
			if (properties) token_data.properties = properties;
			if (collection && !helpers.isNot(collection)) token_data.collections = collection;

			var token = await Tokens.create(token_data);

			res.send({message: "Token created", token, link: `/api/tokens/${token._id}.json`});

			Activities.create({
				type: "minted",
				user: req.user.id,
				token: token_id
			});
		}
		catch(error) {
			console.log("Token create error", error);
			res.status(500).send({error: "Token creation error"});
		}
	},


	async setTokenChainId(req, res) {
		try {
			var token_id = req.params.id;
			var chain_id = req.body.chain_id;
			console.log('chain_id: ', chain_id);
			if (!token_id || !chain_id) 
				return res.status(422).send({error: "Not all fields has filled"});

			var token = await Tokens.findOne({_id: token_id}).exec();

			if (!token) 
				return res.status(404).send({error: "Token not found"});
			
			if (req.user.id != token.creator.toString()) 
				return res.status(403).send({error: "Forbidden"});

			token.chain_id = chain_id;
			await token.save();

			res.send({message: "Success changed"});
		}
		catch(error) {
			console.log("Token set chain error", error);
			res.status(500).send({error: "Token set chain_id error"});
		}
	},


	async deleteToken(req, res) {
		try {
			var id = req.params.id;

			var token = await Tokens.findOne({_id: id}).lean();
			if (!token) 
				return res.status(404).send({error: "Token not found"});
			
			if (req.user.id != token.creator.toString()) 
				return res.status(403).send({error: "Forbidden"});
			
			await Tokens.deleteOne({_id: id}).exec();
			await Offers.deleteMany({token: id}).exec();
			await Activities.deleteMany({token: id}).exec();

			res.send({message: "Token success deleted"});
		}
		catch(error) {
			console.log("Token delete error", error);
			res.status(500).send({error: "Token delete error"});
		}
	},

	
	async toggleLike(req, res) {
		try {
			var token_id = req.params.id;

			if (!token_id || !mongoose.Types.ObjectId.isValid(token_id)) 
				return res.status(422).send({error: "Bad token id"});

			var token = await Tokens.findOne({_id: token_id, chain_id: {$exists: true}}).lean();

			if (!token) 
				return res.status(404).send({error: "Token not found"});
			
			// var current_user = await Tokens.findOne({_id: req.user.id});
			// current_user.following.push(user_id);
			// await current_user.save();
			var mode = req.path.split("/").pop();
			var query = {};

			if (mode == "like") query = {$addToSet: {likes: req.user.id}};
			if (mode == "unlike") query = {$pull: {likes: req.user.id}};

			var update = await Tokens.updateOne({_id: token_id}, query);

			if (!update.n || !update.nModified)
				return res.status(404).send({error: "Already done"});
			
			if (mode == "like") {
				await Activities.create({
					type: "liked",
					user: req.user.id,
					token: token_id
				});
			}
			if (mode == "unlike") {
				await Activities.deleteOne({
					type: "liked",
					user: req.user.id,
					token: token_id
				});
			}

			res.send({message: "Success"});
		}
		catch(error) {
			console.log("Token like error", error);
			res.status(500).send({error: "Server error"});
		}
	}
};

module.exports = Controller;