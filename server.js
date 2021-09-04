const express = require("express");
const colors = require("colors");
const config = require("./config/dev.json");
const cors = require("cors");
const cron = require("./cron");

const database = require("./database").connect().then(cron.start);
const routes = require("./routes");
const app = express();

app.disable("etag");
app.disable("x-powered-by");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(routes);

app.use((err, req, res, next) => {
	// var is_custom = typeof (err) == "string";
	// res.status(500).send({ error: (is_custom ? err : "Server error") });
	res.status(500).send({ error: "Server error" });
	console.log(err);
});

app.listen(config.api_port, () => {
	console.log(`Server started at ${config.api_port}`.cyan);
});