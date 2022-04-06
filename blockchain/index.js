const Web3 = require('web3');
const contract = require('truffle-contract');
const colors = require("colors");

const artifacts_engine = require('./Engine.json');
const artifacts_maticengine = require('./MaticEngine.json');
const artifacts_puml = require('./PumlNFT.json');
const artifacts_erc20 = require('./IERC20.json');
const artifacts_stake = require('./PumlStake.json');
const secrets = require('./secrets.json');

const HDWalletProvider = require("@truffle/hdwallet-provider");
const provider = new HDWalletProvider(secrets.mnemonic, `https://rinkeby.infura.io/v3/${secrets.projectId}`);
const maticProvider = new HDWalletProvider(secrets.mnemonic, `https://rpc-mumbai.maticvigil.com/v1/5f90531278ed55748f7d0819b3eade95d889fc53`);

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
			const auction_id = await new web3.eth.Contract(artifacts_engine.abi, _engineAddress).methods.getAuctionId(token.chain_id).call();
			const info = await new web3.eth.Contract(artifacts_engine.abi, _engineAddress).methods.automaticSetWinner(auction_id).send({
				from: account
			});
		} else if (token.blockchain === "MATIC") {
			const auction_id = await new web3Matic.eth.Contract(artifacts_maticengine.abi, secrets.address_matic_engine).methods.getAuctionId(token.chain_id).call();
			const info = await new web3Matic.eth.Contract(artifacts_maticengine.abi, secrets.address_matic_engine).methods.automaticSetWinner(auction_id).send({
				from: account
			});
		} else {
			const auction_id = await new web3.eth.Contract(artifacts_engine.abi, _engineAddress).methods.getAuctionId(token.chain_id).call();
			const info = await new web3.eth.Contract(artifacts_engine.abi, _engineAddress).methods.automaticSetWinner(auction_id).send({
				from: account
			});
			const pumlx = await new web3.eth.Contract(artifacts_erc20.abi, secrets.address_pumlx);
			pumlx.methods.transfer(creator, winBidAmount).send({
				from: account
			});
		}
		

		console.log(`Blockchain | Set winner for chain ${chain_id} successfuly ended`.green);
		console.log(info);
	}
	catch (error) {
		console.log(`Blockchain | Set winner for chain ${chain_id} has end with errors`.red, error);
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

const buyToken = async (tokenId, price, buyerAddress, sellerAddress, buyPrice, engineAddress) => {
	const account = await getMainAccount("ETH");
	const _engineAddress = engineAddress !== '' ? engineAddress : secrets.address_engine;
	try {
		let result = await new web3.eth.Contract(artifacts_engine.abi, _engineAddress).methods.buy(tokenId, buyerAddress).send({
			from: account,
			value: web3.utils.toWei('' + price)
		})
		if(result.status === true) {
			const pumlx = await new web3.eth.Contract(artifacts_erc20.abi, secrets.address_pumlx);
			const pumlresult = await pumlx.methods.transfer(sellerAddress, web3.utils.toWei('' + buyPrice * 0.973)).send({
				from: account
			});
			if(pumlresult.status === true) {
				return { success: true , transactionHash: result.transactionHash };
			} else {
				return { success: false, error: 'Failed to send to buyer!' };
			}
		}
		return { success: false, error: 'Failed to buy this item directly!' };
	}
	catch(error) {
		return { success: false, error: error };
	}
};

const bidToken = async (tokenId, price, bidderAddress, engineAddress) => {
	const account = await getMainAccount("ETH");
	const _engineAddress = engineAddress !== '' ? engineAddress : secrets.address_engine;
	try {
		const auction_id = await new web3.eth.Contract(artifacts_engine.abi, _engineAddress).methods.getAuctionId(tokenId).call();
		let result = await new web3.eth.Contract(artifacts_engine.abi, _engineAddress).methods.bid(auction_id, bidderAddress).send({
			from: account,
			value: web3.utils.toWei('' + price)
		})
		if(result.status === true) {
			return { success: true , transactionHash: result.transactionHash };
		}
		return { success: false, error: 'Failed to bid this item directly!' };
	}
	catch(error) {
		return { success: false, error: error };		
	}
};

const stakePuml = async (amount, transFee, staker) => {
	const account = await getMainAccount("ETH");
	
	try {
		
		let result = await new web3.eth.Contract(artifacts_stake.abi, secrets.address_stake).methods.stake(amount, web3.utils.toWei('' + transFee), staker).send({
			from: account
		})
		if(result.status === true) {
			return { success: true , transactionHash: result.transactionHash };
		}
		return { success: false, error: 'Failed to stake pumlx!' };
	}
	catch(error) {
		return { success: false, error: error };		
	}
};

const withdrawPuml = async (amount, staker) => {
	const account = await getMainAccount("ETH");
	
	try {

		const pumlx = await new web3.eth.Contract(artifacts_erc20.abi, secrets.address_pumlx);
		let result = await pumlx.methods.transfer(staker, web3.utils.toWei('' + amount)).send({
			from: account
		});
		if(result.status === true) {
			return { success: true , transactionHash: result.transactionHash };
		}
		return { success: false, error: 'Failed to unstake pumlx!' };
	}
	catch(error) {
		return { success: false, error: error };		
	}
};

const approveNft = async (contract_address, chainIds) => {
	const account = await getMainAccount("ETH");
	
	try {
		const PUMLContract = await new web3.eth.Contract(artifacts_puml.abi, contract_address);
		for (let i = 0; i < chainIds.length; i++) {
			await PUMLContract.methods.approve(secrets.address_engine, chainIds[i]).send({
				from: account
			})
		}
		return { success: true };
	}
	catch(error) {
		return { success: false, error: error };
	}
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
	buyToken,
	bidToken,
	stakePuml,
	withdrawPuml,
	approveNft
	// checkActualOffer,
	// checkOwner,
	// checkBids,
	// getLastBid
};
