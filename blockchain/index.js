const Web3 = require('web3');
const contract = require('truffle-contract');
const colors = require("colors");

const artifacts_engine = require('./Engine.json');
const secrets = require('./secrets.json');

const HDWalletProvider = require("@truffle/hdwallet-provider");
const provider = new HDWalletProvider(secrets.mnemonic,
'https://rinkeby.infura.io/v3/'+ secrets.projectId);

const web3 = new Web3(provider);
const engine = new web3.eth.Contract(artifacts_engine.abi, secrets.address_engine);

let accounts = [];


const test = async () => {
	let auction_id = await engine.methods.getAuctionId(3).call();
	// console.log(auction_id);
    // let offer = await engine.methods.offers(3).call(); 
    // let auction = await engine.methods.auctions(auction_id).call(); 
	// console.log(offer, auction);

	// let qwe = await engine.methods.automaticSetWinner(auction_id).send({
	// 	from: getMainAccount()
	// });

	// console.log(qwe);
	await auctionSetWinner(3);

	// let ahora = await engine.methods.ahora().call(); 
	// let result = await engine.methods.getAuctionId(5).call();
	// console.log("Ahora: ", ahora);
	// console.log("Auction: ", result);
    // let offers = await engine.methods.offers(0).call(); 
    // console.log("offers: ", offers);
    // let getTotalAuctions = await engine.methods.getTotalAuctions().call(); 
    // console.log("getTotalAuctions: ", getTotalAuctions);
};


const auctionSetWinner = async (chain_id) => {
	try {
		const account = await getMainAccount();
		const auction_id = await engine.methods.getAuctionId(chain_id).call();
		const info = await engine.methods.automaticSetWinner(auction_id).send({ 
			from: account
		});

		console.log(`Blockchain | Set winner for chain ${chain_id} successfuly ended`.green);
		// console.log(info);
	}
	catch(error) {
		console.log(`Blockchain | Set winner for chain ${chain_id} has end with errors`.red, error);
	}
};


const init = async () => {
	accounts = await web3.eth.getAccounts();
};


const getMainAccount = async () => {
	if (!accounts.length) {
		accounts = await web3.eth.getAccounts();
	}

	return accounts[0];
};


module.exports = {
	init,
	auctionSetWinner,
	getMainAccount
};
