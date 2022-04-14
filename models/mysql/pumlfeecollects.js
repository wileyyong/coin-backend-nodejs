const { DataTypes, Sequelize } = require('sequelize');
const { v4 } = require('uuid');
module.exports = (sequelize) => {
	return sequelize.define('tbl_pumlfeecollects', {
		_id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: v4
		},
		collectorId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		collects: DataTypes.FLOAT,
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