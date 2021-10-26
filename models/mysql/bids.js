const { DataTypes } = require('sequelize');
const { v4 } = require('uuid');

module.exports = (sequelize) => {
	return sequelize.define('tbl_bids', {
        _id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: v4
        },
		user: {
			type: DataTypes.STRING,
			allowNull: false
		},
		price: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		hash: {
			type: DataTypes.STRING,
			allowNull: false
		},
		date: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		},
    },
	{
		timestamps: false,

		// If don't want createdAt
		createdAt: false,

		// If don't want updatedAt
		updatedAt: false,
	});
}