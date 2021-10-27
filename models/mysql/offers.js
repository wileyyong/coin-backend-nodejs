const { DataTypes, Sequelize } = require('sequelize');
const { v4 } = require('uuid');

module.exports = (sequelize) => {
	return sequelize.define('tbl_offers', {
		_id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: v4
		},
		type: {
			type: DataTypes.ENUM(["auction", "direct", "both"]),
			allowNull: false,
		},
		status: {
			type: DataTypes.ENUM(["pending", "expired", "completed", "closed"]),
			defaultValue: 'pending',
		},
		tokenId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		creatorId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		buyerId: {
			type: DataTypes.STRING,
		},
		purchase_type: DataTypes.ENUM(["auction", "direct"]),
		categories: DataTypes.JSON,
		// {
		// 	type: Sequelize.STRING,
		// 	get() {
		// 		var val = this.getDataValue('categories');
		// 		return val;
		// 	},
		// 	set(val) {
		// 		this.setDataValue('categories',val);
		// 	},
		// },
		bids: DataTypes.JSON,
		offer_price: DataTypes.FLOAT,
		min_bid: DataTypes.FLOAT,
		date_sell: DataTypes.DATE,
		date_start: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		},
		date_end: DataTypes.DATE,
		date_create: {
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