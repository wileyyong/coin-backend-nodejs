const Categories = require("../models/categories");

const Controller = {
	async getAllCategories(req, res) {
		try {
			var categories = await Categories.find({});
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
			
			var category = await Categories.create({_id, name});
			res.send({category});
		}
		catch(error) {
			console.log("Categories create error", error);
			res.status(500).send({error: "Server error"});
		}
	},

	async deleteCategory(req, res) {
		try {
			var { id } = req.params;
			if (!id) return res.status(422).send({error: "ID is required"});
			
			var info = await Categories.deleteOne({_id: id}).exec();

			if (info && info.deletedCount)
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