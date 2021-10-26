const { DataTypes } = require('sequelize');
const { v4 } = require('uuid');

module.exports = (sequelize) => {
    return sequelize.define('tbl_categories', {
        _id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: v4
        },
        name: DataTypes.STRING,
        hidden: {
            type: DataTypes.STRING,
            defaultValue: DataTypes.BOOLEAN,
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