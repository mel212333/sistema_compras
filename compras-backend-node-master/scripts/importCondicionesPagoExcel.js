require("dotenv").config();

const path = require("path");
const XLSX = require("xlsx");
const sequelize = require("../src/config/database");
const { CondicionPago } = require("../src/models");

const excelPath = process.argv[2];

function text(value) {
  return String(value ?? "").trim();
}

async function main() {
  if (!excelPath) {
    throw new Error("Uso: node scripts/importCondicionesPagoExcel.js <archivo.xlsx>");
  }

  await CondicionPago.sync();

  const absolutePath = path.resolve(excelPath);
  const workbook = XLSX.readFile(absolutePath, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: "",
    range: 2,
    raw: false,
  });

  let creadas = 0;
  let actualizadas = 0;
  let omitidas = 0;

  await sequelize.transaction(async (transaction) => {
    for (const row of rows) {
      const codigo = text(row["Código"] || row["Codigo"]);
      const descripcion = text(row["Descripción"] || row["Descripcion"]);

      if (!codigo || !descripcion || codigo.toLowerCase().startsWith("total")) {
        omitidas += 1;
        continue;
      }

      const [condicion, created] = await CondicionPago.findOrCreate({
        where: { codigo },
        defaults: { codigo, descripcion, activo: true },
        transaction,
      });

      if (created) {
        creadas += 1;
      } else {
        await condicion.update({ descripcion, activo: true }, { transaction });
        actualizadas += 1;
      }
    }
  });

  const total = await CondicionPago.count({ where: { activo: true } });
  console.log(`Archivo: ${absolutePath}`);
  console.log(`Filas leidas: ${rows.length}`);
  console.log(`Creadas: ${creadas}`);
  console.log(`Actualizadas: ${actualizadas}`);
  console.log(`Omitidas: ${omitidas}`);
  console.log(`Total condiciones activas: ${total}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
