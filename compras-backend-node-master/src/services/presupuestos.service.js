const {
  Requerimiento,
  RequerimientoItem,
  Proveedor,
  Presupuesto,
  PresupuestoItem,
  Adjudicacion,
} = require("../models");

class PresupuestosService {
  // Trae TODO para pintar la pantalla
  async obtenerCotizaciones(id_requerimiento) {
    const req = await Requerimiento.findByPk(id_requerimiento, {
      include: [
        { model: RequerimientoItem, as: "items" },
        {
          model: Presupuesto,
          as: "presupuestos",
          include: [
            { model: Proveedor, as: "proveedor" },
            { model: PresupuestoItem, as: "items" },
          ],
        },
      ],
      order: [["id", "DESC"]],
    });

    if (!req) throw new Error("Requerimiento no encontrado");

    // adjudicaciones del requerimiento
    const adjudicaciones = await Adjudicacion.findAll({
      where: { id_requerimiento },
    });

    return { requerimiento: req, adjudicaciones };
  }

  // Crear cabecera
  async crearPresupuesto(body) {
    const {
      id_requerimiento,
      id_proveedor,
      pdf_url,
      observaciones,
      pago_tipo,
      anticipo_porcentaje,
      dias_plazo,
      forma_pago,
      moneda,
      tipo_cambio,
      tipo_cambio_fecha,
      tipo_cambio_fuente,
      incluye_iva,
      validez_dias,
      entrega_dias,
    } = body;

    if (!id_requerimiento) throw new Error("Falta id_requerimiento");
    if (!id_proveedor) throw new Error("Falta id_proveedor");

    const existeReq = await Requerimiento.findByPk(id_requerimiento);
    if (!existeReq) throw new Error("Requerimiento inexistente");

    const existeProv = await Proveedor.findByPk(id_proveedor);
    if (!existeProv) throw new Error("Proveedor inexistente");

    const creado = await Presupuesto.create({
      id_requerimiento,
      id_proveedor,
      pdf_url: pdf_url ?? null,
      observaciones: observaciones ?? null,
      pago_tipo: pago_tipo ?? "Contado",
      anticipo_porcentaje: anticipo_porcentaje ?? null,
      dias_plazo: dias_plazo ?? null,
      forma_pago: forma_pago ?? null,
      moneda: moneda ?? "ARS",
      tipo_cambio: tipo_cambio ?? null,
      tipo_cambio_fecha: tipo_cambio_fecha ?? null,
      tipo_cambio_fuente: tipo_cambio_fuente ?? null,
      incluye_iva: incluye_iva ?? true,
      validez_dias: validez_dias ?? null,
      entrega_dias: entrega_dias ?? null,
    });

    return creado;
  }

  // Carga masiva de items con precio
  // body: { items: [{ id_requerimiento_item, precio_unitario, descuento, iva_porcentaje }] }
  async cargarItemsPresupuesto(id_presupuesto, body) {
    const presu = await Presupuesto.findByPk(id_presupuesto);
    if (!presu) throw new Error("Presupuesto no encontrado");

    const items = body?.items;
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Body inválido: items[] requerido");
    }

    // Validar que esos items pertenezcan al requerimiento del presupuesto
    const ids = items.map((x) => x.id_requerimiento_item);
    const existentes = await RequerimientoItem.findAll({
      where: { id: ids, id_requerimiento: presu.id_requerimiento },
    });

    if (existentes.length !== ids.length) {
      throw new Error("Hay items que no pertenecen al requerimiento");
    }

    // Upsert simple: intentamos crear, si ya existe lo actualizamos
    const results = [];
    for (const it of items) {
      const [row, created] = await PresupuestoItem.findOrCreate({
        where: {
          id_presupuesto,
          id_requerimiento_item: it.id_requerimiento_item,
        },
        defaults: {
          precio_unitario: it.precio_unitario,
          descuento: it.descuento ?? 0,
          iva_porcentaje: it.iva_porcentaje ?? null,
        },
      });

      if (!created) {
        row.precio_unitario = it.precio_unitario;
        row.descuento = it.descuento ?? 0;
        row.iva_porcentaje = it.iva_porcentaje ?? null;
        await row.save();
      }

      results.push(row);
    }

    return { ok: true, items: results };
  }

  // Checkbox (si adjudicás otro proveedor para el mismo item, se reemplaza)
  // body: { id_requerimiento_item, id_presupuesto_item, cantidad_adjudicada? }
  async adjudicarItem(id_requerimiento, body) {
    const { id_requerimiento_item, id_presupuesto_item, cantidad_adjudicada } =
      body;

    if (!id_requerimiento_item) throw new Error("Falta id_requerimiento_item");
    if (!id_presupuesto_item) throw new Error("Falta id_presupuesto_item");

    // Validar que el presupuesto_item corresponda al item y al requerimiento
    const pi = await PresupuestoItem.findByPk(id_presupuesto_item, {
      include: [{ model: Presupuesto, as: "presupuesto" }],
    });
    if (!pi) throw new Error("PresupuestoItem no encontrado");

    if (pi.id_requerimiento_item !== id_requerimiento_item) {
      throw new Error("Ese presupuesto_item no corresponde a ese item");
    }
    if (pi.presupuesto.id_requerimiento !== id_requerimiento) {
      throw new Error("Ese presupuesto_item no corresponde a ese requerimiento");
    }

    // Upsert por item (uq_adjudicacion_item)
    const existente = await Adjudicacion.findOne({
      where: { id_requerimiento_item },
    });

    if (existente) {
      existente.id_requerimiento = id_requerimiento;
      existente.id_presupuesto_item = id_presupuesto_item;
      existente.cantidad_adjudicada = cantidad_adjudicada ?? null;
      await existente.save();
      return existente;
    }

    const creado = await Adjudicacion.create({
      id_requerimiento,
      id_requerimiento_item,
      id_presupuesto_item,
      cantidad_adjudicada: cantidad_adjudicada ?? null,
    });

    return creado;
  }
}

module.exports = new PresupuestosService();
