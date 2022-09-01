const { Users } = require("../../models/mysql/sequelizer");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../../config/dev-mysql.json");

const Controller = {
  async signIn(req, res) {
    try {
      var { email, password } = req.body;

      if (!email || !password)
        return res.status(400).send({ error: "Not all fields has filled" });

      password = crypto
        .createHmac("sha256", config.PASSWORD_HASH)
        .update(password)
        .digest("hex");

      var user = await Users.findOne({
        where: {
          email,
          password
        }
      });
      if (!user)
        return res
          .status(404)
          .send({ error: "User with this email and password not found" });

      var token = jwt.sign({ id: user._id }, config.JWT_HASH);
      res.send({ token });
    } catch (error) {
      res.status(500).send({ error: "Server error" });
    }
  },

  async signUp(req, res) {
    try {
      var { email, name, password } = req.body;

      if (!email || !name || !password)
        return res.status(422).send({ error: "Not all fields has filled" });

      password = crypto
        .createHmac("sha256", config.PASSWORD_HASH)
        .update(password)
        .digest("hex");

      var user_exist = await Users.count({
        where: {
          email
        }
      });
      if (user_exist && user_exist > 0)
        return res.status(404).send({ error: "User already exist" });

      var user = await Users.create({
        email,
        name,
        password
      });

      var token = jwt.sign({ id: user._id }, config.JWT_HASH);
      res.send({ token });
    } catch (error) {
      res.status(500).send({ error: "Server error" });
    }
  },

  async byWallet(req, res) {
    try {
      var { wallet } = req.body;

      if (!wallet)
        return res.status(422).send({ error: "Not all fields has filled" });

      var user = await Users.findOne({
        where: {
          wallet
        }
      });

      if (!user) {
        user = await Users.create({
          wallet,
          name: "User" + (10000 + Math.floor(Math.random() * 90000))
        });
      }

      var token = jwt.sign({ id: user._id }, config.JWT_HASH);
      res.send({ token });
    } catch (error) {
      res.status(500).send({ error: "Server error" });
    }
  }
};

module.exports = Controller;
