const express = require("express");
const path = require("path");

const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const swaggerDocs = require("../docs");


const router = express.Router();
const content_path = path.resolve(__dirname, "..", "content");
const auth_routes = require("./auth");
const tokens_routes = require("./tokens");
const offers_routes = require("./offers");
const collections_routes = require("./collections");
const categories_routes = require("./categories");
const users_routes = require("./users");
const activities_routes = require("./activities");
const api_routes = require("./api");

// router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerConfig));
router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
router.use("/content", express.static(content_path));

router.use("/api/auth", auth_routes);
router.use("/api/tokens", tokens_routes);
router.use("/api/offers", offers_routes);
router.use("/api/collections", collections_routes);
router.use("/api/categories", categories_routes);
router.use("/api/users", users_routes);
router.use("/api/activities", activities_routes);
router.use("/api", api_routes);

router.get("/", (req, res) => res.redirect("/docs"));
router.get("*", (req, res) => res.status(404).send("Page not found!"));

module.exports = router;