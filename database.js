const mongoose = require("mongoose");
const config = require("config");

const connect = () => {
	return mongoose.connect(config.mongo_url, {
		useCreateIndex: true,
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => console.log("MongoDB success connected!".cyan))
	.catch((e) => console.log("MongoDB connection error...\n".red, e));
};

module.exports = { connect };