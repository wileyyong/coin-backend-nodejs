const {Activities, Users, Tokens, Offers} = require("../../models/mysql/sequelizer");
const helpers = require("../../helpers_mysql");

const Controller = {
	async getActivitiesList(req, res) {
		var type = req.path;
		var filter = req.query.type;
		var where = {};

		if (filter) {
			where.type = filter;
		}

		if (type == "/my") {
			where.userId = req.user.id;
		}

		if (type == "/following") {
			var current_user = await Users.findOne({
				where: {
					_id: req.user.id
				}
			});
			if (!current_user.following || !current_user.following.length) 
				return res.send({activities: []});

			var users = current_user.following.map(u => u._id);
			where.userId = users;
		}

		var paginator_data = await helpers.paginator(req.query.page, {where}, Activities);
		var pagination = paginator_data.info;

		var activities = await Activities.findAll({
			where,
			limit: 20,
			offset: paginator_data.skip,
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
		
		res.send({activities, ...pagination});
	}
};

module.exports = Controller;