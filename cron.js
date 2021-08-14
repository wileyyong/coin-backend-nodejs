const cron = require("node-cron");
const Tokens = require("./models/tokens");
const Offers = require("./models/offers");
const Activities = require("./models/activities");
const offers_controller = require("./controllers/offers");

const blockchain = require("./blockchain");


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
	var offers = await Offers.find({ 
		status: "pending", 
		date_end: { $lte: new Date() }, 
		type: {$in: ["both", "auction"]} 
	});
	
	if (!offers && !offers.length)
		return false;
	
	for (var offer of offers) {
		if (offer.bids.length) {
			var user_info = offer.bids[0];

			await Activities.create({
				type: "purchased",
				offer: offer._id,
				token: offer.token,
				user: user_info.user,
				price: user_info.price
			});

			offer.buyer = user_info.user;
			offer.status = "completed";
			offer.purchase_type = "auction";
			
			var token = await Tokens.findOne({_id: offer.token});
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

		await offer.save();
	}
};

module.exports = {
	start,
	closeExpiredOffers
};