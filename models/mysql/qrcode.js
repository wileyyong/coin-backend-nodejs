const { DataTypes, Sequelize } = require('sequelize');
const { v4 } = require('uuid');
module.exports = (sequelize) => {
	return sequelize.define('tbl_qrcode', {
		_id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: v4
		},
		userId: {
			type: DataTypes.STRING
		},
		ethAddress: {
			type: DataTypes.STRING
		},
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