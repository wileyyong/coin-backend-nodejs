const { Op, Sequelize } = require("sequelize");
const {Users, Offers, Tokens, Activities, Categories, Collections} = require("../../models/mysql/sequelizer");
const helpers = require("../../helpers_mysql");

const Controller = {
	async searchUser(req, res) {
		try {
			if (!Object.keys(req.body).length)
				return res.status(422).send({error: "No one search params"});

			var { name, verified, bio } = req.body;

			var where = {};

			if (name) where.name = {
				[Op.regexp]: name
			};
			if (bio) where.bio = {
				[Op.regexp]: bio
			};
			if (verified) where.verified = verified;

			var paginator_data = await helpers.paginator(req.query.page, {where}, Users);
			var pagination = paginator_data.info;

			var users = await Users.findAll({
				where,
				limit: 20,
				skip: paginator_data.skip,
				order: [['date_create', 'DESC']]
			});

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

			var where = {};

			where = {
				[Op.or]: [
					{ wallet: user_id },
					{ link: user_id },
					{ _id: user_id }
				]
			};

			var user = await Users.findOne({where});

			if (!user)
				return res.status(404).send({error: "User not found"});

			user_id = user._id;

			var stats = {
				on_sale: 0,
				collectibles: 0,
				sold: 0,
				created: 0,
				liked: 0,
				activity: 0,
				following: 0,
				followers: 0,
				royalties: 0
			};

			stats.on_sale = await Offers.count({
				where : {
					creatorId: user_id,
					status: "pending"
				}
			});
			stats.collectibles = await Tokens.count({
				where: {
					owners: {
						[Op.startsWith]: `[{"user": "${user_id}"`
					}
				}
			});
			stats.sold = await Tokens.count({
				where: {
					[Op.not]: [{
						owners: {
							[Op.startsWith]: `[{"user": "${user_id}"`
						}
					}],
					[Op.and]: [{
						owners: {
							[Op.substring]: `${user_id}`
						}
					}]
				}
			});
			stats.created = await Tokens.count({
				where: {
					creatorId: user_id
				}
			});
			stats.activity = await Activities.count({
				where: {
					userId: user_id
				}
			});
			stats.following = user.following ? user.following.length : 0;
			stats.followers = await Users.count({
				where: {
					following: {
						[Op.endsWith]: `%${user_id}%`
					}
				}
			});
			stats.liked = await Tokens.count({
				where: {
					likes: {
						[Op.endsWith]: `%${user_id}%`
					}
				}
			});
			stats.royalties = await Tokens.count({
				where: {
					creatorId: user_id
				}
			});
			if (req.user) {
				if (req.user.id == user_id) {
					user.followed = false;
				}
				else {
					var current_user = await Users.findOne({
						where: {
							_id: req.user.id
						}
					});
					user.followed = current_user.following ? current_user.following.includes(user_id) : null;
				}
			}
			else {
				user.followed = false;
			}

			delete user.following;

			res.send({user, stats});
		}
		catch(error) {
			res.status(500).send({error: "Server error"});
		}
	},

	async getUserItems(req, res) {
		try {
			var user_id = req.params.id;
			var type = req.params.type;
			var items = [];
			var pagination = {};

			// var is_wallet = !mongoose.Types.ObjectId.isValid(user_id);

			var user = await Users.findOne({
				where: {
					[Op.or]: [
						{wallet: user_id},
						{_id: user_id}
					],
				},
				attributes: ['_id', 'following', 'royalties']
			});

			if (!user)
				return res.status(404).send({error: "User not found"});

			user_id = user._id;

			// if (!mongoose.Types.ObjectId.isValid(user_id))
			// 	return res.status(422).send({error: "Bad user id"});

			switch(type) {
				case "on_sale": {
					var where = {creatorId: user_id, status: "pending"};
					var paginator_data = await helpers.paginator(req.query.page, {where}, Offers);
					pagination = paginator_data.info;

					items = await Offers.findAll({
						where,
						limit: 20,
						skip: paginator_data.skip,
						order: [['date_create', 'DESC']],
						include: [
						  {
							model: Tokens,
							as: 'token',
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
						  },
						],
					});
					// populate: ["categories", "collections", "creator"]

					helpers.calcLikesArray(items, req.user);

					break;
				}

				case "collectibles": {
					var where = {
						owners: {
							[Op.endsWith]: `%${user_id}%`
						}
					};
					var paginator_data = await helpers.paginator(req.query.page, {where}, Tokens);
					pagination = paginator_data.info;

					items = await Tokens.findAll({
						where: {
							owners: {
								[Op.startsWith]: `[{"user": "${user_id}"`
							}
						},
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
						],
					});
					if (items) {
						for (var token of items) {
							token.offer = await Offers.findOne({
								where: {
									status: "pending",
									tokenId: token._id
								}
							});
						}
					}
					helpers.calcLikesArray(items, req.user);

					break;
				}

				case "sold": {
					var where = {
						[Op.not]: [{
							owners: {
								[Op.startsWith]: `[{"user": "${user_id}"`
							}
						}],
						[Op.and]: [{
							owners: {
								[Op.substring]: `${user_id}`
							}
						}]
					};
					var paginator_data = await helpers.paginator(req.query.page, {where}, Tokens);
					pagination = paginator_data.info;

					items = await Tokens.findAll({
						where: {
							[Op.not]: [{
								owners: {
									[Op.startsWith]: `[{"user": "${user_id}"`
								}
							}],
							[Op.and]: [{
								owners: {
									[Op.substring]: `${user_id}`
								}
							}]	
						},
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
						],
					});
					if (items) {
						for (var token of items) {
							token.offer = await Offers.findOne({
								where: {
									status: "pending",
									tokenId: token._id
								}
							});
						}
					}
					helpers.calcLikesArray(items, req.user);

					break;
				}

				case "created": {
					var where = {creatorId: user_id};
					var paginator_data = await helpers.paginator(req.query.page, {where}, Tokens);
					pagination = paginator_data.info;

					items = await Tokens.findAll({
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
						],
					});
					// if (items) {
					// 	items = items.map(async (token) => {
					// 		var offer = await Offers.findOne({
					// 			where: {
					// 				status: "pending",
					// 				tokenId: token._id
					// 			}
					// 		});
					// 		return {
					// 			...token,
					// 			offer
					// 		}
					// 	});
					// }

					helpers.calcLikesArray(items, req.user);

					break;
				}

				case "activity": {
					var where = {userId: user_id};
					var paginator_data = await helpers.paginator(req.query.page, {where}, Activities);
					pagination = paginator_data.info;

					items = await Activities.findAll({
						where,
						limit: 20,
						skip: paginator_data.skip,
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
								model: Tokens,
								as: 'token'
							},
							{
								model: Offers,
								as: 'offer'
							},
						],
					})
					break;
				}

				case "following": {
					var users = user.following.map(u => u._id);
					var where = {_id: users};
					var paginator_data = await helpers.paginator(req.query.page, {where}, Users);
					pagination = paginator_data.info;

					items = await Users.findAll({
						where,
						limit: 20,
						skip: paginator_data.skip,
						order: [['date_create', 'DESC']]
					});

					break;
				}

				case "followers": {
					var where = {
						following: {
							[Op.endsWith]: `%${user_id}%`
						}
					};
					var paginator_data = await helpers.paginator(req.query.page, {where}, Users);
					pagination = paginator_data.info;

					items = await Users.findAll({
						where,
						limit: 20,
						skip: paginator_data.skip,
						order: [['date_create', 'DESC']]
					});

					break;
				}

				case "liked": {
					var where = {
						likes: {
							[Op.endsWith]: `%${user_id}%`
						}
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
								model: Collections,
								as: 'collections'
							},
							{
								model: Users,
								as: 'creator'
							}
						],
					});
					if (items) {
						items = items.map(async (t) => {
							var token = t.get({plain: true});
							var categories = await Categories.findAll({
								where: {
									_id: token.categories
								}
							});
							return {
								...token,
								categories
							};
						});
						items = items.map(async (token) => {
							var offer = await Offers.findOne({
								where: {
									status: "pending",
									token: token._id
								}
							});
							return {
								...token,
								offer
							}
						});
					}

					helpers.calcLikesArray(items, req.user);

					break;
				}

				case "royalties": {
					var tokens = await Tokens.count(
						{
							where: {
								creatorId: user_id,
							}
						});
					var royalties = user.royalties || 0;

					return res.send({type, tokens, royalties});
				}
			}

			res.send({type, items, ...pagination});
		}
		catch(error) {
			res.status(500).send({error: "Server error"});
		}
	},


	async getUserSettings(req, res) {
		try {
			var user_id = req.user.id;

			var user = await Users.findOne({
				where: {
					_id: user_id
				}
			});
			// , "+wallet +email +bio +twitter +instagram").lean();

			if (!user)
				return res.status(404).send({error: "User not found"});

			res.send({user});
		}
		catch(error) {
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

			var update = await Users.update(
				set,
				{
					where: {
						_id: req.user.id
					}
				});
			if (!update || update === [0])
				return res.status(422).send({error: "Nothing was updated"});

			res.send({message: "Settings updated"});
		}
		catch(error) {
			res.status(500).send({error: "Server error"});
		}
	},

	async verifyUser(req, res) {
		try {
			var update = await Users.update(
				{verified: true},
				{
					where: {
						_id: req.user.id
					}
				}
			);
			if (!update || update === [0])
				return res.status(422).send({error: "Verification error"});

			res.send({message: "Verified"});
		}
		catch(error) {
			res.status(500).send({error: "Server error"});
		}
	},


	async changeCoverImage(req, res) {
		try {
			var user_id = req.user.id;

			if (req.files && req.files.image) {
				var cover = await helpers.uploadFile(req.files.image, req.user.id, "content/cover");
				var update = await Users.update(
					{cover},
					{
						where: {
							_id: user_id
						}
					}
				);

				res.send({message: "Cover updated"});
			}
			else {
				var update = await Users.update(
					{cover: null},
					{
						where: {
							_id: user_id
						}
					}
				);

				if (!update || update == [0]) {
					return res.status(422).send({error: "Nothing was updated"});
				}
				res.send({message: "Cover removed"});
			}
		}
		catch(error) {
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

			var where = {};
			var date = new Date();
			date.setDate(date.getDate() - days);//??

			// where.status = "completed";
			// where.date_create = { $gte: date };
			where.buyers = {
				$elemMatch: {
					date: { $gte: date }
				}
			};

			var offers = await Offers.findAll({
				where,
				include: [
					{
						model: Users,
						as: 'creator'
					},
				]
			});
				// .populate("buyers.user", "wallet name avatar cover verified")

			var users = [];

			for (var offer of offers) {
				for (var buyer of offer.buyers) {
					if (type == "sellers") var user = offer.creator;
					if (type == "buyers") var user = buyer.user;

					var sum = (buyer.price * (buyer.copies || 1));
					var finded_user = Users.findOne({
						where: {
							_id: user_id
						}
					});

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
			res.status(500).send({ error: "Server error" });
		}
	},

	async toggleFollow(req, res) {
		try {
			var user_id = req.params.id;

			// if (!user_id || !mongoose.Types.ObjectId.isValid(user_id))
			// 	return res.status(422).send({error: "Bad user id"});

			if (user_id == req.user.id)
				return res.status(403).send({error: "You cannot follow to yourself"});

			var user = await Users.findOne({
				where: {
					_id: user_id
				}
			});
			if (!user)
				return res.status(404).send({error: "User not found"});

			var current_user = await Users.findOne({_id: req.user.id});
			let following = current_user.following ? current_user.following : [];
			following.push(user_id);
			await current_user.save();
			var mode = req.path.split("/").pop();
			var set = {};

			if (mode == "follow")
				set = {
					following: ''
				};
			if (mode == "unfollow")
				set = {
					following: following.filter((id) => id !== user_id)
				};

			var update = await Users.update(
				set,
				{
					where: {
						_id: req.user.id
					}
				});

			if (!update || update == [0])
				return res.status(404).send({error: "Already done"});

			if (mode == "follow") {
				await Activities.create({
					type: "following",
					userId: req.user.id,
					toUserId: user_id
				});
			}
			if (mode == "unfollow") {
				await Activities.destroy({
					where: {
						type: "following",
						userId: req.user.id,
						toUserId: user_id
					}
				});
			}

			res.send({message: "Success"});
		}
		catch(error) {
			res.status(500).send({error: "Server error"});
		}
	}
};

module.exports = Controller;