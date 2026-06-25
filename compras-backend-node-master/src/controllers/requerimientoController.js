const service = require("../services/RequerimientoService");
const { Requerimiento, User, Sector, RequerimientoItem } = require("../models");

const Presupuesto = require("../models/Presupuesto");
const Proveedor = require("../models/Proveedor");
const PresupuestoItem = require("../models/PresupuestoItem");
const Adjudicacion = require("../models/Adjudicacion");

const parseBoolean = (value) =>
  value === true || value === "true" || value === "1" || value === 1;

const parseItems = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};


class RequerimientoController {

  // =========================
  // CREAR
  // =========================
async crear(req, res) {
  try {
    const {
      descripcion,
      planta,
      centro_costo,
      almacen,
      justificacion_express,
    } = req.body;

    const items = parseItems(req.body.items);
    const es_express = parseBoolean(req.body.es_express);
    const id_usuario = req.user.id;
    const documentacion_express_url = req.file
      ? `/uploads/requerimientos-express/${req.file.filename}`
      : null;

    const nuevo = await service.crearRequerimiento(id_usuario, {
      descripcion,
      planta,
      centro_costo,
      almacen,
      items,
      es_express,
      justificacion_express,
      documentacion_express_url,
    });

    return res.json(nuevo);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}


  // =========================
  // AGREGAR ITEM
  // =========================
  async agregarItem(req, res) {
    try {
      const { id } = req.params;
      const item = req.body;

      const nuevoItem = await service.agregarItem(id, item);
      return res.json(nuevoItem);

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // =========================
  // ENVIAR
  // =========================
  async enviar(req, res) {
    try {
      const { id } = req.params;

      const actualizado = await service.enviarParaAprobacion(id);
      return res.json(actualizado);

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // =========================
  // APROBAR N1
  // =========================
  async aprobarN1(req, res) {
    try {
      const { id } = req.params;
      const id_usuario = req.user.id;
      const rol = req.user.rol;

      const actualizado = await service.aprobarNivel1(id, id_usuario, rol);
      return res.json(actualizado);

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // =========================
  // APROBAR N2
  // =========================
  async aprobarN2(req, res) {
    try {
      const { id } = req.params;
      const id_usuario = req.user.id;
      const rol = req.user.rol;

      const actualizado = await service.aprobarNivel2(id, id_usuario, rol);
      return res.json(actualizado);

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // =========================
  // RECHAZAR
  // =========================
  async rechazar(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      const actualizado = await service.rechazar(id, motivo);
      return res.json(actualizado);

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // =========================
  // VER POR ID
  // =========================
  async ver(req, res) {
    try {
      const { id } = req.params;

      const resultado = await service.ver(id);

      if (!resultado) {
        return res.status(404).json({ error: "Requerimiento no encontrado" });
      }

      return res.json(resultado);

    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // =========================
  // LISTAR (JSON LIMPIO PARA FRONT)
  // =========================
  // async listar(req, res) {
  //   try {
  //     const requerimientos = await Requerimiento.findAll({
  //       order: [["id", "DESC"]],
  //       include: [
  //         {
  //           model: User,
  //           attributes: ["id", "name", "email", "rol", "sector_id"],
  //         },
  //         {
  //           model: Sector,
  //           attributes: ["id", "nombre"],
  //         },
  //         {
  //           model: RequerimientoItem,
  //           as: "items",
  //           attributes: ["id", "descripcion", "cantidad", "unidad"],
  //         },
  //       ],
  //     });

  //     const limpio = requerimientos.map(r => ({
  //       id: r.id,
  //       descripcion: r.descripcion,
  //       estado: r.estado,
  //       fecha_creacion: r.fecha_creacion,
  //       id_usuario: r.id_usuario,

  //       usuario: r.User ? {
  //         id: r.User.id,
  //         name: r.User.name,
  //         email: r.User.email,
  //         rol: r.User.rol,
  //         sector_id: r.User.sector_id,
  //       } : null,

  //       sector: r.Sector ? {
  //         id: r.Sector.id,
  //         nombre: r.Sector.nombre,
  //       } : null,

  //       items: r.items || [],
  //     }));

  //     return res.json(limpio);

  //   } catch (error) {
  //     console.error("Error listar requerimientos:", error);
  //     return res.status(500).json({ error: "Error al listar requerimientos" });
  //   }
  // }

// =========================
// LISTAR (JSON LIMPIO PARA FRONT)
// =========================
async listar(req, res) {
  try {
    const requerimientos = await Requerimiento.findAll({
      order: [["id", "DESC"]],
      include: [
        {
          model: User,
          as: "usuario",
          attributes: ["id", "name", "email", "rol", "sector_id"],
        },
        {
          model: Sector,
          as: "sector",
          attributes: ["id", "nombre"],
        },
        {
          model: RequerimientoItem,
          as: "items",
          attributes: ["id", "descripcion", "cantidad", "unidad"],
        },
      ],
    });

    const limpio = requerimientos.map((r) => ({
      id: r.id,
      descripcion: r.descripcion,
      estado: r.estado,
      fecha_creacion: r.fecha_creacion,
      es_express: r.es_express,
      justificacion_express: r.justificacion_express,
      documentacion_express_url: r.documentacion_express_url,

      planta: r.planta,
      centro_costo: r.centro_costo,
      almacen: r.almacen,

      id_usuario: r.id_usuario,

      usuario: r.usuario
        ? {
            id: r.usuario.id,
            name: r.usuario.name,
            email: r.usuario.email,
            rol: r.usuario.rol,
            sector_id: r.usuario.sector_id,
          }
        : null,

      sector: r.sector
        ? {
            id: r.sector.id,
            nombre: r.sector.nombre,
          }
        : null,

      items: r.items || [],
    }));

    return res.json(limpio);
  } catch (error) {
    console.error("Error listar requerimientos:", error);
    return res.status(500).json({ error: "Error al listar requerimientos" });
  }
}

// =========================
// ACTUALIZAR (solo BORRADOR)
// =========================
async actualizar(req, res) {
  try {
    const { id } = req.params;
    const id_usuario = req.user.id;
    const rol = req.user.rol; // ✅ clave

    const {
      descripcion,
      planta,
      centro_costo,
      almacen,
      justificacion_express,
    } = req.body;

    const items = parseItems(req.body.items);
    const es_express = parseBoolean(req.body.es_express);
    const documentacion_express_url = req.file
      ? `/uploads/requerimientos-express/${req.file.filename}`
      : undefined;

    const actualizado = await service.actualizarRequerimiento(
      id,
      id_usuario,
      {
        descripcion,
        planta,
        centro_costo,
        almacen,
        items,
        es_express,
        justificacion_express,
        documentacion_express_url,
      },
      rol
    );

    return res.json(actualizado);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

// GET /api/requerimientos/para-compras
async listarParaCompras(req, res) {
  try {
    const requerimientos = await Requerimiento.findAll({
      where: { estado: "APROBADO" }, // o el estado "firmado" que uses
      order: [["fecha_creacion", "DESC"]],
      include: [
        {
          model: User,
          as: "usuario",
          attributes: ["id", "name", "email", "rol", "sector_id"],
        },
        {
          model: Sector,
          as: "sector",
          attributes: ["id", "nombre"],
        },
        {
          model: RequerimientoItem,
          as: "items",
          attributes: ["id", "descripcion", "cantidad", "unidad"],
        },
      ],
    });

    const limpio = requerimientos.map((r) => ({
      id: r.id,
      descripcion: r.descripcion,
      estado: r.estado,
      fecha_creacion: r.fecha_creacion,
      es_express: r.es_express,
      justificacion_express: r.justificacion_express,
      documentacion_express_url: r.documentacion_express_url,

      planta: r.planta,
      centro_costo: r.centro_costo,
      almacen: r.almacen,

      id_usuario: r.id_usuario,

      usuario: r.usuario
        ? {
            id: r.usuario.id,
            name: r.usuario.name,
            email: r.usuario.email,
            rol: r.usuario.rol,
            sector_id: r.usuario.sector_id,
          }
        : null,

      sector: r.sector
        ? {
            id: r.sector.id,
            nombre: r.sector.nombre,
          }
        : null,

      items: r.items || [],
    }));

    return res.json(limpio);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Error al listar requerimientos para compras" });
  }
}

// POST /api/requerimientos/:id/presupuestos
async crearPresupuesto(req, res) {
  try {
    const id_requerimiento = Number(req.params.id);
    const id_proveedor = Number(req.body.id_proveedor);

    if (!id_requerimiento) return res.status(400).json({ error: "Requerimiento inválido" });
    if (!id_proveedor) return res.status(400).json({ error: "Proveedor requerido" });
    if (!req.file) return res.status(400).json({ error: "Archivo requerido" });

    // ✅ validar proveedor (evita 500 por FK)
    const prov = await Proveedor.findByPk(id_proveedor);
    if (!prov) return res.status(400).json({ error: "Proveedor no existe" });

    // ✅ tu tabla es pdf_url (NO archivo_url)
    const pdf_url = `/uploads/presupuestos/${req.file.filename}`;

    // ✅ crear cabecera
    const nuevo = await Presupuesto.create({
      id_requerimiento,
      id_proveedor,
      observaciones: req.body.observaciones || null,
      pdf_url,
      moneda: req.body.moneda || "ARS",
      pago_tipo: req.body.pago_tipo || "Contado",
      forma_pago: req.body.forma_pago || req.body.pago_tipo || null,
      plazo_entrega: req.body.plazo_entrega || null,
      lugar_entrega: req.body.lugar_entrega || null,
      tipo_cambio: req.body.moneda === "USD" ? req.body.tipo_cambio || null : null,
      tipo_cambio_fecha: req.body.moneda === "USD" ? req.body.tipo_cambio_fecha || null : null,
      tipo_cambio_fuente: req.body.moneda === "USD" ? req.body.tipo_cambio_fuente || null : null,
    });

    // ✅ crear detalle por item
    const detalles = JSON.parse(req.body.detalles || "[]");

    if (Array.isArray(detalles) && detalles.length > 0) {
      await PresupuestoItem.bulkCreate(
        detalles.map((d) => ({
          id_presupuesto: nuevo.id,
          id_requerimiento_item: Number(d.id_item), // it.id del requerimiento = id_requerimiento_item
          precio_unitario: Number(d.precio_unitario || 0),
        }))
      );
    }

    return res.status(201).json({ ok: true, presupuesto: nuevo });
  } catch (e) {
    console.error("crearPresupuesto:", e);
    return res.status(500).json({ error: "No se pudo guardar el presupuesto" });
  }
}

// POST /api/requerimientos/:id/presupuestos (sin archivo)
async crearPresupuestoSinArchivo(req, res) {
  try {
    const id_requerimiento = Number(req.params.id);
    const id_proveedor = Number(req.body.id_proveedor);

    if (!id_requerimiento) return res.status(400).json({ error: "Requerimiento inválido" });
    if (!id_proveedor) return res.status(400).json({ error: "Proveedor requerido" });

    const prov = await Proveedor.findByPk(id_proveedor);
    if (!prov) return res.status(400).json({ error: "Proveedor no existe" });

    const nuevo = await Presupuesto.create({
      id_requerimiento,
      id_proveedor,
      observaciones: req.body.observaciones || null,
      pdf_url: null,
    });

    return res.status(201).json(nuevo);
  } catch (e) {
    console.error("crearPresupuestoSinArchivo:", e);
    return res.status(500).json({ error: "No se pudo crear presupuesto" });
  }
}

// GET /api/requerimientos/:id/cotizaciones
async verCotizaciones(req, res){
  try {
    const id = Number(req.params.id);

    const requerimiento = await Requerimiento.findByPk(id, {
      include: [
        {
          model: RequerimientoItem,
          as: "items",
          attributes: ["id", "descripcion", "cantidad", "unidad"],
        },
      ],
    });

    if (!requerimiento) {
      return res.status(404).json({ error: "Requerimiento no encontrado" });
    }

    const presupuestos = await Presupuesto.findAll({
      where: { id_requerimiento: id },
      include: [
        { model: Proveedor, as: "proveedor" },
        {
          model: PresupuestoItem,
          as: "items",
          attributes: ["id", "id_requerimiento_item", "precio_unitario", "descuento", "iva_porcentaje"],
        },
      ],
      order: [["id", "ASC"]],
    });

    const proveedores = await Proveedor.findAll({ order: [["id", "ASC"]] });
    const adjudicaciones = await Adjudicacion.findAll({
      where: { id_requerimiento: id },
      order: [["id", "ASC"]],
    });

    return res.json({
      requerimiento: {
        id: requerimiento.id,
        descripcion: requerimiento.descripcion,
        es_express: requerimiento.es_express,
        justificacion_express: requerimiento.justificacion_express,
        documentacion_express_url: requerimiento.documentacion_express_url,
        items: requerimiento.items || [],
        presupuestos,
      },
      proveedores,
      adjudicaciones,
    });
  } catch (e) {
    console.error("verCotizaciones:", e);
    return res.status(500).json({ error: "No se pudo cargar Cotizaciones" });
  }
}

}

module.exports = new RequerimientoController();
