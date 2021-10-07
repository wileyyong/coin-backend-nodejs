const mongoose = require("mongoose");
const moment = require("moment");

const Offers = require("../models/offers");
const Tokens = require("../models/tokens");
const Activities = require("../models/activities");
const Users = require("../models/users");

const helpers = require("../helpers");


const Controller = {
	async createOffer(req, res) {
		try {
			var { token_id, offer_price, min_bid, expiry_date } = req.body;

			if ("offer_price" in req.body) offer_price = Number(offer_price);
			if ("min_bid" in req.body) min_bid = Number(min_bid);

			if (offer_price == NaN || min_bid == NaN)
				return res.status(422).send({error: "Bad offer_price or min_bid"});

			var token = await Tokens.findOne({_id: token_id});

			if (!token) 
				return res.status(404).send({error: "Token not found"});
			
			if (req.user.id != String(token.owners[0].user)) 
				return res.status(403).send({error: "Token is not yours"});
			
			if (!token.chain_id)
				return res.status(403).send({error: "Token without chain_id"});
			
			var offer_exists = await Offers.countDocuments({token: token_id, status: "pending"}).lean();
			if (offer_exists)
				return res.status(403).send({error: "Offer for this token is already on sale"});

			var offer_data = {
				type: "both",
				token: token_id,
				creator: req.user.id,
				categories: token.categories
			};

			if (min_bid && offer_price) offer_data.type = "both";
			else if (min_bid && !offer_price) offer_data.type = "auction";
			else if (!min_bid && offer_price) offer_data.type = "direct";
			else return res.status(422).send({error: "Bad type of offer"});

			if (min_bid) {
				if (!expiry_date || new Date() > new Date(expiry_date)) {
					return res.status(422).send({error: "Bad expiry date"});
				}

				expiry_date = new Date(expiry_date);
				offer_data.min_bid = min_bid;
				offer_data.date_end = expiry_date;
			}

			if (offer_price) {
				offer_data.offer_price = offer_price;
			}

			if (token.owners.length == 1) {
				token.owners[0].price = offer_data.min_bid || offer_data.offer_price;
				await token.save();
			}

			var offer = await Offers.create(offer_data);
			res.send({message: "Offer created", offer});

			Activities.create({
				type: "listed",
				user: req.user.id,
				offer: offer._id,
				token: offer.token,
				price: offer_price || min_bid
			});
		}
		catch(error) {
			console.log("Offer creating error", error);
			res.status(500).send({error: "Offer creating error"});
		}
	},


	async getAuctions(req, res) {
		try {
			var type = req.params.type;
			var current_date = Date.now();
			var name = req.params.name || '';

			if (mongoose.Types.ObjectId.isValid(type)) {
				var offer = await Offers.findOne({_id: type})
					.populate("creator", "+wallet")
					.populate("bids.user", "+wallet")
					.populate({
						path: "token",
						select: "+likes",
						populate: ["categories", "creator", "owners.user", "collections"]
					})
					.lean();

				if (!offer)
					return res.status(404).send({error: "Offer not found"});
				
				if (offer.token) helpers.calcLikes(offer, req.user);
				
				var history = await Activities.find({$or: [{token: offer.token._id}, {offer: offer._id}]})
					.sort({date: -1})
					.populate("user", "+wallet")
					.populate("to_user", "+wallet")
					.populate("token", "name media thumbnail")
					.populate("offer")
					.lean();
					
				res.send({offer, history});
			}
			else {
				var { category } = req.query;
				var query = {};
				var sort = {};
				var sort_type = req.query.sort;

				if (type == "explore") {
					// if (max_skip > 100) {
					// 	var rest = max_skip - 100;
					// 	skip = helpers.randomRange(0, rest);
					// }

					if (sort_type == "recent")
						sort = {date_create: -1};
				}

				if (type == "live") {
					query = {
						type: {$in: ["auction", "both"]},
						date_start: {$lte: current_date},
						date_end: {$gte: current_date}
					};

					sort = {date_start: -1};
				}

				if (type == "new") {
					query = {
						type: {$in: ["auction", "both"]},
						date_create: {$lte: current_date},
					}

					sort = {date_create: -1};
				}
				

				if (category) {
					query.categories = {$all: [category]};
				}

				query.status = "pending";

				var paginator_data = await helpers.paginator(req.query.page, query, Offers);
				var pagination = paginator_data.info;

				var offers = await Offers.find(query)
					.sort(sort)
					.skip(paginator_data.skip)
					.limit(20)
					.populate("creator", "+wallet")
					.populate("bids.user", "+wallet")
					.populate({
						path: "token",
						select: "+likes",
						populate: ["owners.user", "collections", "categories"]
					})
					.lean();
				helpers.calcLikesArray(offers, req.user);

				if (name) {
					offers.filter(auction => auction.token.name.includes(name));
				}
				
				if (sort_type == "costly") {
					offers.sort((a, b) => {
						var price1 = helpers.getOfferMinPrice(a);
						var price2 = helpers.getOfferMinPrice(b);

						return price2 - price1;
					});
				}
				if (sort_type == "cheap") {
					offers.sort((a, b) => {
						var price1 = helpers.getOfferMinPrice(a);
						var price2 = helpers.getOfferMinPrice(b);

						return price1 - price2;
					});
				}
				if (sort_type == "liked") {
					offers.sort((a, b) => {
						return b.token.likes - a.token.likes;
					});
				}
					
				res.send({offers, ...pagination});
			}

		}
		catch(error) {
			console.log("Auction get all error", error);
			res.status(500).send({error: "Server error"});
		}
	},


	async addBid(req, res) {
		try {
			var { price, hash } = req.body;

			if (!price || !hash)
				return res.status(422).send({error: "Not all fields has filled"});

			var offer = await Offers.findOne({_id: req.params.id, type: {$in: ["auction", "both"]}});

			if (!offer)
				return res.status(404).send({error: "Auction not found"});

			if (offer.bids.length && offer.bids[0].price >= price && price <= min_bid) {
				return res.status(422).send({message: "Bid is less or equal than the previous one"});
			}
			else {
				offer.bids.unshift({
					user: req.user.id,
					hash,
					price
				});

				await offer.save();
				res.send({message: "Success bidding"});
			}

			Activities.create({
				type: "offered",
				user: req.user.id,
				offer: offer._id,
				token: offer.token,
				price
			});
		}
		catch(error) {
			console.log("Auction bid error", error);
			res.status(500).send({error: "Server error"});
		}
	},


	async buyDirectOffer(req, res) {
		try {
			var { price, hash } = req.body;

			if (!price || !hash)
				return res.status(422).send({error: "Not all fields has filled"});

			var offer = await Offers.findOne({_id: req.params.id, type: {$in: ["direct", "both"]}});

			if (!offer || !offer.offer_price)
				return res.status(404).send({error: "Auction not found"});
			
			if (offer.offer_price > price)
				return res.status(422).send({message: "Your price is less than the minimum offer price", offer_price: offer.offer_price});
				
			var token = await Tokens.findOne({_id: offer.token});
			
			offer.status = "completed";
			offer.buyer = req.user.id;
			offer.date_sell = Date.now();
			offer.purchase_type = "direct";
			// offer.bids.unshift({
			// 	user: req.user.id,
			// 	hash,
			// 	price
			// });

			token.owners.unshift({
				user: req.user.id,
				price
			});

			await offer.save();
			await token.save();
			
			res.send({message: "Success buyed"});

			Activities.create({
				type: "purchased",
				user: req.user.id,
				offer: offer._id,
				token: offer.token,
				price
			});

			Controller.giveRoyalties(offer, token);
		}
		catch(error) {
			console.log("Auction buy error", error);
			res.status(500).send({error: "Server error"});
		}
	},


	async searchOffers(req, res) {
		try {
			if (!Object.keys(req.body).length) 
				return res.status(422).send({error: "No one search params"});

			var { name, date_start, date_end, price_min, price_max, sort, verified, categories } = req.body;
			var pagination = {};
			var sort_data = {};

			var query = {status: "pending"};

			if (name) {
				var tokens = await Tokens.find({name: new RegExp(name, "gi")}).lean();
				var tokens_id = tokens.map(t => t._id);
				query.token = {$in: tokens_id};
			}

			if (categories && Array.isArray(categories)) {
				query.categories = {$all: categories};
			}

			if (date_start || date_end) query.date_create = {};
			if (date_start) query.date_create.$gte = date_start;
			if (date_end) query.date_create.$lte = date_end;

			if (sort == "recent") {
				sort_data = {date_create: -1};
			}

			var paginator_data = await helpers.paginator(req.query.page, query, Offers);
			pagination = paginator_data.info;

			var offers = await Offers.find(query)
				.sort(sort_data)
				.limit(20)
				.skip(paginator_data.skip)
				.populate({
					path: "token",
					select: "+likes",
					populate: ["collections", "categories", "owners.user"]
				})
				.populate("creator", "+wallet")
				.populate("categories")
				.lean();
			
			offers = offers.filter(offer => {
				if (verified && !offer.creator.verified) 
					return false;

				// if (date_create) {
				// 	var needed = moment(date_create);
				// 	var create = moment(offer.date_create.toISOString().substr(0, 10));
				// 	if (create != needed) return false;
				// }

				var price = helpers.getOfferMinPrice(offer);

				if (price_min && price < price_min) return false;
				if (price_max && price > price_max) return false;
				
				helpers.calcLikes(offer);
				return true;
			});

			if (sort == "costly") {
				offers.sort((a, b) => {
					var price1 = helpers.getOfferMinPrice(a);
					var price2 = helpers.getOfferMinPrice(b);

					return price2 - price1;
				});
			}
			if (sort == "cheap") {
				offers.sort((a, b) => {
					var price1 = helpers.getOfferMinPrice(a);
					var price2 = helpers.getOfferMinPrice(b);

					return price1 - price2;
				});
			}
			// if (sort == "recent") {
			// 	offers.sort((a, b) => {
			// 		return b.date_create - a.date_create;
			// 	});
			// }
			if (sort == "liked") {
				offer.sort((a, b) => {
					return b.token.likes.length - a.token.likes.length;
				});
			}

			if (offers.length > 50)
				offers = offers.splice(0, 50);

			res.send({offers, ...pagination});

		}
		catch(error) {
			console.log("Token search error", error);
			res.status(500).send({error: "Server error"});
		}
	},


	async giveRoyalties(offer, token) {
		if (offer.purchase_type == "direct") {
			var price = offer.offer_price;
		}
		else {
			var price = offer.bids[0].price;
		}

		var user = await Users.findOne({_id: token.creator}, "royalties");

		var sum = price * (token.royalties / 100);
		var new_royalties = Number( (user.royalties + sum).toFixed(5) );

		user.royalties = new_royalties;
		await user.save();
	}
};


module.exports = Controller;