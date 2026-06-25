import { useEffect, useMemo, useRef, useState } from "react";
import CondicionPagoSelect from "./CondicionPagoSelect";
import CotizacionDolarField from "./CotizacionDolarField";
import { DEFAULT_CONDICION_PAGO } from "../constants/condicionesPago";
import { apiRequest } from "../services/api";
import { apiAssetUrl } from "../services/config";
import { useNavigate } from "react-router-dom";

const money = (n, currency = "ARS") => {
  const num = Number(n);
  if (n == null || Number.isNaN(num)) return "-";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(num);
};

const MAX_PRESUPUESTOS = 4;

export default function CotizacionesModal({ open, onClose, requerimientoId, autoOpenOc = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [modo, setModo] = useState("PRESUPUESTOS");
  const [savingKey, setSavingKey] = useState(null);

  // Modal agregar presupuesto
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [ocOpen, setOcOpen] = useState(false);
  const [ocCodes, setOcCodes] = useState([""]);
  const [savingOc, setSavingOc] = useState(false);
  const [generandoOc, setGenerandoOc] = useState(false);
  const autoOpenedOcRef = useRef(false);

  const [form, setForm] = useState({
    id_proveedor: "",
    moneda: "ARS",
    pago_tipo: DEFAULT_CONDICION_PAGO,
    plazo_entrega: "",
    lugar_entrega: "",
    tipo_cambio: "",
    tipo_cambio_fecha: "",
    tipo_cambio_fuente: "",
    archivo: null,
    observaciones: "",
    precios: {}, // { [id_requerimiento_item]: precio_unitario }
  });
  const [proveedorSearch, setProveedorSearch] = useState("");
  const [proveedorFormOpen, setProveedorFormOpen] = useState(false);
  const [savingProveedor, setSavingProveedor] = useState(false);
  const [proveedorForm, setProveedorForm] = useState({
    nombre: "",
    cuit: "",
    direccion: "",
    telefono: "",
    email: "",
  });

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/requerimientos/${requerimientoId}/cotizaciones`);
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  const generarOrdenesCompra = async () => {
    if (!requerimientoId) return;
    setGenerandoOc(true);

    try {
      await apiRequest(`/ordenes-compra`, "POST", {
        id_requerimiento: requerimientoId,
      });

      alert("✅ Orden(es) de compra generada(s) correctamente.");
      await cargar();
    } catch (err) {
      console.error(err);
      alert(err?.message || "No se pudo generar la orden de compra.");
    } finally {
      setGenerandoOc(false);
    }
  };

  useEffect(() => {
    if (open && requerimientoId) {
      autoOpenedOcRef.current = false;
      setModo("PRESUPUESTOS");
      cargar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requerimientoId, autoOpenOc]);

  const requerimiento = data?.requerimiento;
  const items = requerimiento?.items ?? [];
  const presupuestos = requerimiento?.presupuestos ?? [];
  const adjudicaciones = data?.adjudicaciones ?? [];
  const proveedores = data?.proveedores ?? [];

  const presupuestoValido = useMemo(() => {
    if (!form.archivo) return false;
    if (!items || items.length === 0) return false;
    return items.every((it) => Number(form.precios?.[it.id] || 0) > 0);
  }, [form.archivo, form.precios, items]);

  const guardarPresupuestoDisabledReason = useMemo(() => {
    if (!form.archivo) return "Adjuntá el archivo del presupuesto para continuar.";
    if (!items || items.length === 0) return "No hay ítems para cotizar.";
    if (!items.every((it) => Number(form.precios?.[it.id] || 0) > 0)) {
      return "Completá el precio unitario de cada ítem antes de guardar.";
    }
    return null;
  }, [form.archivo, form.precios, items]);

  const proveedoresFiltrados = useMemo(() => {
    const q = proveedorSearch.trim().toLowerCase();
    const lista = proveedores.filter((p) => {
      if (!q) return true;
      return [p.cuit, p.nombre, p.direccion, p.telefono, p.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    return lista.slice(0, 8);
  }, [proveedores, proveedorSearch]);

  const proveedorSeleccionado = proveedores.find((p) => String(p.id) === String(form.id_proveedor));

  // map: id_requerimiento_item -> id_presupuesto_item
  const adjudicadoPorItem = useMemo(() => {
    const m = new Map();
    for (const a of adjudicaciones) m.set(a.id_requerimiento_item, a.id_presupuesto_item);
    return m;
  }, [adjudicaciones]);

  const adjudicacionesCompletas = useMemo(() => {
    return (
      items.length > 0 &&
      items.every((item) => {
        const itemId = String(item.id);
        return [...adjudicadoPorItem.keys()].some((key) => String(key) === itemId);
      })
    );
  }, [adjudicadoPorItem, items]);

  const motivoBloqueoOc =
    presupuestos.length === 0
      ? "Primero carga al menos un presupuesto"
      : !adjudicacionesCompletas
        ? "Primero adjudica proveedor/precio para todos los items"
        : savingKey
          ? "Espera a que termine de guardarse la adjudicacion"
          : "";
  const puedeAsignarOc = !motivoBloqueoOc;

  useEffect(() => {
    if (!open || !autoOpenOc || !puedeAsignarOc || ocOpen || autoOpenedOcRef.current) return;
    autoOpenedOcRef.current = true;
    abrirAsignarOc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoOpenOc, puedeAsignarOc, ocOpen]);

  // index: presupuestoId -> (requerimientoItemId -> presupuesto_item)
  const piIndex = useMemo(() => {
    const map = new Map();
    for (const p of presupuestos) {
      const inner = new Map();
      for (const pi of p.items ?? []) inner.set(pi.id_requerimiento_item, pi);
      map.set(p.id, inner);
    }
    return map;
  }, [presupuestos]);

  // total por presupuesto (suma de todos los items)
  const totalPorPresupuesto = useMemo(() => {
    const t = {};
    for (const p of presupuestos) {
      let sum = 0;
      for (const it of items) {
        const pi = piIndex.get(p.id)?.get(it.id);
        if (!pi) continue;
        sum += Number(it.cantidad || 0) * Number(pi.precio_unitario || 0);
      }
      t[p.id] = sum;
    }
    return t;
  }, [items, presupuestos, piIndex]);

  // Guardar adjudicacion (1 item -> 1 presupuesto_item)
  const adjudicarItem = async (id_requerimiento_item, id_presupuesto_item) => {
    const key = `${id_requerimiento_item}-${id_presupuesto_item}`;
    setSavingKey(key);

    try {
      await apiRequest(`/requerimientos/${requerimientoId}/adjudicaciones`, "POST", {
        items: [{ id_requerimiento_item, id_presupuesto_item }],
      });

      // OK Actualizo el estado local SIN recargar toda la data
      setData((prev) => {
        if (!prev) return prev;
        const arr = Array.isArray(prev.adjudicaciones) ? prev.adjudicaciones : [];

        const idx = arr.findIndex((a) => Number(a.id_requerimiento_item) === Number(id_requerimiento_item));

        let next;
        if (idx >= 0) {
          next = arr.map((a, i) =>
            i === idx ? { ...a, id_presupuesto_item } : a
          );
        } else {
          next = [...arr, { id_requerimiento_item, id_presupuesto_item }];
        }

        return { ...prev, adjudicaciones: next };
      });

      //  importante: sacamos el await cargar() para que NO pestanee
      // await cargar();

    } catch (e) {
      console.error(e);
      alert(e?.message || "No se pudo adjudicar");
    } finally {
      setSavingKey(null);
    }
  };

  const abrirAgregar = () => {
    setForm({
      id_proveedor: "",
      moneda: "ARS",
      pago_tipo: DEFAULT_CONDICION_PAGO,
      plazo_entrega: "",
      lugar_entrega: "",
      tipo_cambio: "",
      tipo_cambio_fecha: "",
      tipo_cambio_fuente: "",
      archivo: null,
      observaciones: "",
      precios: {},
    });
    setProveedorSearch("");
    setProveedorFormOpen(false);
    setProveedorForm({ nombre: "", cuit: "", direccion: "", telefono: "", email: "" });
    setAddOpen(true);
  };

  const crearProveedor = async () => {
    const nombre = proveedorForm.nombre.trim();
    if (!nombre) return alert("Carga el nombre del proveedor");

    setSavingProveedor(true);
    try {
      const nuevo = await apiRequest("/proveedores", "POST", {
        nombre,
        cuit: proveedorForm.cuit.trim(),
        direccion: proveedorForm.direccion.trim(),
        telefono: proveedorForm.telefono.trim(),
        email: proveedorForm.email.trim(),
      });

      setData((prev) => ({
        ...prev,
        proveedores: [...(prev?.proveedores || []), nuevo].sort((a, b) =>
          String(a.nombre || "").localeCompare(String(b.nombre || ""))
        ),
      }));
      setForm((s) => ({ ...s, id_proveedor: nuevo.id }));
      setProveedorSearch(nuevo.nombre || "");
      setProveedorFormOpen(false);
      setProveedorForm({ nombre: "", cuit: "", direccion: "", telefono: "", email: "" });
    } catch (err) {
      alert(err?.message || "No se pudo crear el proveedor");
    } finally {
      setSavingProveedor(false);
    }
  };

  const guardarPresupuesto = async (e) => {
    e.preventDefault();

    if (!form.id_proveedor) return alert("Elegi proveedor");
    if (!form.archivo) return alert("Adjunta el archivo (PDF/imagen)");
    if (!presupuestoValido) return alert(guardarPresupuestoDisabledReason || "Completá los precios para cada ítem.");

    // evitar proveedor repetido en el mismo requerimiento
    const yaExiste = presupuestos.some((p) => String(p.id_proveedor) === String(form.id_proveedor));
    if (yaExiste) return alert("Ese proveedor ya tiene un presupuesto cargado para este requerimiento.");

    setAdding(true);
    try {
      const fd = new FormData();
      fd.append("id_proveedor", String(form.id_proveedor));
      fd.append("moneda", form.moneda || "ARS");
      fd.append("pago_tipo", form.pago_tipo || DEFAULT_CONDICION_PAGO);
      fd.append("forma_pago", form.pago_tipo || DEFAULT_CONDICION_PAGO);
      fd.append("plazo_entrega", form.plazo_entrega || "");
      fd.append("lugar_entrega", form.lugar_entrega || "");
      if (form.moneda === "USD") {
        fd.append("tipo_cambio", form.tipo_cambio || "");
        fd.append("tipo_cambio_fecha", form.tipo_cambio_fecha || "");
        fd.append("tipo_cambio_fuente", form.tipo_cambio_fuente || "");
      }
      fd.append("observaciones", form.observaciones || "");
      fd.append("archivo", form.archivo);

      fd.append(
        "detalles",
        JSON.stringify(
          items.map((it) => ({
            id_item: it.id,
            precio_unitario: Number(form.precios?.[it.id] || 0),
          }))
        )
      );

      await apiRequest(`/requerimientos/${requerimientoId}/presupuestos`, "POST", fd);

      setAddOpen(false);
      await cargar();
      setModo("PRESUPUESTOS");
    } catch (err) {
      console.error(err);
      alert(err?.message || "No se pudo guardar el presupuesto");
    } finally {
      setAdding(false);
    }
  };

  const pdfHref = (p) => {
    const url = p?.pdf_url || p?.archivo_url || p?.url || null;
    return apiAssetUrl(url);
  };

  const parseOcCodes = (value) => {
    return [...new Set(
      (Array.isArray(value) ? value.join("\n") : String(value || ""))
        .split(/[\n,;]+/)
        .map((code) => code.trim())
        .filter(Boolean)
    )];
  };

  const abrirAsignarOc = async () => {
    if (!puedeAsignarOc) {
      alert(`${motivoBloqueoOc} para poder asignar una OC.`);
      setModo("PRESUPUESTOS");
      return;
    }

    setOcOpen(true);
    setOcCodes([""]);

    try {
      const res = await apiRequest(`/ordenes-compra/requerimiento/${requerimientoId}`);
      const codigos = (res?.codigos || []).map((oc) => oc.codigo_oc).filter(Boolean);
      setOcCodes(codigos.length > 0 ? codigos : [""]);
    } catch (err) {
      console.error(err);
    }
  };

  const actualizarCodigoOc = (index, value) => {
    const pegados = parseOcCodes(value);

    if (pegados.length > 1) {
      setOcCodes((prev) => {
        const next = [...prev];
        next.splice(index, 1, ...pegados);
        return next.length > 0 ? next : [""];
      });
      return;
    }

    setOcCodes((prev) => prev.map((code, i) => (i === index ? value : code)));
  };

  const agregarCodigoOc = () => setOcCodes((prev) => [...prev, ""]);

  const quitarCodigoOc = (index) => {
    setOcCodes((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  };

  const guardarCodigosOc = async (e) => {
    e.preventDefault();

    if (!puedeAsignarOc) {
      alert(`${motivoBloqueoOc} para poder asignar una OC.`);
      setOcOpen(false);
      setModo("PRESUPUESTOS");
      return;
    }

    const codigos = parseOcCodes(ocCodes);
    if (codigos.length === 0) {
      alert("Carga al menos un codigo de OC");
      return;
    }

    setSavingOc(true);
    try {
      const res = await apiRequest(`/ordenes-compra`, "POST", {
        id_requerimiento: requerimientoId,
        codigos_oc: codigos,
      });

      const guardados = (res?.codigos || []).map((oc) => oc.codigo_oc).filter(Boolean);
      setOcCodes(guardados.length > 0 ? guardados : [""]);
      setOcOpen(false);
      onClose?.({ ocAsignada: true, codigos: guardados });
    } catch (err) {
      console.error(err);
      alert(err.message || "Error al asignar OC");
    } finally {
      setSavingOc(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-[min(1160px,100%)] h-[88vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3 shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Cotizaciones - Requerimiento #{requerimientoId}
            </h2>
            {requerimiento && <p className="text-sm text-gray-500">{requerimiento.descripcion}</p>}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2 lg:mr-2">
              <button
                type="button"
                onClick={() => setModo("PRESUPUESTOS")}
                className={`px-3 py-2 rounded text-sm border ${modo === "PRESUPUESTOS"
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
              >
                Presupuestos
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  navigate(`/requerimientos/${requerimientoId}/comparativa`);
                }}
                className="px-3 py-2 rounded text-sm border bg-white text-slate-700 hover:bg-slate-50"
              >
                Comparativa
              </button>
            </div>

            <button
              type="button"
              onClick={cargar}
              className="px-3 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm"
            >
              Recargar
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
              title="Cerrar"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 overflow-auto flex-1 bg-slate-50">
          {loading && <div className="p-6 text-center text-gray-500">Cargando...</div>}

          {!loading && !requerimiento && <div className="p-6 text-center text-gray-500">No hay datos.</div>}

          {!loading && requerimiento && (
            <>
              {/* =========================
                  MODO: PRESUPUESTOS
                 ========================= */}
              {modo === "PRESUPUESTOS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-slate-800">
                        Presupuestos cargados ({presupuestos.length}/{MAX_PRESUPUESTOS})
                      </div>
                      <div className="text-sm text-slate-500">
                        Carga PDF/imagen + precios por item (en el modal).
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={abrirAgregar}
                      disabled={presupuestos.length >= MAX_PRESUPUESTOS}
                      className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-900 text-white text-sm disabled:opacity-60"
                    >
                      + Agregar presupuesto
                    </button>
                  </div>

                  <div className="rounded-xl border overflow-x-auto">
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="p-3 text-left">Proveedor</th>
                            <th className="p-3 text-center w-24">Moneda</th>
                            <th className="p-3 text-center w-32">Pago</th>
                            <th className="p-3 text-right w-44">Total</th>
                            <th className="p-3 text-center w-28">PDF</th>
                          </tr>
                        </thead>
                        <tbody>
                          {presupuestos.map((p) => {
                            const href = pdfHref(p);
                            return (
                              <tr key={p.id} className="border-t">
                                <td className="p-3">
                                  <div className="font-medium text-slate-800">
                                    {p.proveedor?.nombre ?? `Proveedor #${p.id_proveedor}`}
                                  </div>
                                  <div className="text-xs text-slate-500">Presupuesto #{p.id}</div>
                                </td>
                                <td className="p-3 text-center">{p.moneda || "ARS"}</td>
                                <td className="p-3 text-center">{p.pago_tipo || "-"}</td>
                                <td className="p-3 text-right font-semibold">
                                  {money(totalPorPresupuesto[p.id], p.moneda || "ARS")}
                                </td>
                                <td className="p-3 text-center">
                                  {href ? (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-slate-700 underline"
                                    >
                                      Ver
                                    </a>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {presupuestos.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-gray-500">
                                No hay presupuestos cargados todavia.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    Tip: carga hasta {MAX_PRESUPUESTOS} presupuestos. Despues adjudicas por item en la comparativa.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {ocOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={guardarCodigosOc}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b flex justify-between items-center shrink-0">
              <div>
                <div className="font-semibold text-slate-800">Asignar OC</div>
                <div className="text-xs text-slate-500">Requerimiento #{requerimientoId}</div>
              </div>
              <button
                type="button"
                className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
                onClick={() => setOcOpen(false)}
              >
                Cerrar
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-slate-700">
                  Codigos de OC
                </label>
                <button
                  type="button"
                  onClick={agregarCodigoOc}
                  className="h-8 w-8 rounded bg-slate-800 text-white text-xl leading-none hover:bg-slate-900"
                  title="Agregar codigo"
                >
                  +
                </button>
              </div>

              <div className="space-y-2">
                {ocCodes.map((code, index) => (
                  <div key={index} className="flex flex-wrap items-center justify-end gap-2">
                    <input
                      value={code}
                      onChange={(e) => actualizarCodigoOc(index, e.target.value)}
                      className="flex-1 border rounded px-3 py-2 font-mono text-sm"
                      placeholder={`OC-${String(index + 1).padStart(3, "0")}`}
                    />
                    <button
                      type="button"
                      onClick={() => quitarCodigoOc(index)}
                      disabled={ocCodes.length === 1}
                      className="h-10 w-10 rounded border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      title="Quitar codigo"
                    >
                      -
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-xs text-slate-500">
                Podes agregar varios codigos con + o pegar una lista separada por salto de linea, coma o punto y coma.
              </div>
            </div>

            <div className="px-5 py-4 border-t flex flex-wrap justify-end gap-2 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setOcOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingOc}
                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60"
              >
                {savingOc ? "Guardando..." : "Guardar codigos"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================
          MODAL: Agregar presupuesto
         ========================= */}
      {addOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={guardarPresupuesto}
            className="bg-white w-[min(1024px,100%)] h-[88vh] rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 border-b flex justify-between items-center shrink-0">
              <div className="font-semibold text-slate-800">Agregar presupuesto</div>
              <button
                type="button"
                className="h-9 w-9 rounded hover:bg-slate-100 text-gray-500 hover:text-slate-900"
                onClick={() => setAddOpen(false)}
              >
                x
              </button>
            </div>

            <div className="p-5 overflow-auto flex-1 space-y-4 bg-slate-50">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-start">
                {/* Proveedor */}
                <div className="md:col-span-6">
                  <label className="text-sm font-medium text-slate-700">Proveedor</label>
                  <div className="mt-1 space-y-2">
                    <input
                      value={proveedorSearch}
                      onChange={(e) => {
                        setProveedorSearch(e.target.value);
                        setForm((s) => ({ ...s, id_proveedor: "" }));
                      }}
                      placeholder="Buscar proveedor por CUIT, razon social, direccion, telefono o email..."
                      className="w-full border rounded-lg px-3 py-2 bg-white"
                    />
                    {proveedorSeleccionado && (
                      <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                        Seleccionado: <span className="font-semibold">{proveedorSeleccionado.nombre}</span>
                      </div>
                    )}
                    <div className="max-h-36 overflow-y-auto rounded border bg-white">
                      {proveedoresFiltrados.length > 0 ? (
                        proveedoresFiltrados.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setForm((s) => ({ ...s, id_proveedor: p.id }));
                              setProveedorSearch(p.nombre || "");
                            }}
                            className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                              String(form.id_proveedor) === String(p.id) ? "bg-slate-100 font-semibold text-slate-900" : "text-slate-700"
                            }`}
                          >
                            <div>{p.nombre}</div>
                            {(p.cuit || p.direccion || p.telefono) && (
                              <div className="text-xs text-slate-500">
                                {[p.cuit, p.direccion, p.telefono].filter(Boolean).join(" - ")}
                              </div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-slate-500">No se encontraron proveedores.</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setProveedorFormOpen((open) => !open);
                        setProveedorForm((s) => ({ ...s, nombre: s.nombre || proveedorSearch }));
                      }}
                      className="rounded border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      + Nuevo proveedor
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:col-span-6">
                  {/* Moneda */}
                  <div>
                    <label className="text-sm font-medium text-slate-700">Moneda</label>
                    <select
                      value={form.moneda}
                      onChange={(e) => setForm((s) => ({ ...s, moneda: e.target.value }))}
                      className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
                    >
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  {/* Condiciones comerciales */}
                  <div>
                    <label className="text-sm font-medium text-slate-700">Forma de pago</label>
                    <CondicionPagoSelect
                      value={form.pago_tipo}
                      onChange={(pago_tipo) => setForm((s) => ({ ...s, pago_tipo }))}
                      selectClassName="rounded-lg border bg-white px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Plazo de entrega</label>
                    <div className="mt-1 flex rounded-lg border bg-white shadow-sm ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-sky-500 sm:max-w-md">
                      <input
                        type="number"
                        min="0"
                        value={form.plazo_entrega}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setForm((s) => ({ ...s, plazo_entrega: value }));
                        }}
                        className="block w-full flex-1 border-0 bg-transparent px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:ring-0"
                        placeholder="Ej: 90"
                      />
                      <span className="inline-flex items-center rounded-r-lg bg-slate-100 px-3 text-sm text-slate-700">días</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Lugar de entrega</label>
                    <input
                      value={form.lugar_entrega}
                      onChange={(e) => setForm((s) => ({ ...s, lugar_entrega: e.target.value }))}
                      className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
                      placeholder="Ej: Planta / deposito"
                    />
                  </div>

                  <CotizacionDolarField
                    moneda={form.moneda}
                    value={form.tipo_cambio}
                    fecha={form.tipo_cambio_fecha}
                    fuente={form.tipo_cambio_fuente}
                    onChange={(changes) => setForm((s) => ({ ...s, ...changes }))}
                  />
                </div>

                {/* Archivo */}
                <div className="md:col-span-12">
                  <label className="text-sm font-medium text-slate-700">Archivo (PDF/imagen)</label>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => setForm((s) => ({ ...s, archivo: e.target.files?.[0] || null }))}
                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
                  />
                  {form.archivo?.name && (
                    <div className="text-xs text-slate-600 mt-1">
                      Archivo: <span className="font-semibold">{form.archivo.name}</span>
                    </div>
                  )}
                </div>
                {/* Numero de requerimiento */}
                <div className="md:col-span-12">
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded">
                    <span className="text-sm text-slate-600">
                      Requerimiento
                    </span>

                    <input
                      readOnly
                      value={`Requerimiento ${String(requerimientoId).padStart(5, "0")}`}
                      className="w-48 bg-white border rounded px-2 py-1 text-sm font-mono text-slate-700"
                    />
                  </div>
                </div>

                {/* Precios por item */}
                <div className="md:col-span-12">
                  <div className="text-sm font-semibold text-slate-800 mb-2">Precios por item</div>
                  <div className="rounded-xl border overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="p-2 text-left">Item</th>
                          <th className="p-2 text-center w-24">Cant.</th>
                          <th className="p-2 text-center w-24">Unidad</th>
                          <th className="p-2 text-right w-44">Precio unitario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it) => (
                          <tr key={it.id} className="border-t">
                            <td className="p-2 min-w-[320px]">
                              <div className="font-medium text-slate-800">{it.descripcion}</div>
                              <div className="text-xs text-slate-500">Item #{it.id}</div>
                            </td>
                            <td className="p-2 text-center">{it.cantidad}</td>
                            <td className="p-2 text-center">{it.unidad}</td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.precios?.[it.id] ?? ""}
                                onChange={(e) =>
                                  setForm((s) => ({
                                    ...s,
                                    precios: { ...(s.precios || {}), [it.id]: e.target.value },
                                  }))
                                }
                                className="w-full border rounded px-2 py-1 text-right"
                                placeholder="0.00"
                              />
                            </td>
                          </tr>
                        ))}
                        {items.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-500">
                              No hay items para cotizar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="md:col-span-12">
                  <label className="text-sm font-medium text-slate-700">Observaciones</label>
                  <textarea
                    value={form.observaciones}
                    onChange={(e) => setForm((s) => ({ ...s, observaciones: e.target.value }))}
                    className="mt-1 w-full border rounded-lg px-3 py-2 bg-white"
                    rows={3}
                    placeholder="Opcional..."
                  />
                </div>
              </div>

            </div>

            <div className="px-5 py-4 border-t flex flex-wrap justify-end gap-2 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adding || !presupuestoValido}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-60"
                  title={guardarPresupuestoDisabledReason || undefined}
                >
                  {adding ? "Guardando..." : "Guardar presupuesto"}
                </button>
                {!presupuestoValido && (
                  <div className="w-full text-xs text-rose-600 mt-1">
                    {guardarPresupuestoDisabledReason}
                  </div>
                )}
            </div>
          </form>
        </div>
      )}

      {proveedorFormOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="w-[min(560px,100%)] rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <div className="font-semibold text-slate-900">Nuevo proveedor</div>
                <div className="text-sm text-slate-500">Se crea y queda seleccionado en el presupuesto.</div>
              </div>
              <button
                type="button"
                onClick={() => setProveedorFormOpen(false)}
                className="h-9 w-9 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                x
              </button>
            </div>

            <div className="space-y-3 p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">CUIT</label>
                  <input
                    value={proveedorForm.cuit}
                    onChange={(e) => setProveedorForm((s) => ({ ...s, cuit: e.target.value }))}
                    className="mt-1 w-full rounded border px-3 py-2"
                    placeholder="CUIT"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500">Razon social</label>
                  <input
                    autoFocus
                    value={proveedorForm.nombre}
                    onChange={(e) => setProveedorForm((s) => ({ ...s, nombre: e.target.value }))}
                    className="mt-1 w-full rounded border px-3 py-2"
                    placeholder="Razon social"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Direccion</label>
                <input
                  value={proveedorForm.direccion}
                  onChange={(e) => setProveedorForm((s) => ({ ...s, direccion: e.target.value }))}
                  className="mt-1 w-full rounded border px-3 py-2"
                  placeholder="Direccion"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Telefono</label>
                <input
                  value={proveedorForm.telefono}
                  onChange={(e) => setProveedorForm((s) => ({ ...s, telefono: e.target.value }))}
                  className="mt-1 w-full rounded border px-3 py-2"
                  placeholder="Telefono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500">Email</label>
                <input
                  type="email"
                  value={proveedorForm.email}
                  onChange={(e) => setProveedorForm((s) => ({ ...s, email: e.target.value }))}
                  className="mt-1 w-full rounded border px-3 py-2"
                  placeholder="Email"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t bg-white px-5 py-4">
              <button
                type="button"
                onClick={() => setProveedorFormOpen(false)}
                className="rounded-lg bg-slate-200 px-4 py-2 text-slate-800 hover:bg-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={crearProveedor}
                disabled={savingProveedor}
                className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-900 disabled:opacity-60"
              >
                {savingProveedor ? "Guardando..." : "Crear y seleccionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** TABLA ADJUDICAR: cada item con SELECT (no radios) */
function AdjudicarPorItemTable({
  items,
  presupuestos,
  piIndex,
  adjudicadoPorItem,
  onAdjudicarItem,
  savingKey,
  pdfHref,
  requerimientoId,
  onGenerarOrdenesCompra,
  generatingOrdenesCompra,
}) {
  const [localSel, setLocalSel] = useState({}); // { [itemId]: "presupuestoItemId" }

  const adjudicacionResumen = useMemo(() => {
    let adjudicados = 0;
    let faltan = 0;
    let total = 0;

    for (const it of items || []) {
      const selectedPiId = localSel[it.id] ?? String(adjudicadoPorItem.get(it.id) || "");
      if (!selectedPiId) {
        faltan += 1;
        continue;
      }

      const opciones = (presupuestos || [])
        .map((p) => {
          const pi = piIndex.get(p.id)?.get(it.id);
          if (!pi) return null;
          return { p, pi };
        })
        .filter(Boolean);

      const opcion = opciones.find(({ pi }) => String(pi.id) === selectedPiId);
      if (!opcion) {
        faltan += 1;
        continue;
      }

      adjudicados += 1;
      total += Number(it.cantidad || 0) * Number(opcion.pi.precio_unitario || 0);
    }

    return { adjudicados, faltan, total };
  }, [items, presupuestos, piIndex, localSel, adjudicadoPorItem]);

  // OK Sync "inteligente: SOLO actualiza localSel si el backend trae algo.
  // NO borra lo que el usuario acaba de elegir.
  useEffect(() => {
    setLocalSel((prev) => {
      const next = { ...prev };
      for (const it of items || []) {
        const piId = adjudicadoPorItem?.get?.(it.id);
        if (piId) next[it.id] = String(piId);
      }
      return next;
    });
  }, [items, adjudicadoPorItem]);

  if ((items || []).length === 0) {
    return <div className="p-6 text-center text-gray-500">No hay items cargados.</div>;
  }

  return (
    <div className="rounded-2xl border bg-white overflow-hidden">
      <div className="p-4 border-b">
        <div className="text-lg font-semibold text-slate-800">Adjudicar por item</div>
        <div className="text-sm text-slate-500">
          Elegi un proveedor/presupuesto por cada producto.
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-left min-w-[260px]">Item</th>
              <th className="p-3 text-right w-24">Cant.</th>
              <th className="p-3 text-left w-28">Unidad</th>
              <th className="p-3 text-left min-w-[320px]">Elegir proveedor / precio</th>
              <th className="p-3 text-right w-40">Total item</th>
              <th className="p-3 text-center w-24">PDF</th>
            </tr>
          </thead>

          <tbody>
            {items.map((it) => {
              const opciones = (presupuestos || [])
                .map((p) => {
                  const pi = piIndex.get(p.id)?.get(it.id);
                  if (!pi) return null;
                  return { p, pi };
                })
                .filter(Boolean);

              const selectedPiId =
                localSel[it.id] ?? String(adjudicadoPorItem.get(it.id) || "");

              const savingThisRow = savingKey?.startsWith?.(`${it.id}-`);

              let totalItem = 0;
              let selectedPresupuesto = null;

              if (selectedPiId) {
                for (const { p, pi } of opciones) {
                  if (String(pi.id) === String(selectedPiId)) {
                    totalItem = Number(it.cantidad || 0) * Number(pi.precio_unitario || 0);
                    selectedPresupuesto = p;
                    break;
                  }
                }
              }

              const href = selectedPresupuesto ? pdfHref(selectedPresupuesto) : null;

              return (
                <tr key={it.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium text-slate-800">{it.descripcion}</div>
                    <div className="text-xs text-slate-500">Item #{it.id}</div>
                    {opciones.length === 0 && (
                      <div className="text-xs text-rose-600 mt-1">
                        Este item no tiene precios cargados en ningun presupuesto.
                      </div>
                    )}
                  </td>

                  <td className="p-3 text-right">{it.cantidad}</td>
                  <td className="p-3">{it.unidad}</td>

                  <td className="p-3">
                    <select
                      className="w-full border rounded px-3 py-2 bg-white"
                      value={selectedPiId}
                      disabled={opciones.length === 0 || savingThisRow}
                      onChange={(e) => {
                        const newPiId = e.target.value;

                        setLocalSel((prev) => ({ ...prev, [it.id]: newPiId }));

                        if (!newPiId) return;

                        onAdjudicarItem(it.id, Number(newPiId));
                      }}
                    >
                      <option value="">Seleccionar...</option>
                      {opciones.map(({ p, pi }) => (
                        <option key={pi.id} value={String(pi.id)}>
                          {p.proveedor?.nombre ?? `Proveedor #${p.id_proveedor}`} - PU{" "}
                          {money(pi.precio_unitario, p.moneda || "ARS")} ({p.moneda || "ARS"} /{" "}
                          {p.pago_tipo || "-"})
                        </option>
                      ))}
                    </select>

                    <div className="text-xs text-slate-500 mt-1">
                      {savingThisRow ? "Guardando..." : selectedPiId ? "OK Seleccionado" : ""}
                    </div>
                  </td>

                  <td className="p-3 text-right font-semibold">
                    {selectedPiId ? money(totalItem, selectedPresupuesto?.moneda || "ARS") : "-"}
                  </td>

                  <td className="p-3 text-center">
                    {href ? (
                      <a href={href} target="_blank" rel="noreferrer" className="text-slate-700 underline">
                        Ver
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t text-xs text-slate-500">
        Nota: guarda la adjudicacion al cambiar el selector.
      </div>
    </div>
  );
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-lg font-semibold text-slate-800">Adjudicación por ítem</div>
      <div className="text-sm text-slate-500 mt-2">La adjudicación por ítem se administra en la <a href={`/requerimientos/${window.location.pathname.split('/').pop()}/comparativa`} className="text-sky-600 underline">Comparativa de precios</a>.</div>
    </div>
  );
}

