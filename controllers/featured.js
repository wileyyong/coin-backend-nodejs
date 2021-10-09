const Users = require("../models/users");
const Featured = require("../models/featured");
const helpers = require("../helpers");

const Controller = {

	async updateFeatured(req, res) {
		try {
			var { featured_name, featured_price } = req.body;
			var set = {};

			if (featured_name !== undefined) set.featured_name = featured_name;
			if (featured_price !== undefined) set.featured_price = featured_price;

			var update = await Featured.updateOne({created_by: 'admin'}, set);
			if (!update || !update.nModified)
				return res.status(422).send({error: "Nothing was updated"});
			
			res.send({message: "Featured updated"});
		}
		catch(error) {
			console.log("User update featured error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async changeFeaturedImage(req, res) {
		try {
			if (req.files && req.files.featuredImage) {
				var featured = await helpers.uploadFile(req.files.featuredImage, req.user.id, "content/cover");
				var update = await Featured.updateOne({created_by: 'admin'}, { $set: {featured} }).exec();

				res.send({message: "Featured Image updated"});
			}
			else {
				var update = await Featured.updateOne({created_by: 'admin'}, {$unset: {featured: true}}).exec();

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

  async getFeatured(req, res) {
    try {
      var featuredNFT = await Featured.findOne({created_by: 'admin'});
      console.log(featuredNFT);
      if (!featuredNFT) 
				return res.status(404).send({error: "Token not found"});
      res.send(featuredNFT);
    } catch(error) {
      res.status(500).send({error: "Server error"});
    }
  }

};

module.exports = Controller;
