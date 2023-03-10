const cron = require("node-cron");
const {
  Tokens,
  Offers,
  Activities,
  Users,
  ApprovedTokens,
  Pumltransaction
} = require("./models/mysql/sequelizer");
const offers_controller = require("./controllers/mysql/offers");

const blockchain = require("./blockchain");
const { Op } = require("sequelize");

const start = () => {
  console.log(`Cron jobs started!`.cyan);

  if (process.env.NODE_ENV == "dev") {
    closeExpiredOffers();
  } else {
    cron.schedule("*/2 * * * *", closeExpiredOffers);
  }
};

const closeExpiredOffers = async () => {
  var offers = await Offers.findAll({
    where: {
      status: "pending",
      date_end: {
        [Op.lte]: new Date()
      },
      type: {
        [Op.eq]: "auction"
      }
    }
  });

  if (!offers && !offers.length) return false;

  for (var offer of offers) {
    var bids = offer.bids;
    if (bids.length) {
      var user_info = bids[0];

      offer.buyerId = user_info.user;
      offer.status = "completed";
      offer.purchase_type = "auction";

      var token = await Tokens.findOne({
        where: { _id: offer.tokenId }
      });

      var creator = await Users.findOne({
        where: { _id: offer.creatorId }
      });

      token.owners.unshift({
        user: user_info.user,
        price: user_info.price
      });
      await token.save();
      await Tokens.update(
        {
          owners: token.owners
        },
        {
          where: { _id: token._id }
        }
      );
      var appToken = await ApprovedTokens.findOne({
        where: { tokenId: token._id }
      });
      if (appToken && appToken.stake == true) return;

      await blockchain.auctionSetWinner(token, user_info.price, creator.wallet);
      await Pumltransaction.create({
        seller: creator.wallet,
        buyer: user_info.user,
        fee: user_info.price * 0.027,
        token: token.blockchain
      });
      await ApprovedTokens.update(
        {
          stake: 0
        },
        {
          where: { tokenId: token._id }
        }
      );
      await offers_controller.giveRoyalties(offer, token);
      await Activities.create({
        type: "purchased",
        offerId: offer._id,
        tokenId: offer.tokenId,
        userId: user_info.user,
        price: user_info.price
      });
      await offer.save();
      console.log(
        `Auction ${offer._id} has completed | Winner ${user_info.user}`.green
      );
    } else {
      offer.status = "expired";
      await offer.save();
      console.log(`Auction ${offer._id} has expired`.red);
    }
    await Offers.update(offer, {
      where: { _id: offer._id }
    });
  }
};

module.exports = {
  start,
  closeExpiredOffers
};
