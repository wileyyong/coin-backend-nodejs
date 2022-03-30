const { DataTypes, Sequelize } = require('sequelize');
const { v4 } = require('uuid');
module.exports = (sequelize) => {
	return sequelize.define('tbl_approvedtokens', {
		_id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: v4
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		tokenId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		description: DataTypes.STRING,
		media: {
			type: DataTypes.STRING,
			defaultValue: "/media/html.jpg"
		},
		media_type: DataTypes.STRING,
		attributes: DataTypes.STRING,
		// {
		// 	type: Sequelize.STRING,
		// 	get() {
		// 		var val = this.getDataValue('attributes');
		// 		return val && val.split(';');
		// 	},
		// 	set(val) {
		// 		this.setDataValue('attributes',val.join(';'));
		// 	},
		// 		defaultValue: ''
		// },
		thumbnail: {
			type: DataTypes.STRING,
			defaultValue: null
		},
		chain_id: {
			type: DataTypes.STRING,
		},
		royalties: {
			type: DataTypes.FLOAT,
			defaultValue: 0
		},
		collectionsId: {
			type: DataTypes.STRING,
			defaultValue: null
		},
		categories: DataTypes.JSON,
		// {
		// 	type: Sequelize.STRING,
		// 	get() {
		// 		var val = this.getDataValue('categories');
		// 		return val && val.split(';');
		// 	},
		// 	set(val) {
		// 		this.setDataValue('categories',val.join(';'));
		// 	},
		// },
		creatorId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		owners: DataTypes.JSON,
		// {
		// 	type: Sequelize.STRING,
		// 	get() {
		// 		var val = this.getDataValue('owners');
		// 		return val && val.split(';');
		// 	},
		// 	set(val) {
		// 		this.setDataValue('owners',val.join(';'));
		// 	},
		// },
		is_sponsored: {
			type: DataTypes.BOOLEAN,
			defaultValue: undefined
		},
		locked: {
			type: DataTypes.STRING,
			defaultValue: undefined,
		},
		offchain: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		likes: DataTypes.JSON,
		// {
		// 	type: Sequelize.STRING,
		// 	get() {
		// 		var val = this.getDataValue('likes');
		// 		return val && val.split(';');
		// 	},
		// 	set(val) {
		// 		if (typeof(val) == "object")
		// 			this.setDataValue('likes',val.join(';'));
		// 		else
		// 		this.setDataValue('likes',val);
		// 	},
		// },
		date_create: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		},
		date_resale: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		},
		blockchain: {
			type: DataTypes.STRING,
			defaultValue: "ETH"
		},
		stake: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
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