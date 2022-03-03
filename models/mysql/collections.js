const { DataTypes, Sequelize } = require('sequelize');
const { v4 } = require('uuid');

module.exports = (sequelize) => {
    return sequelize.define('tbl_collections', {
		_id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: v4
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		symbol: DataTypes.STRING,
		description: DataTypes.STRING,
		short: DataTypes.STRING,
		image: DataTypes.STRING,
		cover: DataTypes.STRING,
		creatorId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		contract_address: DataTypes.STRING,
		engine_address: DataTypes.STRING,
		network: {
			type: DataTypes.STRING,
			defaultValue: "ETH"
		},
		date_create: {
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