import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";
import { API_URL, apiAssetUrl } from "../services/config";
import { useAuthContext } from "../context/AuthContext";

const PLANTAS = [
  { value: "PLANTA_CENTRAL", label: "Planta Central" },
  { value: "PLANTA_NORTE", label: "Planta Norte" },
];

const CENTROS_COSTO = [
  { value: "CC-001", label: "CC-001 - Mantenimiento" },
  { value: "CC-002", label: "CC-002 - Producción" },
];

const ALMACENES_POR_PLANTA = {
  PLANTA_CENTRAL: [
    { value: "DEP_CENTRAL", label: "Depósito Central" },
    { value: "INSUMOS", label: "Insumos" },
  ],
  PLANTA_NORTE: [{ value: "DEP_NORTE", label: "Depósito Norte" }],
};

export default function NuevoRequerimiento({
  onClose,
  modo = "create", // "create" | "edit"
  initialData = null, // requerimiento a editar
}) {
  const { user } = useAuthContext();

  const [descripcion, setDescripcion] = useState("");
  const [planta, setPlanta] = useState("");
  const [centroCosto, setCentroCosto] = useState("");
  const [almacen, setAlmacen] = useState("");

  const [items, setItems] = useState([
    { descripcion: "", cantidad: 1, unidad: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [esExpress, setEsExpress] = useState(false);
  const [justificacionExpress, setJustificacionExpress] = useState("");
  const [documentacionExpress, setDocumentacionExpress] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [itemActivo, setItemActivo] = useState(null);
  const [catalogos, setCatalogos] = useState({
    plantas: PLANTAS,
    centrosCosto: CENTROS_COSTO,
    almacenes: [],
  });

  // ✅ si es edit, solo permitimos editar BORRADOR
  const esBorradorEdit =
    modo === "edit" ? initialData?.estado === "BORRADOR" : true;

  const disabledForm = modo === "edit" && !esBorradorEdit;

  // ✅ precarga cuando abrís el modal editar
  useEffect(() => {
    if (modo !== "edit" || !initialData) return;

    setDescripcion(initialData.descripcion || "");
    setPlanta(initialData.planta || "");
    setCentroCosto(initialData.centro_costo || initialData.centroCosto || "");
    setAlmacen(initialData.almacen || "");
    setEsExpress(!!initialData.es_express);
    setJustificacionExpress(initialData.justificacion_express || "");
    setDocumentacionExpress(null);

    if (Array.isArray(initialData.items) && initialData.items.length > 0) {
      setItems(
        initialData.items.map((it) => ({
          descripcion: it.descripcion ?? "",
          cantidad: it.cantidad ?? 1,
          unidad: it.unidad ?? "",
          id: it.id,
        }))
      );
    } else {
      setItems([{ descripcion: "", cantidad: 1, unidad: "" }]);
    }
  }, [modo, initialData]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [plantasRes, centrosRes, almacenesRes] = await Promise.all([
          apiRequest("/catalogos/plantas"),
          apiRequest("/catalogos/centros-costo"),
          apiRequest("/catalogos/almacenes"),
        ]);

        setCatalogos({
          plantas: (plantasRes || []).map((p) => ({
            value: String(p.nombre || "").toUpperCase(),
            label: String(p.nombre || "").toUpperCase(),
          })),
          centrosCosto: (centrosRes || []).map((c) => ({
            value: String(c.descripcion || "").toUpperCase(),
            label: String(c.descripcion || "").toUpperCase(),
          })),
          almacenes: (almacenesRes || []).map((a) => ({
            value: String(a.descripcion || "").toUpperCase(),
            label: String(a.descripcion || "").toUpperCase(),
          })),
        });
      } catch (err) {
        console.error("No se pudieron cargar catalogos", err);
      }
    };

    cargarCatalogos();
  }, []);
 
  useEffect(() => {
  if (!items || items.length === 0) return;

  const texto = items
    .filter((it) => it.descripcion)
    .map(
      (it) =>
        `${it.descripcion} (${it.cantidad || 1} ${it.unidad || ""})`
    )
    .join(", ");

  setDescripcion(texto);
}, [items]);

  const almacenesDisponibles = useMemo(() => {
    return catalogos.almacenes.length > 0
      ? catalogos.almacenes
      : ALMACENES_POR_PLANTA[planta] || [];
  }, [catalogos.almacenes, planta]);

  const agregarItem = () => {
    if (disabledForm) return;
    setItems([...items, { descripcion: "", cantidad: 1, unidad: "" }]);
  };

  const actualizarItem = (index, campo, valor) => {
    if (disabledForm) return;
    const copia = [...items];
    copia[index][campo] = valor;
    setItems(copia);
  };

const buscarProductos = async (valor, index) => {
  setBusqueda(valor);
  setItemActivo(index);

  if (valor.length < 2) {
    setResultados([]);
    return;
  }

  try {
    const res = await fetch(
      `${API_URL}/productos?search=${encodeURIComponent(valor)}`
    );

    const data = await res.json();

    setResultados(data);
  } catch (err) {
    console.error("Error buscando productos", err);
  }
};

const seleccionarProducto = (p) => {
  const copia = [...items];

  copia[itemActivo] = {
    ...copia[itemActivo],
    descripcion: p.nombre,
    unidad: p.unidad,
    codigo: p.codigo,
  };

  setItems(copia);
  setBusqueda("");
  setResultados([]);
  setItemActivo(null);
};
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (false && !descripcion.trim()) {
      alert("👉 Falta la descripción");
      return;
    }

    const itemsLimpios = items
      .map((it) => ({
        ...it,
        descripcion: it.descripcion?.trim() || "",
        cantidad: Number(it.cantidad) || 1,
        unidad: it.unidad?.trim() || "",
      }))
      .filter((it) => it.descripcion);

    if (itemsLimpios.length === 0) {
      alert("👉 Agregá al menos un ítem válido");
      return;
    }

    const descripcionFinal =
      descripcion.trim() ||
      itemsLimpios
        .map((it) => `${it.descripcion} (${it.cantidad || 1} ${it.unidad || ""})`)
        .join(", ");

    if (esExpress && !justificacionExpress.trim()) {
      alert("Agrega una justificacion para el requerimiento express");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        descripcion: descripcionFinal,
        planta,
        centro_costo: centroCosto,
        almacen,
        items: itemsLimpios,
        es_express: esExpress,
        justificacion_express: esExpress ? justificacionExpress.trim() : "",
      };

      let body = payload;

      if (documentacionExpress) {
        const fd = new FormData();
        fd.append("descripcion", payload.descripcion);
        fd.append("planta", payload.planta || "");
        fd.append("centro_costo", payload.centro_costo || "");
        fd.append("almacen", payload.almacen || "");
        fd.append("items", JSON.stringify(payload.items));
        fd.append("es_express", String(payload.es_express));
        fd.append("justificacion_express", payload.justificacion_express || "");
        fd.append("documentacion_express", documentacionExpress);
        body = fd;
      }

      let guardado;
      if (modo === "edit" && initialData?.id) {
        guardado = await apiRequest(`/requerimientos/${initialData.id}`, "PUT", body);
      } else {
        guardado = await apiRequest("/requerimientos", "POST", body);
      }

      onClose?.({
        requerimiento: guardado,
        esExpress: payload.es_express,
      });
    } catch (err) {
      console.error(err);
      alert(err?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="min-h-full space-y-6 p-6">
      <h1 className="text-2xl font-semibold text-slate-900">
        {modo === "edit" ? "Editar requerimiento" : "Crear nuevo requerimiento"}
      </h1>

      {!esBorradorEdit && modo === "edit" && (
        <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
          Este requerimiento ya fue enviado/aprobado/rechazado. No se puede
          editar.
        </div>
      )}

      <div className="bg-white border rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-slate-700">Datos generales</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Sector</label>
            <input
              disabled
              value={user?.sector?.nombre || "Sin sector"}
              className="w-full mt-1 bg-slate-100 border rounded-lg px-3 py-2 text-slate-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Usuario</label>
            <input
              disabled
              value={
                user
                  ? `${user.name || ""}${user.email ? ` (${user.email})` : ""}`
                  : "Sin usuario"
              }
              className="w-full mt-1 bg-slate-100 border rounded-lg px-3 py-2 text-slate-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Planta</label>
            <select
              disabled={disabledForm}
              className="w-full mt-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-300 bg-white disabled:bg-gray-100"
              value={planta}
              onChange={(e) => {
                setPlanta(e.target.value);
                setAlmacen("");
              }}
            >
              <option value="">Seleccionar planta...</option>
              {catalogos.plantas.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              Centro de costo
            </label>
            <select
              disabled={disabledForm}
              className="w-full mt-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-300 bg-white disabled:bg-gray-100"
              value={centroCosto}
              onChange={(e) => setCentroCosto(e.target.value)}
            >
              <option value="">Seleccionar centro de costo...</option>
              {catalogos.centrosCosto.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Almacen</label>
            <select
              disabled={disabledForm || (catalogos.almacenes.length === 0 && !planta)}
              className="w-full mt-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-300 bg-white disabled:bg-gray-100"
              value={almacen}
              onChange={(e) => setAlmacen(e.target.value)}
            >
              <option value="">
                {catalogos.almacenes.length === 0 && !planta
                  ? "Elegi una planta primero..."
                  : "Seleccionar almacen..."}
              </option>

              {almacenesDisponibles.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

   
        <div className="rounded-xl border bg-white p-5 space-y-3">
          <h3 className="text-lg font-semibold text-slate-800">Items</h3>

          {items.map((it, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_120px_180px] gap-3">

              {/* Buscador */}
              <div className="relative">
                <input
                  disabled={disabledForm}
                  className="border rounded-lg px-3 py-2 w-full disabled:bg-gray-100"
                  placeholder="Buscar producto..."
                  value={it.descripcion}
                  onChange={(e) => {
                    actualizarItem(index, "descripcion", e.target.value);
                    buscarProductos(e.target.value, index);
                  }}
                />

                {itemActivo === index && resultados.length > 0 && (
                  <ul className="absolute z-10 bg-white border w-full max-h-40 overflow-y-auto rounded-xl shadow">
                    {resultados.map((p) => (
                      <li
                        key={p.codigo}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => seleccionarProducto(p)}
                      >
                        <strong>{p.codigo}</strong> - {p.nombre}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* CANTIDAD */}
              <input
                disabled={disabledForm}
                type="number"
                min="1"
                className="border rounded-lg px-3 py-2 disabled:bg-gray-100"
                value={it.cantidad}
                onChange={(e) =>
                  actualizarItem(index, "cantidad", e.target.value)
                }
              />

              {/* UNIDAD */}
              <input
                disabled={disabledForm}
                className="border rounded-lg px-3 py-2 disabled:bg-gray-100"
                placeholder="Unidad (u, kg, m, caja...)"
                value={it.unidad}
                onChange={(e) =>
                  actualizarItem(index, "unidad", e.target.value)
                }
              />
            </div>
          ))}

          <button
            type="button"
            onClick={agregarItem}
            disabled={disabledForm}
            className="px-3 py-2 rounded-lg border bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-sm font-medium text-slate-700"
          >
            + Agregar item
          </button>
        </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2">
          <input
            id="es_express"
            type="checkbox"
            checked={esExpress}
            disabled={disabledForm}
            onChange={(e) => setEsExpress(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="es_express" className="text-sm font-medium text-slate-700">
            Requerimiento express
          </label>
        </div>

        {esExpress && (
          <p className="mt-2 text-sm text-amber-700">
            Este requerimiento se enviara directo a Compras, sin aprobacion.
          </p>
        )}
      </div>

      {esExpress && (
        <div className="rounded-xl border border-amber-200 bg-white p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Justificacion del express
            </label>
            <textarea
              disabled={disabledForm}
              className="w-full mt-1 border rounded-lg p-3 focus:ring-2 focus:ring-amber-300 disabled:bg-gray-100"
              rows="3"
              placeholder="Explica por que este requerimiento debe gestionarse como express"
              value={justificacionExpress}
              onChange={(e) => setJustificacionExpress(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Documentacion de respaldo
            </label>
            <input
              disabled={disabledForm}
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setDocumentacionExpress(e.target.files?.[0] || null)}
              className="mt-1 w-full rounded-lg border bg-white p-2 disabled:bg-gray-100"
            />
            {documentacionExpress?.name && (
              <div className="mt-1 text-xs text-slate-600">
                Archivo: <span className="font-semibold">{documentacionExpress.name}</span>
              </div>
            )}
            {modo === "edit" && initialData?.documentacion_express_url && !documentacionExpress && (
              <a
                href={apiAssetUrl(initialData.documentacion_express_url)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-slate-700 underline"
              >
                Ver documentacion cargada
              </a>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-white p-5">
        <label className="font-medium">Descripcion</label>
        <textarea
          disabled={disabledForm}
          className="w-full mt-1 border rounded-lg p-3 focus:ring-2 focus:ring-slate-300 disabled:bg-gray-100"
          rows="3"
          placeholder="Ej: Compra de insumos de oficina"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-6 flex justify-end gap-3 border-t bg-white px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-slate-50"
        >
          Cancelar
        </button>

        <button
          disabled={saving || disabledForm}
          type="submit"
          className="px-5 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {saving
            ? "Guardando..."
            : modo === "edit"
              ? "Guardar cambios"
              : "Guardar requerimiento"}
        </button>
      </div>
    </form>
  );
}


