const { Sequelize } = require('sequelize');
const config = require('../../config/dev-mysql.json');
const mysql2 = require('mysql2');
const activities = require('./activities');
const categories = require('./categories');
const collections = require('./collections');
const featured = require('./featured');
const offers = require('./offers');
const tokens = require('./tokens');
const users = require('./users');
const owners = require('./owners');
const bids = require('./bids');
const approvedtokens = require('./approvedtokens');
const pumltransaction = require('./pumltransaction');

const sequelize = new Sequelize({
  username: config.USERNAME,
  password: config.PASSWORD,
  database: config.DATABASE,
  host: config.ENDPOINT,
  port: config.PORT,
  dialect: 'mysql',
  dialectModule: mysql2,
  define: {
    charset: 'utf8',
    collate: 'utf8_general_ci',
  },
  pool: {
    min: 1,
    max: 2,
  },
});

activities(sequelize);
categories(sequelize);
collections(sequelize);
featured(sequelize);
offers(sequelize);
tokens(sequelize);
users(sequelize);
owners(sequelize);
bids(sequelize);
approvedtokens(sequelize);
pumltransaction(sequelize);

sequelize
  .sync({
    force: false,
  })
  .then(() => {
    console.log('Successfully updated database schema');
  })
  .catch(err => {
    console.error(err);
    console.log('Failed to update database schema');
  });
