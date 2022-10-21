const { DataTypes, Sequelize } = require("sequelize");
const { v4 } = require("uuid");
module.exports = (sequelize) => {
  return sequelize.define(
    "tbl_pumltransaction",
    {
      _id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: v4
      },
      seller: {
        type: DataTypes.STRING,
        allowNull: false
      },
      buyer: {
        type: DataTypes.STRING,
        allowNull: false
      },
      fee: DataTypes.FLOAT,
      token: DataTypes.STRING,
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
      updatedAt: false
    }
  );
};
