const Web3 = require("web3");
const contract = require("truffle-contract");
const colors = require("colors");

const artifacts_engine = require("./Engine.json");
const artifacts_maticengine = require("./MaticEngine.json");
const artifacts_puml = require("./PumlNFT.json");
const artifacts_erc20 = require("./IERC20.json");
const artifacts_stake = require("./PumlStake.json");
const secrets = require("./secrets.json");

const HDWalletProvider = require("@truffle/hdwallet-provider");
const provider = new HDWalletProvider(
  secrets.mnemonic,
  `https://rinkeby.infura.io/v3/${secrets.projectId}`
);
const maticProvider = new HDWalletProvider(
  secrets.mnemonic,
  `https://rpc-mumbai.maticvigil.com/v1/5f90531278ed55748f7d0819b3eade95d889fc53`
);

const web3 = new Web3(provider);
const web3Matic = new Web3(maticProvider);

let accounts = [];
// const engine = new web3.eth.Contract(artifacts_engine.abi, secrets.address_engine);
// const puml = new web3.eth.Contract(artifacts_puml.abi, secrets.address_puml);
// const engineMatic = new web3Matic.eth.Contract(artifacts_engine.abi, secrets.address_matic_engine);
// const pumlMatic = new web3Matic.eth.Contract(artifacts_puml.abi, secrets.address_matic_puml);

const auctionSetWinner = async (token, winBidAmount, creator) => {
  const _engineAddress = secrets.address_engine;
  try {
    const account = await getMainAccount(blockchain);
    if (token.blockchain === "ETH") {
      const auction_id = await new web3.eth.Contract(
        artifacts_engine.abi,
        _engineAddress
      ).methods
        .getAuctionId(token.chain_id)
        .call();
      const info = await new web3.eth.Contract(
        artifacts_engine.abi,
        _engineAddress
      ).methods
        .automaticSetWinner(auction_id)
        .send({
          from: account
        });
    } else if (token.blockchain === "MATIC") {
      const auction_id = await new web3Matic.eth.Contract(
        artifacts_maticengine.abi,
        secrets.address_matic_engine
      ).methods
        .getAuctionId(token.chain_id)
        .call();
      const info = await new web3Matic.eth.Contract(
        artifacts_maticengine.abi,
        secrets.address_matic_engine
      ).methods
        .automaticSetWinner(auction_id)
        .send({
          from: account
        });
    } else {
      const auction_id = await new web3.eth.Contract(
        artifacts_engine.abi,
        _engineAddress
      ).methods
        .getAuctionId(token.chain_id)
        .call();
      const info = await new web3.eth.Contract(
        artifacts_engine.abi,
        _engineAddress
      ).methods
        .automaticSetWinner(auction_id)
        .send({
          from: account
        });
      const pumlx = await new web3.eth.Contract(
        artifacts_stake.abi,
        secrets.address_stake
      );
      pumlx.methods.pickPuml(creator, winBidAmount).send({
        from: account
      });
    }

    console.log(
      `Blockchain | Set winner for chain ${chain_id} successfuly ended`.green
    );
    console.log(info);
  } catch (error) {
    console.log(
      `Blockchain | Set winner for chain ${chain_id} has end with errors`.red,
      error
    );
  }
};

const getMainAccount = async (blockchain) => {
  // if (!accounts.length) {
  if (blockchain === "ETH") {
    accounts = await web3.eth.getAccounts();
  } else {
    accounts = await web3Matic.eth.getAccounts();
  }

  console.log("accounts", accounts);
  return accounts[0];
  // }
};

