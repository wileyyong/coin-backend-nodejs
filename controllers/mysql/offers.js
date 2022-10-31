const {
  Offers,
  Tokens,
  Activities,
  Users,
  Collections,
  Categories,
  ApprovedTokens
} = require("../../models/mysql/sequelizer");
const helpers = require("../../helpers_mysql");
const { Op } = require("sequelize");

const Controller = {
  async createOffer(req, res) {
    try {
      var { token_id, offer_price, min_bid, expiry_date } = req.body;

      if ("offer_price" in req.body) offer_price = Number(offer_price);
      if ("min_bid" in req.body) min_bid = Number(min_bid);

      if (offer_price == NaN || min_bid == NaN)
        return res.status(422).send({ error: "Bad offer_price or min_bid" });

      var token = await Tokens.findOne({
        where: {
          _id: token_id
        }
      });
      if (!token) return res.status(404).send({ error: "Token not found" });

      if (req.user.id != String(token.owners[0].user))
        return res.status(403).send({ error: "Token is not yours" });

      if (!token.chain_id)
        return res.status(403).send({ error: "Token without chain_id" });

      var offer_exists = await Offers.count({
        where: {
          tokenId: token_id,
          status: "pending"
        }
      });
      if (offer_exists)
        return res
          .status(403)
          .send({ error: "Offer for this token is already on sale" });

      var offer_data = {
        type: "both",
        tokenId: token_id,
        creatorId: req.user.id,
        categories: token.categories,
        bids: []
      };

      if (min_bid && offer_price) offer_data.type = "both";
      else if (min_bid && !offer_price) offer_data.type = "auction";
      else if (!min_bid && offer_price) offer_data.type = "direct";
      else return res.status(422).send({ error: "Bad type of offer" });

      if (min_bid) {
        if (!expiry_date || new Date() > new Date(expiry_date)) {
          return res.status(422).send({ error: "Bad expiry date" });
        }

        expiry_date = new Date(expiry_date);
        offer_data.min_bid = min_bid;
        offer_data.date_end = expiry_date;
      }

      if (offer_price) {
        offer_data.offer_price = offer_price;
      }
      let owners = token.owners;
      if (owners && owners.length == 1) {
        owners[0].price = offer_data.min_bid || offer_data.offer_price;
        token.owners = owners;
        await token.save();
      }
      var offer = await Offers.create(offer_data);
      res.send({ message: "Offer created", offer });

      Activities.create({
        type: "listed",
        userId: req.user.id,
        offerId: offer._id,
        tokenId: offer.tokenId,
        price: offer_price || min_bid
      });
    } catch (error) {
      res.status(500).send({ error: "Offer creating error" });
    }
  },

  async getAuctions(req, res) {
    try {
      var type = req.params.type;
      var current_date = Date.now();

      var offer = await Offers.findOne({
        where: {
          _id: type
        },
        include: [
          {
            model: Users,
            as: "creator"
          },
          {
            model: Tokens,
            as: "token",
            include: [
              {
                model: Collections,
                as: "collections"
              },
              {
                model: Users,
                as: "creator"
              }
            ]
          }
        ]
      });
      if (offer) {
        var bids = offer.bids;
        offer = bids.map(async (bid) => {
          var user = await Users.findOne({
            where: { _id: bid.user }
          });
          return {
            ...bid,
            user
          };
        });
        var cats = offer.categories.map(async (_id) => {
          var category = await Categories.findOne({
            where: { _id }
          });
          return category;
        });
        offer.categories = cats;
        // .populate("bids.user", "+wallet")
        // populate: ["categories", "creator", "owners.user", "collections"]
        //??

        if (offer.token) helpers.calcLikes(offer, req.user);

        var history = await Activities.findAll({
          where: {
            [Op.or]: [{ tokenId: offer.token._id }, { offerId: offer._id }]
          },
          include: [
            {
              model: Users,
              as: "user"
            },
            {
              model: Users,
              as: "to_user"
            },
            {
              model: Tokens,
              as: "token"
            },
            {
              model: Offers,
              as: "offer"
            }
          ]
        });

        res.send({ offer, history });
      } else {
        var { category, name } = req.query;

        var where = {};
        var order = null;
        var sort_type = req.query.sort;

        if (type == "explore") {
          // if (max_skip > 100) {
          // 	var rest = max_skip - 100;
          // 	skip = helpers.randomRange(0, rest);
          // }

          if (sort_type == "recent") order = [["date_create", "DESC"]];
        }

        if (type == "live") {
          where = {
            type: ["auction", "both"],
            date_start: {
              [Op.lte]: current_date
            },
            date_end: {
              [Op.gte]: current_date
            }
          };

          order = [["date_start", "DESC"]];
        }

        if (type == "new") {
          where = {
            type: ["auction", "both"],
            date_create: {
              [Op.lte]: current_date
            }
          };

          order = [["date_create", "DESC"]];
        }

        if (category) {
          where.categories = {
            [Op.endsWith]: `%${category}%`
          };
        }
        where.status = "pending";

        var paginator_data = await helpers.paginator(
          req.query.page,
          { where },
          Offers
        );
        var pagination = paginator_data.info;

        var offers1 = await Offers.findAll({
          where,
          limit: 20,
          skip: paginator_data.skip,
          order,
          include: [
            {
              model: Users,
              as: "creator"
            },
            {
              model: Tokens,
              as: "token",
              include: [
                {
                  model: Collections,
                  as: "collections"
                }
              ]
            }
          ]
        });
        var offers = [];
        for (var offer of offers1) {
          const tokenId = offer.tokenId;
          const approvetoken = await ApprovedTokens.findOne({
            where: { tokenId: tokenId }
          });
          if (approvetoken && approvetoken.stake) {
            continue;
          }
          offers.push(offer);
        }

        if (offers.length > 0) {
          offers = offers.map((offer) => offer.get({ plain: true }));
          offers = await Promise.all(
            offers.map(async (offer) => {
              var bids = offer.bids;
              bids = await Promise.all(
                bids?.map(async (bid) => {
                  var user = await Users.findOne({
                    where: { _id: bid.user }
                  });
                  return {
                    ...bid,
                    user
                  };
                })
              );
              return {
                ...offer,
                bids: bids ? bids : []
              };
            })
          );
          offers = await Promise.all(
            offers.map(async (offer) => {
              if (offer.token) {
                var owners = offer.token.owners;
                owners = await Promise.all(
                  owners?.map(async (owner) => {
                    var user = await Users.findOne({
                      where: { _id: owner.user }
                    });
                    return {
                      ...owner,
                      user
                    };
                  })
                );
                var token = {
                  ...offer.token,
                  owners: owners ? owners : []
                };
                return {
                  ...offer,
                  token
                };
              }
              return offer;
            })
          );
          offers = await Promise.all(
            offers.map(async (offer) => {
              if (offer.token) {
                var cats = await Promise.all(
                  offer.token.categories?.map(async (id) => {
                    var category = await Categories.findOne({
                      where: { _id: id }
                    });
                    return category;
                  })
                );
                var token = {
                  ...offer.token,
                  categories: cats
                };
                return {
                  ...offer,
                  token
                };
              }
              return offer;
            })
          );
          helpers.calcLikesArray(offers, req.user);

          if (name) {
            offers = offers.filter((auction) =>
              auction.token.name.toLowerCase().includes(name.toLowerCase())
            );
          }

          if (sort_type == "costly") {
            offers.sort((a, b) => {
              var price1 = helpers.getOfferMinPrice(a);
              var price2 = helpers.getOfferMinPrice(b);

              return price2 - price1;
            });
          }
          if (sort_type == "cheap") {
            offers.sort((a, b) => {
              var price1 = helpers.getOfferMinPrice(a);
              var price2 = helpers.getOfferMinPrice(b);

              return price1 - price2;
            });
          }
          if (sort_type == "liked") {
            offers.sort((a, b) => {
              return b.token.likes - a.token.likes;
            });
          }
          res.send({ offers, ...pagination });
        } else {
          res.send({ offers: [], ...pagination });
        }
      }
    } catch (error) {
      res.status(500).send({ error: "Server error" });
    }
  },

  async addBid(req, res) {
    try {
      var { price, hash } = req.body;
      price = Number(price);
      if (!price || !hash)
        return res.status(422).send({ error: "Not all fields has filled" });

      var offer = await Offers.findOne({
        where: {
          _id: req.params.id,
          type: ["auction", "both"]
        }
      });

      if (!offer) return res.status(404).send({ error: "Auction not found" });
      var bids = offer.bids;
      if (bids.length && bids[0].price >= price && price <= min_bid) {
        return res
          .status(422)
          .send({ message: "Bid is less or equal than the previous one" });
      } else {
        bids.unshift({
          user: req.user.id,
          hash,
          price,
          date: new Date()
        });
        // offer.bids = [...bids];
        // await offer.save();
        await Offers.update(
          {
            bids: bids
          },
          {
            where: { _id: offer._id }
          }
        );
        res.send({ message: "Success bidding" });
      }

      Activities.create({
        type: "offered",
        userId: req.user.id,
        offerId: offer._id,
        tokenId: offer.tokenId,
        price
      });
    } catch (error) {
      res.status(500).send({ error: "Server error" });
    }
  },

  async buyDirectOffer(req, res) {
    try {
      var { price, hash } = req.body;

      if (!price || !hash)
        return res.status(422).send({ error: "Not all fields has filled" });

      var offer = await Offers.findOne({
        where: {
          _id: req.params.id,
          type: ["direct", "both"]
        }
      });
      if (!offer || !offer.offer_price)
        return res.status(404).send({ error: "Auction not found" });

      if (offer.offer_price > price)
        return res.status(422).send({
          message: "Your price is less than the minimum offer price",
          offer_price: offer.offer_price
        });

      var token = await Tokens.findOne({
        where: {
          _id: offer.tokenId
        }
      });

      // offer.bids.unshift({
      // 	user: req.user.id,
      // 	hash,
      // 	price
      // });

      token.owners.unshift({
        user: req.user.id,
        price
      });
      // await offer.save();
      // await token.save();
      await Offers.update(
        {
          status: "completed",
          buyerId: req.user.id,
          date_sell: Date.now(),
          purchase_type: "direct"
        },
        {
          where: { _id: offer._id }
        }
      );
      await Tokens.update(
        {
          owners: token.owners
        },
        {
          where: { _id: token._id }
        }
      );
      await ApprovedTokens.update(
        {
          owners: token.owners
        },
        {
          where: { tokenId: token._id }
        }
      );

      Activities.create({
        type: "purchased",
        userId: req.user.id,
        offerId: offer._id,
        tokenId: offer.tokenId,
        price
      });

      Controller.giveRoyalties(offer, token);

      res.send({ message: "Success buyed" });
    } catch (error) {
      res.status(500).send({ error: "Server error" });
    }
  },

  async searchOffers(req, res) {
    try {
      if (!Object.keys(req.body).length)
        return res.status(422).send({ error: "No one search params" });

      var {
        name,
        date_start,
        date_end,
        price_min,
        price_max,
        sort,
        verified,
        category
      } = req.body;
      var pagination = {};
      var sort_data = null;

      var where = { status: "pending" };
      if (name) {
        var tokens = await Tokens.findAll({
          where: {
            name: {
              [Op.regexp]: name
            }
          }
        });
        var tokens_id = tokens.map((t) => t._id);
        where.token = tokens_id;
      }

      if (category) {
        where.categories = {
          [Op.all]: category
        };
      }

      if (date_start || date_end) where.date_create = {};
      if (date_start)
        where.date_create = {
          [Op.gte]: date_start
        };
      if (date_end)
        where.date_create = {
          [Op.gte]: date_end
        };

      if (sort == "recent") {
        sort_data = [["date_create", "DESC"]];
      }

      var paginator_data = await helpers.paginator(
        req.query.page,
        { where },
        Offers
      );
      pagination = paginator_data.info;

      var offers = await Offers.findAll({
        where,
        limit: 20,
        skip: paginator_data.skip,
        order: sort_data,
        include: [
          {
            model: Tokens,
            as: "token",
            include: [
              {
                model: Collections,
                as: "collections"
              }
            ]
          },
          {
            model: Users,
            as: "creator"
          }
        ]
      });
      // path: "token",
      // select: "+likes",
      // populate: ["collections", "categories", "owners.user"]

      // .populate("creator", "+wallet")
      // .populate("categories")
      // .lean();

      offers = offers.map((offer) => offer.get({ plain: true }));

      offers = await Promise.all(
        offers.map(async (offer) => {
          if (offer.token) {
            var owners = offer.token.owners;
            owners = await Promise.all(
              owners?.map(async (owner) => {
                var user = await Users.findOne({
                  where: { _id: owner.user }
                });
                return {
                  ...owner,
                  user
                };
              })
            );
            var token = {
              ...offer.token,
              owners: owners ? owners : []
            };
            return {
              ...offer,
              token
            };
          }
          return offer;
        })
      );
      offers = await Promise.all(
        offers.map(async (offer) => {
          if (offer.token) {
            var cats = await Promise.all(
              offer.token.categories?.map(async (id) => {
                var category = await Categories.findOne({
                  where: { _id: id }
                });
                return category;
              })
            );
            var token = {
              ...offer.token,
              categories: cats
            };
            return {
              ...offer,
              token
            };
          }
          return offer;
        })
      );
      offers = await Promise.all(
        offers.map(async (offer) => {
          var cats = await Promise.all(
            offer.categories?.map(async (id) => {
              var category = await Categories.findOne({
                where: { _id: id }
              });
              return category;
            })
          );
          return {
            ...offer,
            categories: cats
          };
        })
      );
      offers = offers.filter((offer) => {
        if (verified && !offer.creator.verified) return false;

        // if (date_create) {
        // 	var needed = moment(date_create);
        // 	var create = moment(offer.date_create.toISOString().substr(0, 10));
        // 	if (create != needed) return false;
        // }

        var price = helpers.getOfferMinPrice(offer);

        if (price_min && price < price_min) return false;
        if (price_max && price > price_max) return false;

        helpers.calcLikes(offer);
        return true;
      });

      if (sort == "costly") {
        offers.sort((a, b) => {
          var price1 = helpers.getOfferMinPrice(a);
          var price2 = helpers.getOfferMinPrice(b);

          return price2 - price1;
        });
      }
      if (sort == "cheap") {
        offers.sort((a, b) => {
          var price1 = helpers.getOfferMinPrice(a);
          var price2 = helpers.getOfferMinPrice(b);

          return price1 - price2;
        });
      }
      // if (sort == "recent") {
      // 	offers.sort((a, b) => {
      // 		return b.date_create - a.date_create;
      // 	});
      // }
      if (sort == "liked") {
        offer.sort((a, b) => {
          return b.token.likes.length - a.token.likes.length;
        });
      }

      if (offers.length > 50) offers = offers.splice(0, 50);

      res.send({ offers, ...pagination });
    } catch (error) {
      res.status(500).send({ error: "Server error" });
    }
  },

  async giveRoyalties(offer, token) {
    if (offer.purchase_type == "direct") {
      var price = offer.offer_price;
    } else {
      var price = offer.bids[0].price;
    }

    var user = await Users.findOne({
      where: {
        _id: token.creatorId
      }
    });

    var sum = price * (token.royalties / 100);
    var new_royalties = Number((user.royalties + sum).toFixed(5));

    user.royalties = new_royalties;
    await user.save();
    await Users.update(user, {
      where: { _id: user._id }
    });
  }
};

module.exports = Controller;
