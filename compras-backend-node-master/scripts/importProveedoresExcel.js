require("dotenv").config();

const path = require("path");
const XLSX = require("xlsx");
const { Op } = require("sequelize");
const sequelize = require("../src/config/database");
const { Proveedor } = require("../src/models");

const excelPath = process.argv[2];

function text(value) {
  return String(value ?? "").trim();
}

function pick(row, names) {
  for (const name of names) {
    if (row[name] !== undefined) return text(row[name]);
  }
  return "";
}

async function main() {
  if (!excelPath) {
    throw new Error("Uso: node scripts/importProveedoresExcel.js <archivo.xlsx>");
  }

  const absolutePath = path.resolve(excelPath);
  const workbook = XLSX.readFile(absolutePath, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: "",
    raw: false,
  });

  let creados = 0;
  let actualizados = 0;
  let omitidos = 0;

  await sequelize.transaction(async (transaction) => {
    for (const row of rows) {
      const cuit = pick(row, ["CUIT", "Cuit", "cuit"]);
      const nombre = pick(row, ["Razón social", "Razon social", "nombre", "Nombre"]);
      const direccion = pick(row, ["Dirección", "Direccion", "direccion"]);
      const telefono = pick(row, ["Teléfono", "Telefono", "telefono"]);
      const email = pick(row, ["Email", "E-mail", "Correo", "correo", "email"]).toLowerCase();

      if (!nombre) {
        omitidos += 1;
        continue;
      }

      const where = cuit
        ? { cuit }
        : { nombre: { [Op.iLike]: nombre } };

      const existente = await Proveedor.findOne({ where, transaction });

      if (existente) {
        await existente.update(
          {
            nombre,
            cuit: cuit || existente.cuit,
            direccion: direccion || existente.direccion,
            telefono: telefono || existente.telefono,
            email: email || existente.email,
          },
          { transaction }
        );
        actualizados += 1;
      } else {
        await Proveedor.create(
          {
            nombre,
            cuit: cuit || null,
            direccion: direccion || null,
            telefono: telefono || null,
            email: email || null,
          },
          { transaction }
        );
        creados += 1;
      }
    }
  });

  const total = await Proveedor.count();
  console.log(`Archivo: ${absolutePath}`);
  console.log(`Filas leidas: ${rows.length}`);
  console.log(`Creados: ${creados}`);
  console.log(`Actualizados: ${actualizados}`);
  console.log(`Omitidos: ${omitidos}`);
  console.log(`Total proveedores en base: ${total}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