const approveNft = async (chainIds) => {
  const account = await getMainAccount("ETH");

  try {
    for (let key in chainIds) {
      const contractAddress = key !== "0x0" ? key : secrets.address_puml;
      const PUMLContract = await new web3.eth.Contract(
        artifacts_puml.abi,
        contractAddress
      );
      for (let i = 0; i < chainIds[key].length; i++) {
        await PUMLContract.methods
          .approve(secrets.address_engine, chainIds[key][i])
          .send({
            from: account
          });
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error };
  }
};

const getUserData = async (user) => {
  const account = await getMainAccount("ETH");

  try {
    const pumlx = await new web3.eth.Contract(
      artifacts_stake.abi,
      secrets.address_stake
    );

    let result = await pumlx.methods.getUserData(user).call();

    return result;
  } catch (error) {
    return { success: false, error: error };
  }
};

const collectPerUser = async (user, feeward) => {
  const account = await getMainAccount("ETH");

  try {
    const pumlx = await new web3.eth.Contract(
      artifacts_stake.abi,
      secrets.address_stake
    );

    let result = await pumlx.methods.collectPerUser(user, feeward).call();

    return result;
  } catch (error) {
    return { success: false, error: error };
  }
};

const claimPuml = async (claimer, amount, feeCollect) => {
  const account = await getMainAccount("ETH");

  // try {
  const pumlContract = new web3.eth.Contract(
    artifacts_erc20.abi,
    secrets.address_pumlx
  );

  const balance = await pumlContract.methods
    .balanceOf(secrets.address_stake)
    .call();

  const bvalue = balance / 1e18;

  if (bvalue - amount < 0) {
    return {
      success: false,
      error: "Insufficient puml in Contract",
      balance: bvalue
    };
  }

  const pumlx = await new web3.eth.Contract(
    artifacts_stake.abi,
    secrets.address_stake
  );

  let result = await pumlx.methods
    .claimApi(claimer, web3.utils.toWei("" + amount), feeCollect)
    .send({
      from: account
    });

  if (result.status === true) {
    return { success: true, transactionHash: result.transactionHash };
  }
  return { success: false, error: "Failed to transfer pumlx!" };
  // } catch (error) {
  //   return { success: false, error: error };
  // }
};

const balanceOfPuml = async () => {
  const account = await getMainAccount("ETH");

  const pumlContract = new web3.eth.Contract(
    artifacts_erc20.abi,
    secrets.address_puml
  );

  const balance = await pumlContract.methods
    .balanceOfPuml(secrets.address_stake)
    .call();
  return { balance };
};

// const checkActualOffer = async (db_offer, db_token, cancel = false) => {
// 	var chain_id = db_token.chain_id;
// 	let owner = await puml.ownerOf(chain_id);
// 	let offer = await engine.offers(chain_id);

// 	if (owner != offer.creator) {
// 		return false;
// 	}
// 	else {
// 		if (offer.isAuction) {
// 			let auction = await engine.methods.auction(offer.idAuction).call();

// 			if (auction.currentBidOwner != db_offer.bids[0].user.wallet) {
// 				await engine.methods.cancelAuctionOfToken(chain_id).call();

// 				if (cancel) return false;
// 			}
// 		}
// 	}

// 	return true;
// };

// const getLastBid = async (chain_id) => {
// 	const auction_id = await engine.methods.getAuctionId(chain_id).call();
// 	const auction = await engine.methods.auctions(auction_id).call();
// 	const last_bid = auction.currentBidOwner;
// 	const last_bid_amount = Web3.utils.fromWei(auction.currentBidAmount, 'ether');

// 	return [last_bid, Number(last_bid_amount)];
// };

// const checkOwner = async (chain_id) => {
// 	let owner = await puml.methods.ownerOf(chain_id).call();
// 	let offer = await engine.methods.offers(chain_id).call();

// 	return (owner == offer.creator);
// };

// const checkBids = async (chain_id, last_bid, cancel = false) => {

// 	let offer = await engine.methods.offers(chain_id).call();

// 	if (offer.isAuction) {
// 		let auction = await engine.methods.auction(offer.idAuction).call();

// 		if (auction.currentBidOwner != last_bid) {
// 			if (cancel) await engine.methods.cancelAuctionOfToken(chain_id).call();
// 			return false;
// 		}
// 	}

// 	return true;
// };

// const test = async () => {
// 	// for (var a = 0;a < 10;a++) {
// 	// 	console.log(123);
// 	// 	console.log(await engine.methods.ahora().call());
// 	// }
// 	// const offer_id = 3;
// 	// const offer = await engine.methods.offers(offer_id).call();
// 	// console.log(offer);
// 	// if (offer.isAuction) {
// 	// 	const auction = await engine.methods.auctions(offer.idAuction).call();
// 	// 	console.log(auction);
// 	// }

// 	// console.log(await engine.methods.getOfferId(1).call());

// 	console.log(await getLastBid(5));
// };

// test();

module.exports = {
  auctionSetWinner,
  getMainAccount,
  // buyToken,
  // bidToken,
  // stakePuml,
  // withdrawPuml,
  approveNft,
  getUserData,
  collectPerUser,
  claimPuml,
  balanceOfPuml
  // checkActualOffer,
  // checkOwner,
  // checkBids,
  // getLastBid
};
