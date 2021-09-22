const Users = require("../models/users");
const Offers = require("../models/offers");
const Tokens = require("../models/tokens");
const Activities = require("../models/activities");
const mongoose = require("mongoose");
const helpers = require("../helpers");

const Controller = {
	async searchUser(req, res) {
		try {
			if (!Object.keys(req.body).length) 
				return res.status(422).send({error: "No one search params"});

			var { name, verified, bio } = req.body;

			var query = {};

			if (name) query.name = new RegExp(name, "gi");
			if (bio) query.bio = new RegExp(bio, "gi");
			if (verified) query.verified = verified;

			var paginator_data = await helpers.paginator(req.query.page, query, Users);
			var pagination = paginator_data.info;

			var users = await Users.find(query, "+wallet")
				.sort({date_create: -1})
				.limit(20)
				.skip(paginator_data.skip)
				.lean();

			res.send({users, ...pagination});
		}
		catch(error) {
			console.log("Users search error", error);
			res.status(500).send({error: "Server error"});
		}
	},


	async getOneUser(req, res) {
		try {
			var user_id = req.params.id;
			var is_wallet = !mongoose.Types.ObjectId.isValid(user_id);

			var query = {};

			if (is_wallet) {
				query = {
					$or: [
						{ wallet: user_id },
						{ link: user_id }
					]
				};
			}
			else {
				query = {_id: user_id};
			}
		
			var user = await Users.findOne(query, "+wallet +following +bio +twitter +instagram").lean();

			if (!user) 
				return res.status(404).send({error: "User not found"});

			if (is_wallet) 
				user_id = user._id;

			var stats = {
				on_sale: 0,
				collectibles: 0,
				created: 0,
				liked: 0,
				activity: 0,
				following: 0,
				followers: 0,
				royalties: 0
			};

			stats.on_sale = await Offers.countDocuments({creator: user_id, status: "pending"});
			stats.collectibles = await Tokens.countDocuments({"owners.0.user": user_id, chain_id: {$exists: true}});
			stats.created = await Tokens.countDocuments({creator: user_id, chain_id: {$exists: true}});
			stats.activity = await Activities.countDocuments({user: user_id});
			stats.following = user.following ? user.following.length : 0;
			stats.followers = await Users.countDocuments({following: user_id});
			stats.liked = await Tokens.countDocuments({likes: user_id, chain_id: {$exists: true}});
			stats.royalties = await Tokens.countDocuments({creator: user_id, chain_id: {$exists: true}});

			if (req.user) {
				if (req.user.id == user_id) {
					user.followed = false;
				}
				else {
					var current_user = await Users.findOne({_id: req.user.id}, "following");
					user.followed = current_user.following.includes(user_id);
				}
			}
			else {
				user.followed = false;
			}

			delete user.following;

			res.send({user, stats});
		}
		catch(error) {
			console.log("User get one error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async getUserItems(req, res) {
		try {
			var user_id = req.params.id;
			var type = req.params.type;
			var items = [];
			var pagination = {};

			var is_wallet = !mongoose.Types.ObjectId.isValid(user_id);
		
			var user = await Users.findOne(is_wallet ? {wallet: user_id} : {_id: user_id}, "_id following royalties").exec();
			
			if (!user) 
				return res.status(404).send({error: "User not found"});

			if (is_wallet) 
				user_id = user._id;

			if (!mongoose.Types.ObjectId.isValid(user_id))
				return res.status(422).send({error: "Bad user id"});

			switch(type) {
				case "on_sale": {
					var query = {creator: user_id, status: "pending"};
					var paginator_data = await helpers.paginator(req.query.page, query, Offers);
					pagination = paginator_data.info;

					items = await Offers.find(query)
						.sort({date_create: -1})
						.skip(paginator_data.skip)
						.limit(20)
						.populate({
							path: "token",
							select: "+likes",
							populate: ["categories", "collections", "creator"]
						})
						.lean();
						
					helpers.calcLikesArray(items, req.user);	
						
					break;
				}

				case "collectibles": {
					var query = {"owners.0.user": user_id, chain_id: {$exists: true}};
					var paginator_data = await helpers.paginator(req.query.page, query, Tokens);
					pagination = paginator_data.info;

					items = await Tokens.find(query, "+likes")
						.sort({date_create: -1})
						.skip(paginator_data.skip)
						.limit(20)
						.populate("collections")
						.populate("categories")
						.populate("creator", "+wallet")
						.lean();
					
					for (var token of items) {
						token.offer = await Offers.findOne({status: "pending", token: token._id}).sort({date_create: -1}).lean();
					}
					
					helpers.calcLikesArray(items, req.user);

					break;
				}

				case "created": {
					var query = {creator: user_id, chain_id: {$exists: true}};
					var paginator_data = await helpers.paginator(req.query.page, query, Tokens);
					pagination = paginator_data.info;

					items = await Tokens.find(query, "+likes")
						.sort({date_create: -1})
						.skip(paginator_data.skip)
						.limit(20)
						.populate("collections")
						.populate("categories")
						.populate("creator", "+wallet")
						.lean();
					
					for (var token of items) {
						token.offer = await Offers.findOne({status: "pending", token: token._id}).sort({date_create: -1}).lean();
					}
					
					helpers.calcLikesArray(items, req.user);
					
					break;
				}

				case "activity": {
					var query = {user: user_id};
					var paginator_data = await helpers.paginator(req.query.page, query, Activities);
					pagination = paginator_data.info;
					
					items = await Activities.find(query)
						.sort({date: -1})
						.limit(20)
						.skip(paginator_data.skip)
						.populate("user", "+wallet")
						.populate("to_user", "+wallet")
						.populate("token")
						.populate("offer")
						.lean();

					break;
				}

				case "following": {
					var users = user.following.map(u => u._id);
					var query = {_id: {$in: users}};
					var paginator_data = await helpers.paginator(req.query.page, query, Users);
					pagination = paginator_data.info;

					items = await Users.find(query, "+wallet")
						.sort({date_create: -1})
						.limit(20)
						.skip(paginator_data.skip)
						.lean()

					break;
				}

				case "followers": {
					var query = {following: user_id};
					var paginator_data = await helpers.paginator(req.query.page, query, Users);
					pagination = paginator_data.info;

					items = await Users.find(query, "+wallet")
						.sort({date_create: -1})
						.limit(20)
						.skip(paginator_data.skip)
						.lean()
						
					break;
				}

				case "liked": {
					var query = {likes: user_id, chain_id: {$exists: true}};
					var paginator_data = await helpers.paginator(req.query.page, query, Tokens);
					pagination = paginator_data.info;

					items = await Tokens.find(query, "+likes")
						.sort({date_create: -1})
						.limit(20)
						.skip(paginator_data.skip)
						.populate("collections")
						.populate("categories")
						.populate("creator", "+wallet")
						.lean();
					
					for (var token of items) {
						token.offer = await Offers.findOne({status: "pending", token: token._id}).sort({date_create: -1}).lean();
					}
					
					helpers.calcLikesArray(items, req.user);
					
					break;
				}

				case "royalties": {
					var tokens = await Tokens.countDocuments({creator: user_id, chain_id: {$exists: true}});
					var royalties = user.royalties || 0;
					
					return res.send({type, tokens, royalties});
				}
			}

			res.send({type, items, ...pagination});
		}
		catch(error) {
			console.log("User get items error", error);
			res.status(500).send({error: "Server error"});
		}
	},


	async getUserSettings(req, res) {
		try {
			var user_id = req.user.id;
	
			var user = await Users.findOne({_id: user_id}, "+wallet +email +bio +twitter +instagram").lean();

			if (!user) 
				return res.status(404).send({error: "User not found"});

			res.send({user});
		}
		catch(error) {
			console.log("User get current error", error);
			res.status(500).send({error: "Server error"});
		}
	},


	async updateUserSettings(req, res) {
		try {
			var { name, email, bio, twitter, instagram, link } = req.body;
			var set = {};

			if (name !== undefined) set.name = name;
			if (email !== undefined) set.email = email;
			if (bio !== undefined) set.bio = bio;
			if (twitter !== undefined) set.twitter = twitter;
			if (instagram !== undefined) set.instagram = instagram;
			if (link !== undefined) set.link = link;

			if (!Object.keys(set).length && !req.files)
				return res.status(422).send({error: "Nothing to update"});
			
			if (req.files && req.files.avatar) {
				set.avatar = await helpers.uploadFile(req.files.avatar, req.user.id, "content/avatar");
			}

			var update = await Users.updateOne({_id: req.user.id}, set);
			if (!update || !update.nModified)
				return res.status(422).send({error: "Nothing was updated"});
			
			res.send({message: "Settings updated"});
		}
		catch(error) {
			console.log("User update settings error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async updateFeatured(req, res) {
		try {
			var { featured_name, featured_price } = req.body;
			var set = {};

			if (featured_name !== undefined) set.featured_name = featured_name;
			if (featured_price !== undefined) set.featured_price = featured_price;

			var update = await Users.updateOne({_id: req.user.id}, set);
			if (!update || !update.nModified)
				return res.status(422).send({error: "Nothing was updated"});
			
			res.send({message: "Featured updated"});
		}
		catch(error) {
			console.log("User update featured error", error);
			res.status(500).send({error: "Server error"});
		}
	},


	async verifyUser(req, res) {
		try {
			var update = await Users.updateOne({_id: req.user.id}, {verified: true});
			if (!update || !update.nModified)
				return res.status(422).send({error: "Verification error"});
			
			res.send({message: "Verified"});
		}
		catch(error) {
			console.log("User verification error", error);
			res.status(500).send({error: "Server error"});
		}
	},


	async changeCoverImage(req, res) {
		try {
			var user_id = req.user.id;

			if (req.files && req.files.image) {
				var cover = await helpers.uploadFile(req.files.image, req.user.id, "content/cover");
				var update = await Users.updateOne({_id: user_id}, { $set: {cover} }).exec();

				res.send({message: "Cover updated"});
			}
			else {
				var update = await Users.updateOne({_id: user_id}, {$unset: {cover: true}}).exec();

				if (!update || !update.nModified) {
					return res.status(422).send({error: "Nothing was updated"});
				}

				res.send({message: "Cover removed"});
			}
		}
		catch(error) {
			console.log("User update cover error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async changeFeaturedImage(req, res) {
		try {
			var user_id = req.user.id;

			if (req.files && req.files.image) {
				var featured = await helpers.uploadFile(req.files.image, req.user.id, "content/cover");
				var update = await Users.updateOne({_id: user_id}, { $set: {featured} }).exec();

				res.send({message: "Featured Image updated"});
			}
			else {
				var update = await Users.updateOne({_id: user_id}, {$unset: {featured: true}}).exec();

				if (!update || !update.nModified) {
					return res.status(422).send({error: "Nothing was updated"});
				}

				res.send({message: "FeaturedImage removed"});
			}
		}
		catch(error) {
			console.log("User update featuredImage error", error);
			res.status(500).send({error: "Server error"});
		}
	},


	async getTopUsers(req, res) {
		try {
			var type = req.params.type;
			var days = req.query.days;

			if (!["sellers", "buyers"].includes(type))
				return res.status(422).send({ error: "Bad type of user" });

			if (!type || Number(days) == NaN)
				return res.status(422).send({ error: "Bad params" });

			if (!days || days > 30)
				days = 30;

			var query = {};
			var date = new Date();
			date.setDate(date.getDate() - days);

			// query.status = "completed";
			// query.date_create = { $gte: date };
			query.buyers = {
				$elemMatch: {
					date: { $gte: date }
				}
			};

			var offers = await Offers.find(query)
				.populate("creator", "wallet name avatar cover verified")
				.populate("buyers.user", "wallet name avatar cover verified")
				.lean();

			var users = [];

			for (var offer of offers) {
				for (var buyer of offer.buyers) {
					if (type == "sellers") var user = offer.creator;
					if (type == "buyers") var user = buyer.user;

					var sum = (buyer.price * (buyer.copies || 1));
					var finded_user = users.find(u => String(u._id) == String(user._id));

					if (finded_user) {
						finded_user.amount += sum;
					}
					else {
						user.amount = sum;
						users.push(user);
					}
				}
			}

			users.forEach(user => {
				user.amount = Number(user.amount.toFixed(4));
			});

			users.sort((a, b) => {
				return b.amount - a.amount;
			});

			if (users.length > 50)
				users = users.splice(0, 50);

			res.send({ users });
		}
		catch (error) {
			console.log("Users tops error", error);
			res.status(500).send({ error: "Server error" });
		}
	},

	async toggleFollow(req, res) {
		try {
			var user_id = req.params.id;

			if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) 
				return res.status(422).send({error: "Bad user id"});
			
			if (user_id == req.user.id) 
				return res.status(403).send({error: "You cannot follow to yourself"});

			var user = await Users.findOne({_id: user_id}).lean();

			if (!user) 
				return res.status(404).send({error: "User not found"});
			
			// var current_user = await Users.findOne({_id: req.user.id});
			// current_user.following.push(user_id);
			// await current_user.save();
			var mode = req.path.split("/").pop();
			var query = {};

			if (mode == "follow") query = {$addToSet: {following: user_id}};
			if (mode == "unfollow") query = {$pull: {following: user_id}};

			var update = await Users.updateOne({_id: req.user.id}, query);

			if (!update.n || !update.nModified)
				return res.status(404).send({error: "Already done"});

			if (mode == "follow") {
				await Activities.create({
					type: "following",
					user: req.user.id,
					to_user: user_id
				});
			}
			if (mode == "unfollow") {
				await Activities.deleteOne({
					type: "following",
					user: req.user.id,
					to_user: user_id
				});
			}

			res.send({message: "Success"});
		}
		catch(error) {
			console.log("User following error", error);
			res.status(500).send({error: "Server error"});
		}
	}
};

module.exports = Controller;
