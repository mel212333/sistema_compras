const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Adjudicacion extends Model {}

Adjudicacion.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_requerimiento: { type: DataTypes.INTEGER, allowNull: false },
    id_requerimiento_item: { type: DataTypes.INTEGER, allowNull: false },
    id_presupuesto_item: { type: DataTypes.INTEGER, allowNull: false },
    cantidad_adjudicada: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    modelName: "Adjudicacion",
    tableName: "adjudicaciones",
    timestamps: true,
  }
);

module.exports = Adjudicacion;
