const { DataTypes } = require('sequelize');
const { v4 } = require('uuid');

module.exports = (sequelize) => {
    return sequelize.define('tbl_featured',  {
        _id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: v4
        },
        created_by: {
            type: DataTypes.STRING,
            defaultValue: 'admin'
        },
        featured: DataTypes.STRING,
        featured_name: DataTypes.STRING,
        featured_price: DataTypes.FLOAT
    },
	{
		timestamps: false,

		// If don't want createdAt
		createdAt: false,

		// If don't want updatedAt
		updatedAt: false,
	});
}