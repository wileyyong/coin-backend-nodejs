const {Apy} = require("../../models/mysql/sequelizer");
const helpers = require("../../helpers_mysql");

const Controller = {

	async updateApy(req, res) {
		try {
			var { apy } = req.body;
			var set = {};

		 if (apy !== undefined) set.apy = apy;
			var exit = await Apy.findOne({
				where: {
					created_by: 'admin'
				}
			});
			if (exit) {
				var update = await Apy.update(
					set,
					{
						where: {
							created_by: 'admin'
						}
					}
				);
				if (!update || update == [0])
					return res.status(422).send({error: "Nothing was updated"});
				res.send({
					message: "Apy updated"
				});
			}  else {
				await Apy.create({
					created_by: 'admin',
					apy: set.apy
				});
				res.send({
					message: "APY added"
				});
			}
		}
		catch(error) {
			res.status(500).send({error: "Server error"});
		}
	},

	async getApy(req, res) {
		try {
      var apy = await Apy.findOne({
        where: {
          created_by: 'admin'
        }
      });
      if (!apy) {
        return res.send({error: "APY not found"});
      }
      res.send(apy);
		} catch(error) {
		  res.status(500).send({error: "Server error"});
		}
	}
};

module.exports = Controller;
