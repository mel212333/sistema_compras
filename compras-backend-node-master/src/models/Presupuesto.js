const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Presupuesto extends Model {}

Presupuesto.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_requerimiento: { type: DataTypes.INTEGER, allowNull: false },
    id_proveedor: { type: DataTypes.INTEGER, allowNull: false },
    pdf_url: { type: DataTypes.TEXT, allowNull: true },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
    pago_tipo: { type: DataTypes.STRING(100), defaultValue: "Contado" },
    anticipo_porcentaje: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    dias_plazo: { type: DataTypes.INTEGER, allowNull: true },
    forma_pago: { type: DataTypes.STRING(100), allowNull: true },
    plazo_entrega: { type: DataTypes.STRING(100), allowNull: true },
    lugar_entrega: { type: DataTypes.STRING(255), allowNull: true },
    moneda: { type: DataTypes.STRING(10), defaultValue: "ARS" },
    tipo_cambio: { type: DataTypes.DECIMAL(12, 4), allowNull: true },
    tipo_cambio_fecha: { type: DataTypes.DATE, allowNull: true },
    tipo_cambio_fuente: { type: DataTypes.STRING(100), allowNull: true },
    incluye_iva: { type: DataTypes.BOOLEAN, defaultValue: true },
    validez_dias: { type: DataTypes.INTEGER, allowNull: true },
    entrega_dias: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    modelName: "Presupuesto",
    tableName: "presupuestos",
    timestamps: true,
  }
);

module.exports = Presupuesto;
