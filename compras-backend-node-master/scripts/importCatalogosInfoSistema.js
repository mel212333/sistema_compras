require("dotenv").config();

const sequelize = require("../src/config/database");

const plantas = ["FABRICA", "CAMPO"];

const centrosCosto = [
  ["0", "C.Costo No Informado"],
  ["10", "Producci\u00f3n"],
  ["20", "Destiler\u00eda"],
  ["30", "Servicios de F\u00e1brica"],
  ["40", "Cosecha"],
  ["50", "Cultivo"],
  ["60", "Serv.Grales.Campo"],
  ["70", "Producto Term.Az\u00facar"],
  ["80", "Producto Term.Alcohol"],
  ["90", "Administracc.Gral.Jujuy"],
  ["100", "Bienes de Uso"],
  ["105", "Plantacion Ca\u00f1averales"],
  ["110", "Obras en Curso"],
  ["120", "Ventas Varias"],
  ["130", "Materiales a cargo"],
  ["140", "Materiales a cambio"],
  ["150", "Servicio de Cosecha a Terceros"],
  ["160", "MERCADERIA DADA EN PRESTAMO"],
  ["170", "MERCEDERIA RECIBIDA EN PRESTAMO"],
  ["180", "MERMA DE MATERIALES"],
  ["190", "Serv. Campo a Terceros"],
  ["200", "Norma"],
  ["6113", "REPTOS.FRACCIONADORA"],
  ["9021", "Aparicio Lavanderia"],
];

const almacenes = [
  ["2", "Deposito Central"],
  ["3", "Dep\u00f3sito F\u00e1brica"],
  ["4", "Dep Seg Industrial"],
  ["7", "Dep\u00f3sito Aserradero"],
  ["9", "Dep. Salon Az. Envas"],
  ["63", "Dep. Mat. Obsoleto"],
  ["110", "Almac. Producci\u00f3n"],
  ["120", "Almac. Destileria"],
  ["130", "Almac.Serv.Grales.Fa"],
  ["240", "Alm. Prod Terminado"],
  ["320", "Alm. Adm Gral Jujuy"],
  ["6", "Deposito Trapiche"],
  ["81", "Mater.Obsol.Dep.01"],
  ["83", "Mater.Obsol.Dep.03"],
  ["84", "Mater.Obsol.Dep.04"],
  ["86", "Mater.Obsol.Dep.06"],
  ["89", "Mater.Obsol.Dep.09"],
  ["93", "Mater.Obsol.Dep.63"],
];

async function main() {
  const [sector] = await sequelize.query(
    "SELECT id FROM sectores WHERE LOWER(nombre) = LOWER('Sistemas') LIMIT 1",
    { type: sequelize.QueryTypes.SELECT }
  );
  const sectorId = sector?.id || 3;

  await sequelize.transaction(async (transaction) => {
    await sequelize.query(
      `
        CREATE TABLE IF NOT EXISTS plantas (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL
        )
      `,
      { transaction }
    );

    await sequelize.query(
      `
        CREATE TABLE IF NOT EXISTS centros_costo (
          id SERIAL PRIMARY KEY,
          codigo VARCHAR(255) NOT NULL,
          descripcion VARCHAR(255) NOT NULL,
          sector_id INTEGER NOT NULL REFERENCES sectores(id)
        )
      `,
      { transaction }
    );

    await sequelize.query(
      `
        CREATE TABLE IF NOT EXISTS almacenes (
          id SERIAL PRIMARY KEY,
          codigo TEXT NOT NULL UNIQUE,
          descripcion TEXT NOT NULL
        )
      `,
      { transaction }
    );

    await sequelize.query("TRUNCATE TABLE plantas RESTART IDENTITY", { transaction });
    await sequelize.query("TRUNCATE TABLE centros_costo RESTART IDENTITY", { transaction });
    await sequelize.query("TRUNCATE TABLE almacenes RESTART IDENTITY", { transaction });

    for (const nombre of plantas) {
      await sequelize.query("INSERT INTO plantas (nombre) VALUES (:nombre)", {
        replacements: { nombre },
        transaction,
      });
    }

    for (const [codigo, descripcion] of centrosCosto) {
      await sequelize.query(
        `
          INSERT INTO centros_costo (codigo, descripcion, sector_id)
          VALUES (:codigo, :descripcion, :sectorId)
        `,
        {
          replacements: { codigo, descripcion, sectorId },
          transaction,
        }
      );
    }

    for (const [codigo, descripcion] of almacenes) {
      await sequelize.query(
        "INSERT INTO almacenes (codigo, descripcion) VALUES (:codigo, :descripcion)",
        {
          replacements: { codigo, descripcion },
          transaction,
        }
      );
    }
  });

  for (const table of ["plantas", "centros_costo", "almacenes"]) {
    const [row] = await sequelize.query(`SELECT COUNT(*)::int AS count FROM ${table}`, {
      type: sequelize.QueryTypes.SELECT,
    });
    console.log(`${table}: ${row.count}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
