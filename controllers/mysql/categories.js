const {Categories} = require("../../models/mysql/sequelizer");

const Controller = {
	async getAllCategories(req, res) {
		try {
			var categories = await Categories.findAll({
				where: {}
			});
			res.send({categories});
		}
		catch(error) {
			console.log("Categories get all error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async createCategory(req, res) {
		try {
			var { _id, name } = req.body;
			if (!_id || !name) 
				return res.status(422).send({error: "Not all fields has filled"});
			
			var category = await Categories.create({
				_id, 
				name
			});
			res.send({category});
		}
		catch(error) {
			console.log("Categories create error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async deleteCategory(req, res) {
		try {
			var { _id } = req.params;
			if (!_id) return res.status(422).send({error: "ID is required"});
			
			var deletedCount = await Categories.destroy({
				where: {
					_id
				}
			});

			if (deletedCount && deletedCount > 0)
				return res.send({message: "Category deleted"});
			else
				return res.status(404).send({error: "Nothing was deleted"});
		}
		catch(error) {
			console.log("Categories create error", error);
			res.status(500).send({error: "Server error"});
		}
	}
};

module.exports = Controller;