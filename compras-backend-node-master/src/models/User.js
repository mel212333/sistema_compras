const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class User extends Model {}

//$2b$10$FRz/TY3TZWLx0O7.VIjxJuPrReS3p6n0Ly9Gc/IEVVU.HegSknjZu

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    name: { type: DataTypes.STRING, allowNull: false },

    email: { type: DataTypes.STRING, allowNull: false, unique: true },

    password: { type: DataTypes.STRING, allowNull: false },

    rol: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "USER",
    },

    sector_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
  }
);

module.exports = User;
