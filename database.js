const mongoose = require("mongoose");

const connect = () => {
	return mongoose.connect("mongodb://localhost:27017/PUML", {
		useCreateIndex: true,
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => console.log("MongoDB success connected!".cyan))
	.catch((e) => console.log("MongoDB connection error...\n".red, e));
};

module.exports = { connect };