require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const initDatabase = require("./config/initDatabase");

const authRoutes = require("./routes/authRoutes");
const reqRoutes = require("./routes/requerimientoRoutes");
const presupuestosRoutes = require("./routes/presupuestos.routes");
const productosRoutes = require("./routes/productos");
const ordenCompraRoutes = require("./routes/ordenCompraRoutes");
const catalogoRoutes = require("./routes/catalogoRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const proveedorRoutes = require("./routes/proveedorRoutes");
const condicionPagoRoutes = require("./routes/condicionPagoRoutes");
const cotizacionRoutes = require("./routes/cotizacionRoutes");

const path = require("path");
const { uploadRoot } = require("./config/uploads");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use("/uploads", express.static(uploadRoot));

// ✅ Rutas
app.use("/api/auth", authRoutes);
app.use("/api/requerimientos", reqRoutes);
app.use("/api", presupuestosRoutes);
app.use("/api", productosRoutes);
app.use("/api/ordenes-compra", ordenCompraRoutes);
app.use("/api/catalogos", catalogoRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/proveedores", proveedorRoutes);
app.use("/api/condiciones-pago", condicionPagoRoutes);
app.use("/api/cotizaciones", cotizacionRoutes);

app.get("/", (req, res) => {
  res.send("API Compras Node.js OK");
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;

console.log("✅ servidor levantando...");

// Conectar DB
sequelize
  .authenticate()
  .then(async () => {
    console.log("✅ DB conectada");

    await initDatabase();

    app.listen(PORT, "0.0.0.0", () =>
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ Error al conectar DB:", err);
  });
