const jwt = require("jsonwebtoken");
const config = require("../config");

const check = (req, res, next, discard) => {
	if (req.headers && req.headers.authorization) {
		var parts = req.headers.authorization.split(" ");
		var token = parts[1];

		jwt.verify(token, config.jwt_hash, (error, user) => {
			if (error) {
				return res.status(401).send({error: "Invalid AccessToken"});
			}

			req.user = user;
			req.token = token;
			next();
		});
	}
	else {
		if (discard) 
			return res.status(401).send({error: "AccessToken is required"});

		next();
	}
}

const tokenPipe = (req, res, next) => check(req, res, next, false);
const tokenAccess = (req, res, next) => check(req, res, next, true);

module.exports = {
	tokenPipe,
	tokenAccess
}