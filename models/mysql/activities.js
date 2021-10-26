
const { DataTypes } = require('sequelize');
const { v4 } = require('uuid');

module.exports = (sequelize) => {
    return sequelize.define('tbl_activities', {
        _id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: v4
        },
        type: {
            type: DataTypes.STRING, //ENUM(["minted", "listed", "offered", "purchased", "following", "liked", "transferred"]),
            allowNull: false,
        },
        userId: DataTypes.STRING,
        toUserId: DataTypes.STRING,
        tokenId: DataTypes.STRING,
        offerId: DataTypes.STRING,
        price: DataTypes.INTEGER,
        date: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        }
    },
	{
		timestamps: false,

		// If don't want createdAt
		createdAt: false,

		// If don't want updatedAt
		updatedAt: false,
	});
}
