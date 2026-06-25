const {
  Requerimiento,
  User,
  Sector,
  RequerimientoItem,
  RequerimientoHistorial,
} = require("../models");



class RequerimientoService {
  async registrarHistorial(req, estado_nuevo, usuario_id = null, motivo = null) {
    await RequerimientoHistorial.create({
      id_requerimiento: req.id,
      estado_anterior: req.estado,
      estado_nuevo,
      usuario_id,
      motivo,
      fecha: new Date(),
    });
  }

  async crearRequerimiento(id_usuario, data) {
     const {
       descripcion,
       planta,
       centro_costo,
       almacen,
       items,
       es_express = false,
       justificacion_express = null,
       documentacion_express_url = null,
     } = data;

  // ✅ traer el usuario para obtener su sector_id
  const usuario = await User.findByPk(id_usuario);
  const sectores_id = usuario?.sector_id ?? null;

  const reqCreado = await Requerimiento.create({
    id_usuario,
    sector_id: usuario?.sector_id ?? null, // ✅ ahora sí cae en sectores_id
    descripcion,
    planta,
    centro_costo,
    almacen,
    es_express,
    justificacion_express,
    documentacion_express_url,
    estado: es_express ? "APROBADO" : "BORRADOR",
    fecha_envio: es_express ? new Date() : null,
  });

    if (es_express) {
      await this.registrarHistorial(reqCreado, "APROBADO", id_usuario, "Requerimiento express");
    }
    // ✅ Guardar items correctamente
    if (items?.length) {
      await RequerimientoItem.bulkCreate(
        items.map((it) => ({
          id_requerimiento: reqCreado.id, // ✅ CLAVE
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          unidad: it.unidad,
        }))
      );
    }

    return reqCreado;
  }

  async enviarParaAprobacion(id) {
    const req = await Requerimiento.findByPk(id);
    if (!req) throw new Error("Requerimiento no encontrado");

    if (req.estado !== "BORRADOR") throw new Error("Debe estar en BORRADOR");

    await this.registrarHistorial(req, "PEND_APROB_N1");

    req.estado = "PEND_APROB_N1";
    req.fecha_envio = new Date(); // ✅ NUEVO
    await req.save();

    return req;
  }

async aprobarNivel1(id, usuario_id, rol) {
  const req = await Requerimiento.findByPk(id);
  if (!req) throw new Error("Requerimiento no encontrado");
  if (req.estado !== "PEND_APROB_N1") throw new Error("Debe estar pendiente de aprobacion N1");

  const aprobador = await User.findByPk(usuario_id);
  if (!aprobador) throw new Error("Usuario aprobador no encontrado");

  const esAdmin = rol === "ADMIN";
  if (!esAdmin && aprobador.rol !== "APROBADOR_N1") {
    throw new Error("No autorizado para aprobar nivel 1");
  }

  if (!esAdmin && Number(req.id_usuario) === Number(usuario_id)) {
    throw new Error("No podes aprobar un requerimiento creado por vos mismo");
  }

  if (req.sector_id == null) {
    const u = await User.findByPk(req.id_usuario);
    req.sector_id = u?.sector_id ?? null;
  }

  if (!esAdmin && req.sector_id && aprobador.sector_id && Number(req.sector_id) !== Number(aprobador.sector_id)) {
    throw new Error("No podes aprobar requerimientos de otro sector");
  }

  await this.registrarHistorial(req, "PEND_APROB_N2", usuario_id);

  req.estado = "PEND_APROB_N2";
  req.fecha_aprob_n1 = new Date();
  req.aprobado_n1_por = usuario_id;

  await req.save();
  return req;
}


