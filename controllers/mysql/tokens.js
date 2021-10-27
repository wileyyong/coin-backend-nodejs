const { Collections, Tokens, Offers, Activities, Users, Categories } = require("../../models/mysql/sequelizer");
const helpers = require("../../helpers_mysql");
const { Op } = require("sequelize");

const Controller = {
	async getAllTokens(req, res) {
		console.log('getAllTokens');
		try {
			var where = {
				chain_id: {
					[Op.not]: null
				}
			};
			var paginator_data = await helpers.paginator(req.query.page, {where}, Tokens);
			var pagination = paginator_data.info;

			var tokens = await Tokens.findAll({
				where,
				limit: 20,
				skip: paginator_data.skip,
				order: [['date_create', 'DESC']],
				include: [
					{
						model: Collections,
						as: 'collections'
					},
					{
						model: Users,
						as: 'creator'
					}
				]
			});
			tokens = await Promise.all(tokens.map(async (t) => {
				var token = t.get({plain: true});
				token.properties = token.properties;
				var cats = await Categories.findAll({
					where: {_id: token.categories}
				});
				return {
					...token,
					categories: cats
				};
			}));

			tokens = await Promise.all(tokens.map(async (token) => {
				if (token.owners) {
					var owners = token.owners;
					owners = owners.map(async (owner) => {
						var user = await Users.findOne({
							where: {_id: owner.user}
						});
						return {
							...owner,
							user
						};
					})
					return {
						...token,
						owners
					};
				}
				return token;
			}));
			helpers.calcLikesArray(tokens, req.user);

			res.send({tokens, ...pagination});
		}
		catch(error) {
			console.log("Token get all error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	
	async getMyTokens(req, res) {
		console.log('getMyTokens');
		try {
			var where = {
				[Op.or]: [
					{creatorId: req.user.id},
					{"owners.0.user": req.user.id}
				],
				chain_id: {
					[Op.not]: null
				}
			};

			var paginator_data = await helpers.paginator(req.query.page, {where}, Tokens);
			var pagination = paginator_data.info;

			var tokens = await Tokens.findAll({
				where,
				limit: 20,
				skip: paginator_data.skip,
				order: [['date_create', 'DESC']],
				include: [
					{
						model: Collections,
						as: 'collections'
					},
					{
						model: Users,
						as: 'creator'
					}
				]
			});
			tokens = await Promise.all(tokens.map(async (t) => {
				var token = t.get({plain: true});
				token.properties = token.properties;
				var cats = await Categories.findAll({
					where: {_id: token.categories}
				});
				return {
					...token,
					categories: cats
				};
			}));

			tokens = await Promise.all(tokens.map(async (token) => {
				if (token.owners) {
					var owners = token.owners;
					owners = owners.map(async (owner) => {
						var user = await Users.findOne({
							where: {_id: owner.user}
						});
						return {
							...owner,
							user
						};
					})
					return {
						...token,
						owners
					};
				}
				return token;
			}));
			// .populate("owners.user")

			helpers.calcLikesArray(tokens, req.user);

			res.send({tokens, ...pagination});
		}
		catch(error) {
			console.log("Token get my error", error);
			res.status(500).send({error: "Server error"});
		}
	},


	async getTokenInfo(req, res) {
		console.log('getTokenInfo');
		try {
			var token_id = req.params.id;
			var where = {
				_id: token_id, 
				chain_id: {
					[Op.not]: null
				}
			};
			var token = await Tokens.findOne({
				where,
				include: [
					{
						model: Collections,
						as: 'collections'
					},
					{
						model: Users,
						as: 'creator'
					}
				]
			});
			if (!token) 
				return res.status(404).send({error: "Token not found"});

			token.properties = token.properties;
			var cats = await Categories.findAll({
				where: {_id: token.categories}
			});
			token.categories = cats;

			if (token.owners) {
				let owners = [];
				owners = await Promise.all(token.owners.map(async (owner) => {
					var user = await Users.findOne({
						where: {_id: owner.user}
					});
					return {
						...owner,
						user,
					};
				}));
				token.owners = owners;
			}
			// .populate("owners.user")
			
			helpers.calcLikes(token, req.user);

			var offer = await Offers.findOne({
				where: {
					tokenId: token_id
				},
				order: [['date_create', 'DESC']],
				include: [
					{
						model: Users,
						as: 'creator'
					},
					{
						model: Users,
						as: 'buyer'
					},

				]
			});
			// .populate("bids.user", "+wallet")
			if (offer) {
				if (offer.bids) {
					var bids = offer.bids;
					bids = await Promise.all(bids.map(async (bid) => {
						var user = await Users.findOne({
							where: {_id: bid.user}
						});
						return {
							...bid,
							user
						}
					}));
					offer.bids = bids;
				}
			}
			var history = await Activities.findAll({
				where: {
					tokenId: token_id
				},
				order: [['date', 'DESC']],
				include: [
					{
						model: Users,
						as: 'user'
					},
					{
						model: Users,
						as: 'to_user'
					},
					{
						model: Offers,
						as: 'offer'
					},
					{
						model: Tokens,
						as: 'token'
					},
				]
			})
			var ret = {token, offer, history};
			res.send(ret);
		}
		catch(error) {
			console.log("Token get error", error);
			res.status(500).send({error: "Server error"});
		}
	},


	async getTokenJson(req, res) {
		console.log('getTokenJson');
		try {
			var token_id = req.params.id;
			var token = await Tokens.findOne({
				where: {_id: token_id}
			});

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
		if (!req.files || !req.files.media) 
			return res.status(422).send({error: "Image or other media is required"});

		try {
			var token_data = {
				name,
				royalties,
				categories: categories?.split("|"), // Todo: Add categories check exists
				owners: [{user: req.user.id}],
				creatorId: req.user.id,
				offchain: offchain || false,
			};
			var token = await Tokens.create(token_data);
			var media = await helpers.uploadFile(req.files.media, token._id, "content/media");

			// var set = {};
			token.media = media;
			
			if (req.files.thumbnail) {
				var thumbnail = await helpers.uploadFile(req.files.thumbnail, token._id, "content/thumbnail");
				token.thumbnail = thumbnail;
			}

			if (locked) token.locked = locked;
			if (description) token.description = description;
			if (properties) token.properties = properties;
			if (collection && !helpers.isNot(collection)) token.collectionsId = collection;
			await token.save();
			res.send({message: "Token created", token, link: `/api/tokens/${token._id}.json`});
			Activities.create({
				type: "minted",
				userId: req.user.id,
				tokenId: token._id
			});
		}
		catch(error) {
			console.log("Token create error", error);
			res.status(500).send({error: "Token creation error"});
		}
	},


	async setTokenChainId(req, res) {
		console.log('setTokenChainId', req.body.chain_id, req.params.id);
		try {
			var token_id = req.params.id;
			var chain_id = req.body.chain_id;
			console.log(chain_id);
			if (!token_id || !chain_id) 
				return res.status(422).send({error: "Not all fields has filled"});

			var token = await Tokens.findOne({
				where: {_id: token_id}
			});

			if (!token) 
				return res.status(404).send({error: "Token not found"});
			
			if (req.user.id != token.creatorId) 
				return res.status(403).send({error: "Forbidden"});
			token.chain_id = chain_id;
			token.save();
			res.send({message: "Success changed"});
		}
		catch(error) {
			console.log("Token set chain error", error);
			res.status(500).send({error: "Token set chain_id error"});
		}
	},


	async deleteToken(req, res) {
		console.log('deleteToken');
		try {
			var _id = req.params.id;

			var token = await Tokens.findOne({
				where: {_id}
			});
			if (!token) 
				return res.status(404).send({error: "Token not found"});
			
			if (req.user.id != token.creatorId) 
				return res.status(403).send({error: "Forbidden"});
			
			await Tokens.destroy({
				where: {_id}
			});
			await Offers.destroy({
				where: {
					tokenId: _id
				}
			});
			await Activities.destroy({
				where: {tokenId: _id}
			});

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

			if (!token_id) // || !mongoose.Types.ObjectId.isValid(token_id)
				return res.status(422).send({error: "Bad token id"});

			var token = await Tokens.findOne({
				where: {
					_id: token_id
				}
			});

			if (!token) 
				return res.status(404).send({error: "Token not found"});
			
			// var current_user = await Tokens.findOne({_id: req.user.id});
			// current_user.following.push(user_id);
			// await current_user.save();
			var mode = req.path.split("/").pop();

			var set = {};
			if (mode == "like") set = {likes: token.likes.push(req.user.id)};
			if (mode == "unlike") set = {likes: token.likes.filter((id) => id != req.user.id)};

			var update = await Tokens.updateOne(
				set, 
				{
					where: {_id: token_id}
				}
			);

			if (!update || update == [0])
				return res.status(404).send({error: "Already done"});
			
			if (mode == "like") {
				await Activities.create({
					type: "liked",
					userId: req.user.id,
					tokenId: token_id
				});
			}
			if (mode == "unlike") {
				await Activities.deleteOne({
					type: "unliked",
					userId: req.user.id,
					tokenId: token_id
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