const express = require("express");
const router = express.Router();
const xlsx = require("xlsx");
const fs = require("fs");
const upload = require("../middleware/uploadExcel");
const { sequelize } = require("../models");


router.post("/importar-productos", upload.single("file"), async (req, res) => {
    console.log("🔥 ENTRE AL ENDPOINT");
    console.log("👉 req.file:", req.file);

    if (!req.file) {
        return res.status(400).json({
            ok: false,
            error: "No se envió ningún archivo"
        });
    }

    try {
        const filePath = req.file.path;


        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // ✅ PRIMERO crear data
        let data = xlsx.utils.sheet_to_json(sheet, {
            range: 6,// 👈 fila 7 como dijiste
            header: 1 // 👈 👈 👈 CLAVE
        });

        // ✅ DESPUÉS usarla
        console.log("🧾 PRIMERA FILA:", data[0]);



        let insertados = 0;
        let ignorados = 0;
        for (const row of data) {

            if (!row || row.length < 3) {
                ignorados++;
                continue;
            }

            const codigo = row[1] ? String(row[1]).trim() : null;
            const descripcion = row[2] ? String(row[2]).trim() : null;
            const unidad = row[3] ? String(row[3]).trim() : null;

            // 🛡️ validar que no estén corridos
            if (!codigo || !descripcion) {
                console.log("⚠️ FILA RARA:", row);
                ignorados++;
                continue;
            }

            await sequelize.query(
                `INSERT INTO productos (codigo, nombre, descripcion, unidad)
         VALUES (:codigo, :nombre, :descripcion, :unidad)
         ON CONFLICT (codigo) DO NOTHING`,
                {
                    replacements: {
                        codigo,
                        nombre: descripcion,
                        descripcion,
                        unidad
                    }
                }
            );

            insertados++;
        }
        fs.unlinkSync(filePath);

        res.json({
            ok: true,
            insertados,
            ignorados
        });

    } catch (error) {
        console.error("❌ ERROR:", error);

        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});



router.get("/productos", async (req, res) => {
  const { search } = req.query;

  try {
    const [result] = await sequelize.query(
      `
      SELECT codigo, nombre, unidad
      FROM productos
      WHERE 
        LOWER(nombre) LIKE LOWER(:search)
        OR LOWER(codigo) LIKE LOWER(:search)
      LIMIT 20
      `,
      {
        replacements: {
          search: `%${search || ""}%`
        }
      }
    );

    res.json(result);

  } catch (error) {
    console.error("❌ ERROR:", error);

    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;