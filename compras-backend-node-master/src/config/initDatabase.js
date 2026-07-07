const bcrypt = require("bcryptjs");
const {
  sequelize,
  User,
  Sector,
  Proveedor,
  Planta,
  CentroCosto,
  CondicionPago,
} = require("../models");

const shouldRun = (value) => ["1", "true", "yes"].includes(String(value || "").toLowerCase());

async function ensureExtraTables() {
  await sequelize.query(`
    ALTER TABLE proveedores
      ADD COLUMN IF NOT EXISTS email TEXT;
  `);

  await sequelize.query(`
    ALTER TABLE presupuestos
      ADD COLUMN IF NOT EXISTS plazo_entrega TEXT,
      ADD COLUMN IF NOT EXISTS lugar_entrega TEXT;
  `);

  await sequelize.query(`
    ALTER TABLE requerimientos
      ADD COLUMN IF NOT EXISTS fecha_ultimo_movimiento TIMESTAMP WITH TIME ZONE;
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS almacenes (
      id SERIAL PRIMARY KEY,
      codigo TEXT NOT NULL UNIQUE,
      descripcion TEXT NOT NULL
    );
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ordenes_compra_codigos (
      id SERIAL PRIMARY KEY,
      id_requerimiento INTEGER NOT NULL REFERENCES requerimientos(id) ON DELETE CASCADE,
      codigo_oc TEXT NOT NULL,
      createdat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updatedat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      CONSTRAINT ordenes_compra_codigos_req_codigo_unique
        UNIQUE (id_requerimiento, codigo_oc)
    );
  `);
}

async function seedDemoData() {
  const [sector] = await Sector.findOrCreate({
    where: { nombre: "Sistemas" },
    defaults: { nombre: "Sistemas" },
  });

  await Planta.findOrCreate({
    where: { nombre: "CAMPO" },
    defaults: { nombre: "CAMPO" },
  });

  await CentroCosto.findOrCreate({
    where: { codigo: "100" },
    defaults: {
      codigo: "100",
      descripcion: "VENTAS VARIAS",
      sector_id: sector.id,
    },
  });

  await CondicionPago.findOrCreate({
    where: { codigo: "CONTADO" },
    defaults: { codigo: "CONTADO", descripcion: "Contado", activo: true },
  });

  await sequelize.query(
    `
      INSERT INTO almacenes (codigo, descripcion)
      VALUES ('001', 'ALM. PROD TERMINADO')
      ON CONFLICT (codigo) DO NOTHING
    `
  );

  await Proveedor.findOrCreate({
    where: { nombre: "Proveedor demo" },
    defaults: {
      nombre: "Proveedor demo",
      cuit: "20-00000000-0",
      direccion: "Demo",
      telefono: "0000-0000",
    },
  });

  const users = [
    ["admin@demo.com", "Administrador", "ADMIN"],
    ["user@demo.com", "Solicitante Demo", "USER"],
    ["n1@demo.com", "Aprobador N1 Demo", "APROBADOR_N1"],
    ["n2@demo.com", "Aprobador N2 Demo", "APROBADOR_N2"],
    ["compras@demo.com", "Compras Demo", "COMPRAS"],
  ];
  const password = await bcrypt.hash(process.env.DEMO_PASSWORD || "demo1234", 10);

  for (const [email, name, rol] of users) {
    await User.findOrCreate({
      where: { email },
      defaults: {
        name,
        email,
        password,
        rol,
        sector_id: sector.id,
        activo: true,
      },
    });
  }
}

async function initDatabase() {
  if (shouldRun(process.env.DB_SYNC)) {
    await sequelize.sync({ alter: shouldRun(process.env.DB_SYNC_ALTER) });
  }

  await ensureExtraTables();

  if (shouldRun(process.env.DEMO_SEED)) {
    await seedDemoData();
  }
}

module.exports = initDatabase;
