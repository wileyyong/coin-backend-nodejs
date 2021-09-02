const express = require("express");
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

app.listen(8080, () => {
	console.log(`Server started at ${8080}`.cyan);
});
