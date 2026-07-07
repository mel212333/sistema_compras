require("dotenv").config();

const path = require("path");
const XLSX = require("xlsx");
const sequelize = require("../src/config/database");

const DEFAULT_EXCEL_PATH = path.resolve(process.cwd(), "Sectores.xlsx");

function normalizeName(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeCode(value) {
  return String(value ?? "").trim();
}

function getRows(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils
    .sheet_to_json(sheet, { defval: "" })
    .map((row) => ({
      centroCosto: normalizeCode(row.CodDeCentrodeCosto),
      codSector: normalizeCode(row.CodSect),
      nombre: normalizeName(row.descripcion),
    }))
    .filter((row) => row.centroCosto && row.nombre);
}

async function ensureSchema(transaction) {
  await sequelize.query(
    `
      CREATE TABLE IF NOT EXISTS sectores (
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
}

async function findOrCreateSector(nombre, transaction) {
  const [sector] = await sequelize.query(
    "SELECT id FROM sectores WHERE LOWER(nombre) = LOWER(:nombre) LIMIT 1",
    {
      replacements: { nombre },
      type: sequelize.QueryTypes.SELECT,
      transaction,
    }
  );

  if (sector?.id) return sector.id;

  const [created] = await sequelize.query(
    "INSERT INTO sectores (nombre) VALUES (:nombre) RETURNING id",
    {
      replacements: { nombre },
      type: sequelize.QueryTypes.SELECT,
      transaction,
    }
  );

  return created.id;
}

async function main() {
  const filePath = path.resolve(process.argv[2] || DEFAULT_EXCEL_PATH);
  const rows = getRows(filePath);

  if (rows.length === 0) {
    throw new Error(`No se encontraron sectores en ${filePath}`);
  }

  await sequelize.transaction(async (transaction) => {
    await ensureSchema(transaction);
    await sequelize.query("TRUNCATE TABLE centros_costo RESTART IDENTITY", { transaction });

    for (const row of rows) {
      const sectorId = await findOrCreateSector(row.nombre, transaction);
      await sequelize.query(
        `
          INSERT INTO centros_costo (codigo, descripcion, sector_id)
          VALUES (:codigo, :descripcion, :sectorId)
        `,
        {
          replacements: {
            codigo: row.centroCosto,
            descripcion: row.codSector
              ? `${row.codSector} - ${row.nombre}`
              : row.nombre,
            sectorId,
          },
          transaction,
        }
      );
    }
  });

  const [sectorCount] = await sequelize.query(
    "SELECT COUNT(*)::int AS count FROM sectores",
    { type: sequelize.QueryTypes.SELECT }
  );
  const [centroCount] = await sequelize.query(
    "SELECT COUNT(*)::int AS count FROM centros_costo",
    { type: sequelize.QueryTypes.SELECT }
  );

  console.log(`sectores: ${sectorCount.count}`);
  console.log(`centros_costo: ${centroCount.count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
