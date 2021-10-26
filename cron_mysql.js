const cron = require("node-cron");
const { Tokens, Offers, Activities, } = require('./models/mysql/sequelizer');
const offers_controller = require("./controllers/mysql/offers");

const blockchain = require("./blockchain");
const { Op } = require("sequelize");


const start = () => {
	console.log(`Cron jobs started!`.cyan);

	if (process.env.NODE_ENV == "dev") {
		closeExpiredOffers();
	}
	else {
		cron.schedule('*/2 * * * *', closeExpiredOffers);
	}
};


const closeExpiredOffers = async () => {
	var offers = await Offers.findAll({
		where: { 
			status: "pending", 
			date_end: { 
				[Op.lte]: new Date() 
			}, 
			type: ["both", "auction"]
		} 
	});
	
	if (!offers && !offers.length)
		return false;
	
	for (var offer of offers) {
		var bids = JSON.parse(bids);
		if (bids.length) {
			var user_info = bids[0];
			
			await Activities.create({
				type: "purchased",
				offerId: offer._id,
				tokenId: offer.token,
				userId: user_info.user,
				price: user_info.price
			});

			offer.buyer = user_info.user;
			offer.status = "completed";
			offer.purchase_type = "auction";
			
			var token = await Tokens.findOne({
				where: {id: offer.token}
			});
			token.owners.unshift({
				user: user_info.user,
				price: user_info.price
			});
			await token.save();
			await blockchain.auctionSetWinner(token.chain_id);
			await offers_controller.giveRoyalties(offer, token);
			console.log(`Auction ${offer._id} has completed | Winner ${user_info.user}`.green);
		}
		else {
			offer.status = "expired";
			console.log(`Auction ${offer._id} has expired`.red);
		}

		await Offers.update(
			offer,
			{
				where: {id: offer.id}
			}
		);
	}
};

module.exports = {
	start,
	closeExpiredOffers
};