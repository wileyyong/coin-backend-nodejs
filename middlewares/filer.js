const fileUpload = require("express-fileupload");

const MAX_SIZE = 100;

module.exports = fileUpload({
	limits: { fileSize: MAX_SIZE * 1024 * 1024 },
	parseNested: true,
	abortOnLimit: true,
	limitHandler(req, res, next) {
		return res.status(413).send({error: `File is bigger than the ${MAX_SIZE} megabytes`});
	}
});
