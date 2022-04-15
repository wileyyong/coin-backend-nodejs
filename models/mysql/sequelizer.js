const { DataTypes, Sequelize } = require('sequelize');
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
const pumlfeecollects = require('./pumlfeecollects');
const qrcode = require('./qrcode');

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

const Activities = activities(sequelize);
const Categories = categories(sequelize);
const Collections = collections(sequelize);
const Featured = featured(sequelize);
const Offers = offers(sequelize);
const Tokens = tokens(sequelize);
const Users = users(sequelize);
const Owners = owners(sequelize);
const Bids = bids(sequelize);
const ApprovedTokens = approvedtokens(sequelize);
const Pumltransaction = pumltransaction(sequelize);
const Pumlfeecollects = pumlfeecollects(sequelize);
const Qrcode = qrcode(sequelize);

Activities.belongsTo(Users, {
  targetKey: '_id',
  foreignKey: 'userId',
  as: 'user',
});
Users.hasMany(Activities, {
  sourceKey: '_id',
  foreignKey: 'userId',
  as: 'activitesSent',
});

Activities.belongsTo(Users, {
  targetKey: '_id',
  foreignKey: 'toUserId',
  as: 'to_user',
});
Users.hasMany(Activities, {
  sourceKey: '_id',
  foreignKey: 'toUserId',
  as: 'activitesReceived',
});

Activities.belongsTo(Tokens, {
  targetKey: '_id',
  foreignKey: 'tokenId',
  as: 'token',
});
Tokens.hasMany(Activities, {
  sourceKey: '_id',
  foreignKey: 'tokenId',
  as: 'activities',
});

Activities.belongsTo(Offers, {
  targetKey: '_id',
  foreignKey: 'offerId',
  as: 'offer',
});
Offers.hasMany(Activities, {
  sourceKey: '_id',
  foreignKey: 'offerId',
  as: 'activities',
});

Collections.belongsTo(Users, {
  targetKey: '_id',
  foreignKey: 'creatorId',
  as: 'creator',
});
Users.hasMany(Collections, {
  sourceKey: '_id',
  foreignKey: 'creatorId',
  as: 'collections',
});

Offers.belongsTo(Tokens, {
  targetKey: '_id',
  foreignKey: 'tokenId',
  as: 'token',
});
Tokens.hasOne(Offers, {
  sourceKey: '_id',
  foreignKey: 'tokenId',
  as: 'offer'
});

Offers.belongsTo(Users, {
  targetKey: '_id',
  foreignKey: 'creatorId',
  as: 'creator',
});
Users.hasMany(Offers, {
  sourceKey: '_id',
  foreignKey: 'creatorId',
  as: 'offersCreated',
});

Offers.belongsTo(Users, {
  targetKey: '_id',
  foreignKey: 'buyerId',
  as: 'buyer',
});
Users.hasMany(Offers, {
  sourceKey: '_id',
  foreignKey: 'buyerId',
  as: 'offersBought',
});

Tokens.belongsTo(Collections, {
  targetKey: '_id',
  foreignKey: 'collectionsId',
  as: 'collections',
});
Collections.hasMany(Tokens, {
  sourceKey: '_id',
  foreignKey: 'collectionsId',
  as: 'tokens',
});

Tokens.belongsTo(Users, {
  targetKey: '_id',
  foreignKey: 'creatorId',
  as: 'creator',
});
Users.hasMany(Tokens, {
  sourceKey: '_id',
  foreignKey: 'creatorId',
  as: 'tokens',
});

module.exports = {
  sequelize,
  Activities,
  Categories,
  Collections,
  Featured,
  Offers,
  Tokens,
  Users,
  Owners,
  Bids,
  ApprovedTokens,
  Pumltransaction,
  Pumlfeecollects,
  Qrcode
};