  async aprobarNivel2(id, usuario_id, rol) {
    const req = await Requerimiento.findByPk(id);
    if (!req) throw new Error("Requerimiento no encontrado");
    if (req.estado !== "PEND_APROB_N2") throw new Error("Debe estar pendiente de aprobacion N2");

    const aprobador = await User.findByPk(usuario_id);
    if (!aprobador) throw new Error("Usuario aprobador no encontrado");

    const esAdmin = rol === "ADMIN";
    if (!esAdmin && aprobador.rol !== "APROBADOR_N2") {
      throw new Error("No autorizado para aprobar nivel 2");
    }

    if (!esAdmin && Number(req.id_usuario) === Number(usuario_id)) {
      throw new Error("No podes aprobar un requerimiento creado por vos mismo");
    }

    if (!esAdmin && req.sector_id && aprobador.sector_id && Number(req.sector_id) !== Number(aprobador.sector_id)) {
      throw new Error("No podes aprobar requerimientos de otro sector");
    }

    await this.registrarHistorial(req, "APROBADO", usuario_id);

    req.estado = "APROBADO";
    req.fecha_aprob_n2 = new Date();
    req.aprobado_n2_por = usuario_id;

    await req.save();
    return req;
  }

  async rechazar(id, motivo) {
    const req = await Requerimiento.findByPk(id);
    if (!req) throw new Error("Requerimiento no encontrado");

    await this.registrarHistorial(req, "RECHAZADO", null, motivo);

    req.estado = "RECHAZADO";
    req.motivo_rechazo = motivo;
    req.fecha_rechazo = new Date(); // ✅ NUEVO
    await req.save();

    return req;
  }

  // ✅ LISTAR (con usuario + sector + items)
  async listar() {
    return await Requerimiento.findAll({
      include: [
        {
          model: User,
          as: "usuario",
          include: [{ model: Sector, as: "sector" }],
        },
        { model: RequerimientoItem, as: "items" },
      ],
      order: [["id", "DESC"]],
    });
  }

  // ✅ VER DETALLE (con historial + usuario + sector)
  async ver(id) {
    return await Requerimiento.findByPk(id, {
      include: [
        { model: RequerimientoItem, as: "items" },
        { model: RequerimientoHistorial, as: "historial" },
        {
          model: User,
          as: "usuario",
          include: [{ model: Sector, as: "sector" }],
        },
      ],
      order: [[{ model: RequerimientoHistorial, as: "historial" }, "fecha", "DESC"]],
    });
  }

 async actualizarRequerimiento(id, id_usuario, data, rol) {
  const req = await Requerimiento.findByPk(id, {
    include: [{ model: RequerimientoItem, as: "items" }],
  });

  if (!req) throw new Error("Requerimiento no encontrado");

  const esAdmin = rol === "ADMIN";

  // si NO es admin, recién ahí validamos dueño + estado
  if (!esAdmin) {
    if (req.id_usuario !== id_usuario) throw new Error("No autorizado");

    if (req.estado !== "BORRADOR") {
      throw new Error("Solo se puede editar en BORRADOR");
    }
  }

  const {
    descripcion,
    planta,
    centro_costo,
    almacen,
    items,
    es_express,
    justificacion_express,
    documentacion_express_url,
  } = data;

  req.descripcion = descripcion;
  req.planta = planta;
  req.centro_costo = centro_costo;
  req.almacen = almacen;
  req.es_express = !!es_express;
  req.justificacion_express = justificacion_express || null;
  if (documentacion_express_url !== undefined) {
    req.documentacion_express_url = documentacion_express_url;
  }

  await req.save();

  // estrategia simple: borrar items viejos y reinsertar
  if (Array.isArray(items)) {
    await RequerimientoItem.destroy({ where: { id_requerimiento: req.id } });

    if (items.length > 0) {
      await RequerimientoItem.bulkCreate(
        items.map((it) => ({
          id_requerimiento: req.id,
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          unidad: it.unidad,
        }))
      );
    }
  }

  const updated = await Requerimiento.findByPk(req.id, {
    include: [{ model: RequerimientoItem, as: "items" }],
  });

  return updated;
}



}

module.exports = new RequerimientoService();
