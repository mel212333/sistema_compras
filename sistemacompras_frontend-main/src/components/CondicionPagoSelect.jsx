import { useEffect, useMemo, useState } from "react";
import { CONDICIONES_PAGO, condicionPagoValue } from "../constants/condicionesPago";
import { apiRequest } from "../services/api";

function normalizeCondicion(condicion) {
  return {
    codigo: String(condicion.codigo || "").trim(),
    descripcion: String(condicion.descripcion || "").trim(),
  };
}

function valueFor(condicion) {
  return condicionPagoValue(normalizeCondicion(condicion));
}

export default function CondicionPagoSelect({ value, onChange, selectClassName = "" }) {
  const [condiciones, setCondiciones] = useState(CONDICIONES_PAGO);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [descripcion, setDescripcion] = useState("");

  useEffect(() => {
    let alive = true;
    apiRequest("/condiciones-pago")
      .then((data) => {
        if (alive && Array.isArray(data) && data.length > 0) {
          setCondiciones(data.map(normalizeCondicion));
        }
      })
      .catch(() => {
        if (alive) setCondiciones(CONDICIONES_PAGO);
      });

    return () => {
      alive = false;
    };
  }, []);

  const options = useMemo(() => {
    const map = new Map();
    for (const condicion of condiciones) {
      const normalized = normalizeCondicion(condicion);
      if (normalized.codigo && normalized.descripcion) {
        map.set(normalized.codigo, normalized);
      }
    }
    return [...map.values()].sort((a, b) =>
      String(a.descripcion || "").localeCompare(String(b.descripcion || ""))
    );
  }, [condiciones]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options.slice(0, 10);
    return options
      .filter((condicion) => condicion.descripcion.toLowerCase().includes(q))
      .slice(0, 10);
  }, [options, search]);

  const elegir = (condicion) => {
    const nextValue = valueFor(condicion);
    onChange(nextValue);
    setSearch(nextValue);
    setOpen(false);
  };

  const crear = async () => {
    const nuevaDescripcion = descripcion.trim();

    if (!nuevaDescripcion) return alert("Carga la descripcion de la condicion de pago");

    setSaving(true);
    try {
      const nueva = normalizeCondicion(
        await apiRequest("/condiciones-pago", "POST", { descripcion: nuevaDescripcion })
      );
      setCondiciones((prev) => {
        const filteredPrev = prev.filter((condicion) => String(condicion.codigo) !== nueva.codigo);
        return [...filteredPrev, nueva];
      });
      const nextValue = valueFor(nueva);
      onChange(nextValue);
      setSearch(nextValue);
      setDescripcion("");
      setCreateOpen(false);
      setOpen(false);
    } catch (error) {
      alert(error?.message || "No se pudo crear la condicion de pago");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mt-1 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            value={open ? search : value || ""}
            onFocus={() => {
              setSearch("");
              setOpen(true);
            }}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onBlur={() => {
              window.setTimeout(() => {
                setOpen(false);
                setSearch("");
              }, 140);
            }}
            className={`w-full ${selectClassName}`}
            placeholder="Buscar condicion de pago..."
            title={value || "Buscar condicion de pago"}
          />

          {open && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[90] max-h-56 overflow-auto rounded border bg-white py-1 shadow-xl">
              {filtered.length > 0 ? (
                filtered.map((condicion) => {
                  const selected = value === valueFor(condicion);
                  return (
                    <button
                      key={condicion.codigo}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => elegir(condicion)}
                      className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        selected ? "bg-slate-100 font-semibold text-slate-950" : "text-slate-700"
                      }`}
                    >
                      {condicion.descripcion}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-sm text-slate-500">No se encontraron condiciones.</div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="shrink-0 rounded border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Nueva
        </button>
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="w-[min(520px,100%)] rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="font-semibold text-slate-900">Nueva condicion de pago</div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="h-9 w-9 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                x
              </button>
            </div>

            <div className="p-5">
              <label className="text-xs font-semibold uppercase text-slate-500">Descripcion</label>
              <input
                autoFocus
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="Ej: 30 DIAS FECHA FACTURA"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t bg-white px-5 py-4">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg bg-slate-200 px-4 py-2 text-slate-800 hover:bg-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={crear}
                disabled={saving}
                className="rounded-lg bg-slate-800 px-4 py-2 text-white hover:bg-slate-900 disabled:opacity-60"
              >
                {saving ? "Guardando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
