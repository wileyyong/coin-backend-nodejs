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
  `https://goerli.infura.io/v3/${secrets.projectId}`
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
      pumlx.methods.pickPuml(creator, winBidAmount * 0.73).send({
        from: account
      });
      pumlx.methods
        .pickPuml(secrets.fee17_address, winBidAmount * 0.73 * 0.63)
        .send({
          from: account
        });
      pumlx.methods
        .pickPuml(secrets.fee10_address, winBidAmount * 0.73 * 0.36)
        .send({
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
  if (!accounts.length) {
    if (blockchain === "ETH") {
      accounts = await web3.eth.getAccounts();
    } else {
      accounts = await web3Matic.eth.getAccounts();
    }

    console.log("accounts", accounts);
    return accounts[0];
  }
};

const claimPuml = async (claimer, amount) => {
  const account = await getMainAccount("ETH");

  try {
    const pumlContract = new web3.eth.Contract(
      artifacts_erc20.abi,
      secrets.address_pumlx
    );

    const balance = await pumlContract.methods
      .balanceOf(secrets.address_pumlx_pool)
      .call();

    const bvalue = parseFloat(balance.balance) / 1e18;

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
      .claimApi(claimer, web3.utils.toWei("" + amount))
      .send({
        from: account
      });

    if (result.status === true) {
      return { success: true, transactionHash: result.transactionHash };
    }
    return { success: false, error: "Failed to transfer pumlx!" };
  } catch (error) {
    return { success: false, error: error };
  }
};

module.exports = {
  auctionSetWinner,
  getMainAccount,
  claimPuml
};
