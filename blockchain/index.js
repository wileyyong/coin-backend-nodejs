const Web3 = require('web3');
const contract = require('truffle-contract');
const colors = require("colors");

const artifacts_engine = require('./Engine.json');
const artifacts_xsigma = require('./PUML721.json');
const secrets = require('./secrets.json');

const HDWalletProvider = require("@truffle/hdwallet-provider");
const provider = new HDWalletProvider(secrets.mnemonic, `https://rinkeby.infura.io/v3/${secrets.projectId}`);

const web3 = new Web3(provider);

let accounts = [];


const auctionSetWinner = async (chain_id) => {
	try {
		const engine = new web3.eth.Contract(artifacts_engine.abi, secrets.address_engine);
		const xsigma = new web3.eth.Contract(artifacts_xsigma.abi, secrets.address_xsigma);
		const account = await getMainAccount();
		const auction_id = await engine.methods.getAuctionId(chain_id).call();
		const info = await engine.methods.automaticSetWinner(auction_id).send({
			from: account
		});

		console.log(`Blockchain | Set winner for chain ${chain_id} successfuly ended`.green);
		// console.log(info);
	}
	catch (error) {
		console.log(`Blockchain | Set winner for chain ${chain_id} has end with errors`.red, error);
	}
};


const getMainAccount = async () => {
	const engine = new web3.eth.Contract(artifacts_engine.abi, secrets.address_engine);
	const xsigma = new web3.eth.Contract(artifacts_xsigma.abi, secrets.address_xsigma);
	if (!accounts.length) {
		accounts = await web3.eth.getAccounts();
	}

	return accounts[0];
};


const checkActualOffer = async (db_offer, db_token, cancel = false) => {
	const engine = new web3.eth.Contract(artifacts_engine.abi, secrets.address_engine);
	const xsigma = new web3.eth.Contract(artifacts_xsigma.abi, secrets.address_xsigma);
	var chain_id = db_token.chain_id;
	let owner = await xsigma.ownerOf(chain_id);
	let offer = await engine.offers(chain_id);

	if (owner != offer.creator) {
		return false;
	}
	else {
		if (offer.isAuction) {
			let auction = await engine.methods.auction(offer.idAuction).call();

			if (auction.currentBidOwner != db_offer.bids[0].user.wallet) {
				await engine.methods.cancelAuctionOfToken(chain_id).call();

				if (cancel) return false;
			}
		}
	}

	return true;
};


const getLastBid = async (chain_id) => {
	const engine = new web3.eth.Contract(artifacts_engine.abi, secrets.address_engine);
	const xsigma = new web3.eth.Contract(artifacts_xsigma.abi, secrets.address_xsigma);
	const auction_id = await engine.methods.getAuctionId(chain_id).call();
	const auction = await engine.methods.auctions(auction_id).call();
	const last_bid = auction.currentBidOwner;
	const last_bid_amount = Web3.utils.fromWei(auction.currentBidAmount, 'ether');

	return [last_bid, Number(last_bid_amount)];
};


const checkOwner = async (chain_id) => {
	let owner = await xsigma.methods.ownerOf(chain_id).call();
	let offer = await engine.methods.offers(chain_id).call();

	return (owner == offer.creator);
};


const checkBids = async (chain_id, last_bid, cancel = false) => {
	let offer = await engine.methods.offers(chain_id).call();

	if (offer.isAuction) {
		let auction = await engine.methods.auction(offer.idAuction).call();

		if (auction.currentBidOwner != last_bid) {
			if (cancel) await engine.methods.cancelAuctionOfToken(chain_id).call();
			return false;
		}
	}

	return true;
};


const test = async () => {
	// for (var a = 0;a < 10;a++) {
	// 	console.log(123);
	// 	console.log(await engine.methods.ahora().call());
	// }
	// const offer_id = 3;
	// const offer = await engine.methods.offers(offer_id).call();
	// console.log(offer);
	// if (offer.isAuction) {
	// 	const auction = await engine.methods.auctions(offer.idAuction).call();
	// 	console.log(auction);
	// }

	// console.log(await engine.methods.getOfferId(1).call());

	console.log(await getLastBid(5));
};


// test();


module.exports = {
	auctionSetWinner,
	getMainAccount,
	checkActualOffer,
	checkOwner,
	checkBids,
	getLastBid
};
