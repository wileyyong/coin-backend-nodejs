const {
  Collections,
  Tokens,
  Offers,
  Activities,
  Users,
  Categories,
  ApprovedTokens,
  Pumltransaction,
  Pumlfeecollects,
  Claimhistories
} = require("../../models/mysql/sequelizer");
const helpers = require("../../helpers_mysql");
const { Op } = require("sequelize");
const blockchain = require("../../blockchain");

const Controller = {
  async getAllTokens(req, res) {
    try {
      var where = {
        chain_id: {
          [Op.not]: null
        }
      };
      var paginator_data = await helpers.paginator(
        req.query.page,
        { where },
        Tokens
      );
      var pagination = paginator_data.info;

      var tokens = await Tokens.findAll({
        where,
        limit: 20,
        skip: paginator_data.skip,
        order: [["date_create", "DESC"]],
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
      });
      tokens = await Promise.all(
        tokens.map(async (t) => {
          var token = t.get({ plain: true });
          var cats = await Categories.findAll({
            where: { _id: token.categories }
          });
          return {
            ...token,
            categories: cats
          };
        })
      );

      tokens = await Promise.all(
        tokens.map(async (token) => {
          if (token.owners) {
            var owners = token.owners;
            owners = owners.map(async (owner) => {
              var user = await Users.findOne({
                where: { _id: owner.user }
              });
              return {
                ...owner,
                user
              };
            });
            return {
              ...token,
              owners
            };
          }
          return token;
        })
      );
      helpers.calcLikesArray(tokens, req.user);

      res.send({ tokens, ...pagination });
    } catch (error) {
      res.status(500).send({ error: "Server error" });
    }
  },

  async getMyTokens(req, res) {
    try {
      var where = {
        [Op.or]: [{ creatorId: req.user.id }, { "owners.0.user": req.user.id }],
        chain_id: {
          [Op.not]: null
        }
      };

      var paginator_data = await helpers.paginator(
        req.query.page,
        { where },
        Tokens
      );
      var pagination = paginator_data.info;

      var tokens = await Tokens.findAll({
        where,
        limit: 20,
        skip: paginator_data.skip,
        order: [["date_create", "DESC"]],
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
      });
      tokens = await Promise.all(
        tokens.map(async (t) => {
          var token = t.get({ plain: true });
          var cats = await Categories.findAll({
            where: { _id: token.categories }
          });
          return {
            ...token,
            categories: cats
          };
        })
      );

      tokens = await Promise.all(
        tokens.map(async (token) => {
          if (token.owners) {
            var owners = token.owners;
            owners = owners.map(async (owner) => {
              var user = await Users.findOne({
                where: { _id: owner.user }
              });
              return {
                ...owner,
                user
              };
            });
            return {
              ...token,
              owners
            };
          }
          return token;
        })
      );
      // .populate("owners.user")

      helpers.calcLikesArray(tokens, req.user);

      res.send({ tokens, ...pagination });
    } catch (error) {
      res.status(500).send({ error: "Server error" });
    }
  },

  async getTokenInfo(req, res) {
    try {
      var token_id = req.params.id;
      var where = {
        _id: token_id,
        chain_id: {
          [Op.not]: null
        }
      };
      var token = await Tokens.findOne({
        where,
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
      });
      if (!token) return res.status(404).send({ error: "Token not found" });

      var cats = await Categories.findAll({
        where: { _id: token.categories }
      });
      token.categories = cats;

      if (token.owners) {
        let owners = [];
        owners = await Promise.all(
          token.owners.map(async (owner) => {
            var user = await Users.findOne({
              where: { _id: owner.user }
            });
            return {
              ...owner,
              user
            };
          })
        );
        token.owners = owners;
      }
      // .populate("owners.user")

      helpers.calcLikes(token, req.user);

      var offer = await Offers.findOne({
        where: {
          tokenId: token_id
        },
        order: [["date_create", "DESC"]],
        include: [
          {
            model: Users,
            as: "creator"
          },
          {
            model: Users,
            as: "buyer"
          }
        ]
      });
      // .populate("bids.user", "+wallet")
      if (offer) {
        if (offer.bids) {
          var bids = offer.bids;
          bids = await Promise.all(
            bids.map(async (bid) => {
              var user = await Users.findOne({
                where: { _id: bid.user }
              });
              return {
                ...bid,
                user
              };
            })
          );
          offer.bids = bids;
        }
      }
      var history = await Activities.findAll({
        where: {
          tokenId: token_id
        },
        order: [["date", "DESC"]],
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
            model: Offers,
            as: "offer"
          },
          {
            model: Tokens,
            as: "token"
          }
        ]
      });

      var ret = { token, offer, history };
      res.send(ret);
    } catch (error) {
      res.status(500).send({ error: "Server error" });
    }
  },

  async getTokenJson(req, res) {
    try {
      var token_id = req.params.id;
      var token = await Tokens.findOne({
        where: { _id: token_id }
      });

      if (!token) return res.status(404).send({ error: "Token not found" });
      res.send({
        name: token.name,
        description: token.description,
        attributes: JSON.parse(token.attributes),
        image: token.thumbnail || token.media
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Token JSON error" });
    }
  },

  async createToken(req, res) {
    var {
      name,
      description,
      attributes,
      collection,
      categories,
      royalties,
      locked,
      offchain,
      blockchain,
      media,
      media_type
    } = helpers.parseFormData(req.body);
    //if (!req.files || !req.files.media)
    //return res.status(422).send({error: "Image or other media is required"});

    try {
      var token_data = {
        name,
        royalties,
        categories: categories?.split("|"), // Todo: Add categories check exists
        owners: [{ user: req.user.id }],
        creatorId: req.user.id,
        offchain: offchain || false,
        blockchain: blockchain || "ETH",
        media,
        media_type
      };
      var token = await Tokens.create(token_data);
      //var media = await helpers.uploadToIPFS(req.files.media.data, token._id);
      //if (!media) media = await helpers.uploadFile(req.files.media, token._id, "content/media");
      //var media_type = req.files.media.name.split(".").pop().toLowerCase();
      // var set = {};
      //token.media = media;
      //token.media_type = media_type;
      if (req.files.thumbnail) {
        var thumbnail = await helpers.uploadFile(
          req.files.thumbnail,
          token._id,
          "content/thumbnail"
        );
        token.thumbnail = thumbnail;
      }

      if (locked) token.locked = locked;
      if (description) token.description = description;
      if (attributes) token.attributes = attributes;
      if (collection && !helpers.isNot(collection))
        token.collectionsId = collection;
      await token.save();
      res.send({
        message: "Token created",
        token,
        link: `/api/tokens/${token._id}.json`
      });
      Activities.create({
        type: "minted",
        userId: req.user.id,
        tokenId: token._id
      });
    } catch (error) {
      res.status(500).send({ error: "Token creation error" });
    }
  },

  async setTokenChainId(req, res) {
    try {
      var token_id = req.params.id;
      var chain_id = req.body.chain_id;
      if (!token_id || !chain_id)
        return res.status(422).send({ error: "Not all fields has filled" });

      var token = await Tokens.findOne({
        where: { _id: token_id }
      });

      if (!token) return res.status(404).send({ error: "Token not found" });

      if (req.user.id != token.creatorId)
        return res.status(403).send({ error: "Forbidden" });
      token.chain_id = chain_id;
      token.save();
      res.send({ message: "Success changed" });
    } catch (error) {
      res.status(500).send({ error: "Token set chain_id error" });
    }
  },

  async deleteToken(req, res) {
    try {
      var _id = req.params.id;

      var token = await Tokens.findOne({
        where: { _id }
      });
      if (!token) return res.status(404).send({ error: "Token not found" });

      if (req.params.user != token.creatorId)
        return res.status(403).send({ error: "Forbidden" });

      await Tokens.destroy({
        where: { _id }
      });
      await Offers.destroy({
        where: {
          tokenId: _id
        }
      });
      await Activities.destroy({
        where: { tokenId: _id }
      });

      res.send({ message: "Token success deleted" });
    } catch (error) {
      res.status(500).send({ error: "Token delete error" });
    }
  },

  async toggleLike(req, res) {
    try {
      var token_id = req.params.id;

      if (!token_id)
        // || !mongoose.Types.ObjectId.isValid(token_id)
        return res.status(422).send({ error: "Bad token id" });

      var token = await Tokens.findOne({
        where: {
          _id: token_id
        }
      });

      if (!token) return res.status(404).send({ error: "Token not found" });

      // var current_user = await Tokens.findOne({_id: req.user.id});
      // current_user.following.push(user_id);
      // await current_user.save();
      var mode = req.path.split("/").pop();

      var set = {};
      let likes = token.likes || [];

      if (mode == "like") set = { likes: [...likes, req.user.id] };
      if (mode == "unlike")
        set = {
          likes: likes.length > 0 ? likes.filter((id) => id != req.user.id) : []
        };

      var update = await Tokens.update(set, {
        where: { _id: token_id }
      });

      if (!update || update == [0])
        return res.status(404).send({ error: "Already done" });

      if (mode == "like") {
        await Activities.create({
          type: "liked",
          userId: req.user.id,
          tokenId: token_id
        });
      }
      if (mode == "unlike") {
        await Activities.destroy({
          where: {
            type: "unliked",
            userId: req.user.id,
            tokenId: token_id
          }
        });
      }

      res.send({ message: "Success" });
    } catch (error) {
      res.status(500).send({ error: "Server error" });
    }
  },

  async buyToken(req, res) {
    var { buyerAddress, sellerAddress, buyPrice } = helpers.parseFormData(
      req.body
    );
    // var { tokenId, buyerAddress, sellerAddress, buyPrice } =
    //   helpers.parseFormData(req.body);
    // let buyResult = await blockchain.buyToken(
    //   tokenId,
    //   0.00001,
    //   buyerAddress,
    //   sellerAddress,
    //   buyPrice
    // );
    // if (buyResult.success && buyResult.transactionHash) {
    await Pumltransaction.create({
      seller: sellerAddress,
      buyer: buyerAddress,
      fee: buyPrice * 0.027
    });
    res.send({ success: true });
    // res.send({ success: true, transactionHash: buyResult.transactionHash });
    // } else {
    //   console.log("buyTokenErr", buyResult.error);
    //   res.send({ success: false, error: buyResult.error });
    // }
  },

  // async bidToken(req, res) {
  //   var { tokenChainId, tokenId, bidderAddress } = helpers.parseFormData(
  //     req.body
  //   );
  //   var offer = await Offers.findOne({
  //     where: {
  //       tokenId: tokenId,
  //       type: ["auction", "both"]
  //     }
  //   });
  //   var bidPrice = 0.000011;
  //   if (offer) {
  //     var bids = offer.bids;
  //     bidPrice += 0.000001 * bids.length;
  //   }

  //   let bidResult = await blockchain.bidToken(
  //     tokenChainId,
  //     bidPrice,
  //     bidderAddress
  //   );
  //   if (bidResult.success && bidResult.transactionHash) {
  //     res.send({ success: true, transactionHash: bidResult.transactionHash });
  //   } else {
  //     console.log("bidTokenErr", bidResult.error);
  //     res.send({ success: false, error: { err: bidResult.error } });
  //   }
  // },

  async createApprovedToken(req, res) {
    var {
      name,
      tokenId,
      chain_id,
      description,
      attributes,
      collection,
      categories,
      royalties,
      locked,
      offchain,
      blockchain,
      contract_address,
      media,
      media_type
    } = helpers.parseFormData(req.body);
    //if (!req.files || !req.files.media)
    //return res.status(422).send({error: "Image or other media is required"});

    try {
      var token_data = {
        name,
        tokenId,
        chain_id,
        royalties,
        categories: categories?.split("|"), // Todo: Add categories check exists
        owners: [{ user: req.user.id }],
        creatorId: req.user.id,
        offchain: offchain || false,
        blockchain: blockchain || "ETH",
        contract_address,
        media,
        media_type
      };
      var token = await ApprovedTokens.create(token_data);
      //var media = await helpers.uploadToIPFS(req.files.media.data, token._id);
      //if (!media) media = await helpers.uploadFile(req.files.media, token._id, "content/media");
      //var media_type = req.files.media.name.split(".").pop().toLowerCase();
      // var set = {};
      //token.media = media;
      //token.media_type = media_type;
      //if (req.files.thumbnail) {
      //var thumbnail = await helpers.uploadFile(req.files.thumbnail, token._id, "content/thumbnail");
      //token.thumbnail = thumbnail;
      //}

      if (locked) token.locked = locked;
      if (description) token.description = description;
      if (attributes) token.attributes = attributes;
      if (collection && !helpers.isNot(collection))
        token.collectionsId = collection;
      await token.save();
      res.send({
        message: "Approved Token created",
        token,
        link: `/api/tokens/${token._id}.json`
      });
    } catch (error) {
      res.status(500).send({ error: "Token creation error" });
    }
  },

  async deleteApprovedToken(req, res) {
    try {
      var _id = req.params.id;

      var token = await ApprovedTokens.findOne({
        where: { _id }
      });
      if (!token) return res.status(404).send({ error: "Token not found" });

      if (req.params.user != token.creatorId)
        return res.status(403).send({ error: "Forbidden" });

      await ApprovedTokens.destroy({
        where: { _id }
      });

      res.send({ message: "Approved Token success deleted" });
    } catch (error) {
      res.status(500).send({ error: "Approved Token delete error" });
    }
  },

  async stakeToken(req, res) {
    try {
      var { chainIds, stake } = helpers.parseFormData(req.body);
      for (let key in chainIds) {
        const contractAddress = key !== "0x0" ? key : ["", null];
        var update = await ApprovedTokens.update(
          {
            stake: stake
          },
          {
            where: {
              chain_id: chainIds[key],
              contract_address: contractAddress
            }
          }
        );

        if (!update || update == [0])
          return res.status(404).send({ error: "Already done" });
      }
      res.send({ message: "Success" });
    } catch (error) {
      res.status(500).send({ error: "Server error" });
    }
  },

  async approveToken(req, res) {
    try {
      var { chainIds } = helpers.parseFormData(req.body);
      let approveResult = await blockchain.approveNft(chainIds);
      if (approveResult.success) {
        res.send({ success: true });
      } else {
        console.log("approveTokenErr");
        res.send({ success: false, error: { err: "approveTokenErr" } });
      }
    } catch (error) {
      res.status(500).send({ error: "Server error" });
    }
  },

  async getMyApprovedTokens(req, res) {
    try {
      var where = {
        "owners.0.user": req.user.id,
        blockchain: ["ETH", "PUMLx"]
      };

      var tokens = await ApprovedTokens.findAll({
        where,
        order: [["date_create", "DESC"]]
      });

      res.send({ tokens });
    } catch (error) {
      res.status(500).send({ error: "Server error" });
    }
  },

  async getPumlTradingFee(req, res) {
    var sum = 0;
    var usersum = 0;

    try {
      var trans = await Pumltransaction.findAll({
        where: {
          date_create: {
            [Op.gte]: new Date(req.body.startTime * 1000)
          }
        }
      });
      if (trans && trans.length > 0) {
        for (var tran of trans) {
          sum += tran.fee;
          if (tran.seller == req.body.user || tran.buyer == req.body.user) {
            usersum += tran.fee;
          }
        }
      }

      const tradingFee = sum > 0 ? usersum / sum : 0;

      res.send({ tradingFee });
    } catch (error) {
      res.status(500).send({ error: error });
    }
  },

  // async stakePuml(req, res) {
  //   var { amount, collect, feeward, staker } = helpers.parseFormData(req.body);

  //   let stakeResult = await blockchain.stakePuml(
  //     amount,
  //     collect,
  //     feeward,
  //     staker
  //   );
  //   if (stakeResult.success && stakeResult.transactionHash) {
  //     res.send({ success: true, transactionHash: stakeResult.transactionHash });
  //   } else {
  //     console.log("stakeResultErr", stakeResult.error);
  //     res.send({ success: false, error: { err: stakeResult.error } });
  //   }
  // },

  // async unstakePuml(req, res) {
  //   var { amount, staker } = helpers.parseFormData(req.body);

  //   let unstakeResult = await blockchain.withdrawPuml(amount, staker);
  //   if (unstakeResult.success && unstakeResult.transactionHash) {
  //     res.send({
  //       success: true,
  //       transactionHash: unstakeResult.transactionHash
  //     });
  //   } else {
  //     console.log("unstakeResultErr", unstakeResult.error);
  //     res.send({ success: false, error: { err: unstakeResult.error } });
  //   }
  // },

  // async rewardPuml(req, res) {
  //   var { amount, staker } = helpers.parseFormData(req.body);

  //   let rewardResult = await blockchain.withdrawPuml(amount, staker);
  //   if (rewardResult.success && rewardResult.transactionHash) {
  //     res.send({
  //       success: true,
  //       transactionHash: rewardResult.transactionHash
  //     });
  //   } else {
  //     console.log("rewardResultErr", rewardResult.error);
  //     res.send({ success: false, error: { err: rewardResult.error } });
  //   }
  // },

  // async getPumlFeeCollect(req, res) {
  //   try {
  //     var collects = await Pumlfeecollects.findAll({
  //       order: [["date_create", "DESC"]],
  //       collectorId: req.user.id
  //     });

  //     res.send({ collects });
  //   } catch (error) {
  //     res.status(500).send({ error: "Server error" });
  //   }
  // },

  // async pumlFeeCollect(req, res) {
  //   var { collects } = helpers.parseFormData(req.body);
  //   try {
  //     Pumlfeecollects.create({ collects: collects, collectorId: req.user.id });
  //     res.send({ success: true });
  //   } catch (error) {
  //     res.status(500).send({ error: error });
  //   }
  // },

  async claimPumlAPI(req, res) {
    try {
      var { userId, dateTime, amount } = helpers.parseFormData(req.body);
      var user = await Users.findOne({
        where: { _id: userId }
      });

      if (!user) return res.status(404).send({ error: "No user" });
      if (!amount) return res.status(404).send({ error: "No amount" });

      let userData = await blockchain.getUserData(user.wallet);

      // return res.send({
      //   userData
      // });

      const rewardStored = userData[1] / 1e18;
      const lastUpdatedTime = userData[0];

      var sum = 0;
      var usersum = 0;

      var trans = await Pumltransaction.findAll({
        where: {
          date_create: {
            [Op.gte]: new Date(lastUpdatedTime)
          }
        }
      });
      if (trans && trans.length > 0) {
        for (var tran of trans) {
          sum += tran.fee;
          if (tran.seller == user.wallet || tran.buyer == user.wallet) {
            usersum += tran.fee;
          }
        }
      }

      const tradingFee = sum > 0 ? usersum / sum : 0;

      const collectValue = await blockchain.collectPerUser(
        user.wallet,
        tradingFee
      );

      let claimTime = dateTime
        ? new Date(dateTime).getTime()
        : new Date().getTime();

      const leftHours =
        24 - (claimTime / 1000 - parseFloat(userData[0])) / 3600;

      if (leftHours < 0) {
        return res.send({
          error: "Allow to claim once in 24 hours",
          lastTime: new Date(parseFloat(userData[0]))
        });
      }

      if (amount > collectValue / 1e18 + rewardStored) {
        return res.send({
          error: "Please claim less than the reward stored",
          stored: collectValue / 1e18 + rewardStored
        });
      }

      let transferResult = await blockchain.claimPuml(
        user.wallet,
        amount,
        tradingFee
      );

      res.send({ transferResult });
    } catch (error) {
      res.status(500).send({ error: error });
    }
  }
};

module.exports = Controller;
