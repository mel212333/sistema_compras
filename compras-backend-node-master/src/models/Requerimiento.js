const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class Requerimiento extends Model { }

Requerimiento.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    id_usuario: { type: DataTypes.INTEGER, allowNull: false },

    descripcion: { type: DataTypes.TEXT, allowNull: false },


    estado: {
      type: DataTypes.ENUM(
        "PENDIENTE",         // heredado de antes
        "APROBADO",          // heredado de antes
        "RECHAZADO",         // heredado de antes
        "BORRADOR",          // nuevo valor
        "PEND_APROB_N1",     // nuevo valor
        "PEND_APROB_N2",     // nuevo valor
        "FINALIZADO"         // cierre del circuito de compras
      ),
      defaultValue: "BORRADOR",
    },

    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

    aprobado_n1_por: { type: DataTypes.INTEGER, allowNull: true },
    fecha_aprob_n1: { type: DataTypes.DATE, allowNull: true },

    aprobado_n2_por: { type: DataTypes.INTEGER, allowNull: true },
    fecha_aprob_n2: { type: DataTypes.DATE, allowNull: true },

    motivo_rechazo: { type: DataTypes.TEXT, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    fecha_envio: {
      type: DataTypes.DATE,
      allowNull: true
    },

    fecha_ultimo_movimiento: {
      type: DataTypes.DATE,
      allowNull: true
    },

    fecha_rechazo: {
      type: DataTypes.DATE,
      allowNull: true
    },
    planta: {
  type: DataTypes.STRING,
  allowNull: true,
},

centro_costo: {
  type: DataTypes.STRING,
  allowNull: true,
},

almacen: {
  type: DataTypes.STRING,
  allowNull: true,
},

sector_id: {
  type: DataTypes.INTEGER,
  allowNull: true,
},

es_express: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false,
},

justificacion_express: {
  type: DataTypes.TEXT,
  allowNull: true,
},

documentacion_express_url: {
  type: DataTypes.TEXT,
  allowNull: true,
},


  },
  {
    sequelize,
    modelName: "Requerimiento",
    tableName: "requerimientos",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt"
  }




);

module.exports = Requerimiento;
