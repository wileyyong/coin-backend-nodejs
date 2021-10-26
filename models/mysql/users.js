const { DataTypes, Sequelize } = require('sequelize');
const { v4 } = require('uuid');

module.exports = (sequelize) => {
	return sequelize.define('tbl_users', {
		_id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: v4
		},
		wallet: {
			type: DataTypes.STRING,
			// allowNull: false
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'Username'
		},
		password: DataTypes.STRING,
		email: DataTypes.STRING,
		bio: DataTypes.STRING,
		twitter: DataTypes.STRING,
		instagram: DataTypes.STRING,
		link: DataTypes.STRING,
		avatar: {
			type: DataTypes.STRING,
			defaultValue: '/content/avatar/default.png'
		},
		cover: DataTypes.STRING,
		verified: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		featured: DataTypes.STRING,
		featured_name: DataTypes.STRING,
		featured_price: DataTypes.INTEGER,
		date_create: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		},
		following: {
			type: DataTypes.STRING,
			get() {
				var val = this.getDataValue('following');
				return val && val.split(';')
			},
			set(val) {
				this.setDataValue('following',val.join(';'));
			},
		},
		royalties: {
			type: DataTypes.INTEGER,
			defaultValue: 0
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