const {Featured} = require("../../models/mysql/sequelizer");
const helpers = require("../../helpers_mysql");

const Controller = {

	async updateFeatured(req, res) {
		try {
			var { featured_name, featured_price } = req.body;
			var set = {};

			if (featured_name !== undefined) set.featured_name = featured_name;
			if (featured_price !== undefined) set.featured_price = featured_price;
			var exit = await Featured.findOne({
				where: {
					created_by: 'admin'
				}
			});
			if (exit) {
				var update = await Featured.update(
					set,
					{
						where: {
							created_by: 'admin'
						}
					}
				);
				if (!update || update == [0])
					return res.status(422).send({error: "Nothing was updated"});
				res.send({message: "Featured updated"});
			} 
			await Featured.create({
				created_by: 'admin',
				featured: '',
				featured_name: set.featured_name,
				featured_price: set.featured_price
			});
			res.send({message: "Featured added"});
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
        		var exit = await Featured.findOne({
					where: {
						created_by: 'admin'
					}
				});
				if (exit) {
					var update = await Featured.update(
						{
							featured
						},
						{
							where: {
								created_by: 'admin'
							}
						});
					res.send({message: "Featured Image updated"});
				} else {
					await Featured.create({ 
						created_by: 'admin',
						featured: featured,
						featured_name: '',
						featured_price: 0
					});
					res.send({message: "Featured Image added"});
				}
			} else {
				var update = await Featured.update(
					{
						featured: null
					},
					{
						where: {
							created_by: 'admin'
						}
					});

				if (!update || update == [0]) {
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
			var featuredNFT = await Featured.findOne({
				where: {
					created_by: 'admin'
				}
			});
      		if (!featuredNFT) 
				return res.status(404).send({error: "Featured not found"});
      		res.send(featuredNFT);
		} catch(error) {
		res.status(500).send({error: "Server error"});
		}
	}
};

module.exports = Controller;
