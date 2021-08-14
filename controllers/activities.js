const Activities = require("../models/activities");
const Users = require("../models/users");
const Offers = require("../models/offers");
const helpers = require("../helpers");

const Controller = {
	async getActivitiesList(req, res) {
		var type = req.path;
		var filter = req.query.type;
		var query = {};

		if (filter) {
			query.type = filter;
		}

		if (type == "/my") {
			query.user = req.user.id;
		}

		if (type == "/following") {
			var current_user = await Users.findOne({_id: req.user.id}, "+following").lean();
			if (!current_user.following || !current_user.following.length) 
				return res.send({activities: []});

			var users = current_user.following.map(u => u._id);
			query.user = {$in: users};
		}

		var paginator_data = await helpers.paginator(req.query.page, query, Activities);
		var pagintion = paginator_data.info;

		var activities = await Activities.find(query)
			.sort({date: -1})
			.limit(20)
			.skip(paginator_data.skip)
			.populate("user", "+wallet")
			.populate("to_user", "+wallet")
			.populate("token")
			.populate("offer")
		
		res.send({activities, ...pagintion});
	}
};

module.exports = Controller;