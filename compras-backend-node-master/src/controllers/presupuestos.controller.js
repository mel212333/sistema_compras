const service = require("../services/presupuestos.service");

exports.cotizacionesPorRequerimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await service.obtenerCotizaciones(Number(id));
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};

// POST /api/requerimientos/:id/presupuestos
exports.crearPresupuesto = async (req, res) => {
  try {
    const id_requerimiento = Number(req.params.id);
    const id_proveedor = Number(req.body.id_proveedor);

    if (!id_requerimiento) return res.status(400).json({ error: "Requerimiento inválido" });
    if (!id_proveedor) return res.status(400).json({ error: "Proveedor requerido" });
    if (!req.file) return res.status(400).json({ error: "Archivo requerido" });

    const archivo_url = `/uploads/presupuestos/${req.file.filename}`;

    const nuevo = await Presupuesto.create({
      id_requerimiento,
      id_proveedor,
      observaciones: req.body.observaciones || null,
      archivo_url,
    });

    // ✅ detalles por item (vienen como JSON string)
    let detalles = [];
    if (req.body.detalles) {
      try {
        detalles = JSON.parse(req.body.detalles);
      } catch {
        return res.status(400).json({ error: "detalles inválidos (JSON)" });
      }
    }

    if (Array.isArray(detalles) && detalles.length > 0) {
      await PresupuestoItem.bulkCreate(
        detalles.map((d) => ({
          id_presupuesto: nuevo.id,
          id_item: Number(d.id_item),
          precio_unitario: Number(d.precio_unitario),
        }))
      );
    }

    return res.status(201).json({ ok: true, presupuesto: nuevo });
  } catch (e) {
    console.error("crearPresupuesto:", e);
    return res.status(500).json({ error: "No se pudo guardar el presupuesto" });
  }
}


exports.cargarItemsPresupuesto = async (req, res) => {
  try {
    const { id } = req.params; // id_presupuesto
    const data = await service.cargarItemsPresupuesto(Number(id), req.body);
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};

exports.adjudicarItem = async (req, res) => {
  try {
    const { id } = req.params; // id_requerimiento
    const data = await service.adjudicarItem(Number(id), req.body);
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};

exports.verPresupuestos = async (req, res) => {
  try {
    const id_requerimiento = Number(req.params.id);

    const presupuestos = await Presupuesto.findAll({
      where: { id_requerimiento },
      include: [
        { model: Proveedor, as: "proveedor" },
        { model: PresupuestoItem, as: "items" },
      ],
      order: [["id", "DESC"]],
    });

    res.json(presupuestos);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "No se pudieron cargar presupuestos" });
  }
}
