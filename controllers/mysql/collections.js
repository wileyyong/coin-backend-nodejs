const {Collections, Tokens, Offers, Users, Categories} = require("../../models/mysql/sequelizer");
const helpers = require("../../helpers_mysql");
const { Op } = require("sequelize");

const Controller = {
	async getCollections(req, res) {
		try {
			var type = req.query.type;
			var where = {}
			var paginator_data = await helpers.paginator(req.query.page, {where}, Collections);
			var pagination = paginator_data.info;

			var collections = await Collections.findAll({
				where,
				limit: 20,
				skip: paginator_data.skip,
				order: [['date_create', 'DESC']],
				include: [
					{
						model: Users,
						as: 'creator'
					}
				]
			})
			// .populate("creator", "+wallet")
				
			res.send({collections, ...pagination});
		}
		catch(error) {
			console.log("Collection get all error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async getOneCollection(req, res) {
		try {
			var _id = req.params.id;

			var collection = await Collections.findOne({
				where: {
					_id
				},
				include: [
					{
						model: Users,
						as: 'creator'
					}
				]
			})
			
			if (!collection)
				return res.status(404).send({error: "Collection not found"});
			
			var stats = {
				on_sale: 0,
				owned: 0
			};

			var tokens = await Tokens.findAll({
				where: {
					collectionsId: _id,
					// chain_id: {
					// 	[Op.not]: null
					// }
				}
			});
			var tokens_array = tokens.map(t => t._id);

			stats.on_sale = await Offers.count({
				where: {
					status: "pending",
					tokenId: tokens_array
				}
			});
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
			var _id = req.params.id;
			var type = req.params.type;
			var items = [];
			var pagination = {};

			if (!type || !["on_sale", "owned"].includes(type))
				return res.status(422).send({error: "Bad type of items"});

			if (type == "on_sale") {
				var tokens = await Tokens.findAll({
					where: {
						collectionsId: _id
					}
				});
				tokens = tokens.map(t => t._id);

				var where = {
					status: "pending",
					tokenId: tokens
				};
				var paginator_data = await helpers.paginator(req.query.page, {where}, Offers);
				pagination = paginator_data.info;

				items = await Offers.findAll({
					where,
					limit: 20,
					skip: paginator_data.skip,
					order: [['date_create', 'DESC']],
					include: [
						{
							model: Users,
							as: 'creator'
						},
					  	{
							model: Tokens,
							as: 'token',
					  	},
					],
				});
				items = items.map(async (item) => {
					var categories = await Categories.findAll({
						where: {
							_id: item.token.categories
						}
					});
					return {
						...item,
						token: {
							...item.token,
							categories
						}
					};
				});
			}

			if (type == "owned") {
				var where = {
					collectionsId: _id
				};
				var paginator_data = await helpers.paginator(req.query.page, {where}, Tokens);
				pagination = paginator_data.info;

				items = await Tokens.findAll({
					where,
					limit: 20,
					skip: paginator_data.skip,
					order: [['date_create', 'DESC']],
					include: [
						{
							model: Users,
							as: 'creator'
						}
					]
				});
				items = items.map(async (item) => {
					var categories = await Categories.findAll({
						where: {
							_id: item.categories
						}
					});
					return {
						...item,
						categories
					};
				});
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
			var collections = await Collections.findAll({
				where: {
					creatorId: user_id
				},
				order: [['date_create', 'DESC']],
				include: [
					{
						model: Users,
						as: 'creator'
					}
				]
			});

			res.send({collections});
		}
		catch(error) {
			console.log("Collection get my error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async createCollection(req, res) {
		try {
			var { name, symbol, description, short } = req.body;
			var creatorId = req.user.id;
			var collection = {name, creatorId, symbol, description, short};

			if (req.files) {
				if (!name) return res.status(422).send({error: "Not all fields has filled"});

				collection = await Collections.create(collection);

				if (req.files.image) {
					var image = await helpers.uploadFile(req.files.image, collection._id, "content/collection");
					collection.image = image;
				}
				if (req.files.cover) {
					var cover = await helpers.uploadFile(req.files.cover, collection._id, "content/cover");
					collection.cover = cover;
				}
			}
			await collection.save();
			// var update = await Collections.update(
			// 	collection,
			// 	{
			// 		where: {_id: collection._id}
			// 	}
			// );
			collection = await Collections.findOne({
				where: {_id: collection._id},
				include: [
					{
						model: Users,
						as: 'creator'
					}
				]
			});
			res.send({message: "Collection success created", collection});
		}
		catch(error) {
			console.log("Collection create error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async deleteCollection(req, res) {
		try {
			var _id = req.params.id;

			var collection = await Collections.findOne({
				where: {_id}
			});
			if (!collection) 
				return res.status(404).send({error: "Collection not found"});
			
			if (collection.creatorId != req.user.id) 
				return res.status(403).send({error: "Forbidden"});
			
			await Collections.destroy({
				where: {_id}
			});
			await Tokens.update(
				{collectionsId: null},
				{
					where: {
						collectionsId: _id
					}
				}
			);

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
			var where = {};

			if (name) where.name = {
				[Op.regexp]: name
			};
			if (description) where.description = {
				[Op.regexp]: description
			};
			if (date_from) where.date_create = {
				[Op.gte]: date_from
			};
			var paginator_data = await helpers.paginator(req.query.page, {where}, Collections);
			var pagination = paginator_data.info;

			var collections = await Collections.findAll({
				where,
				limit: 20,
				skip: paginator_data.skip,
				order: [['date_create', 'DESC']],
				include: [
					{
						model: Users,
						as: 'creator'
					}
				]
			})

			res.send({collections, ...pagination});
		}
		catch(error) {
			console.log("Collection search error", error);
			res.status(500).send({error: "Server error"});
		}
	}
};

module.exports = Controller;