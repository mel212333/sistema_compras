import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function AsignarOcModal({ open, requerimientoId, onClose }) {
  const [codes, setCodes] = useState([""]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setCodes([""]);
  }, [open, requerimientoId]);

  if (!open) return null;

  const updateCode = (index, value) => {
    setCodes((prev) => prev.map((code, i) => (i === index ? value : code)));
  };

  const addCode = () => setCodes((prev) => [...prev, ""]);

  const removeCode = (index) => {
    setCodes((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const save = async (event) => {
    event.preventDefault();
    const codigos = codes.map((code) => code.trim()).filter(Boolean);
    if (codigos.length === 0) {
      alert("Carga al menos un codigo de OC");
      return;
    }

    setSaving(true);
    try {
      const result = await apiRequest("/ordenes-compra", "POST", {
        id_requerimiento: requerimientoId,
        codigos_oc: codigos,
      });
      onClose?.({ ocAsignada: true, codigos: result?.codigos || [] });
    } catch (err) {
      console.error(err);
      alert(err?.message || "No se pudo asignar la OC");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={save} className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <div className="font-semibold text-slate-800">Asignar OC</div>
            <div className="text-xs text-slate-500">Requerimiento #{requerimientoId}</div>
          </div>
          <button
            type="button"
            onClick={() => onClose?.(null)}
            className="rounded bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
          >
            Cerrar
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-slate-700">Codigos de OC</label>
            <button
              type="button"
              onClick={addCode}
              className="h-8 w-8 rounded bg-slate-800 text-xl leading-none text-white hover:bg-slate-900"
              title="Agregar codigo"
            >
              +
            </button>
          </div>

          <div className="space-y-2">
            {codes.map((code, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  value={code}
                  onChange={(event) => updateCode(index, event.target.value)}
                  className="flex-1 rounded border px-3 py-2 font-mono text-sm"
                  placeholder={`OC-${String(index + 1).padStart(3, "0")}`}
                />
                <button
                  type="button"
                  onClick={() => removeCode(index)}
                  disabled={codes.length === 1}
                  className="h-10 w-10 rounded border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  title="Quitar codigo"
                >
                  -
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={() => onClose?.(null)}
            className="rounded border bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar OC"}
          </button>
        </div>
      </form>
    </div>
  );
}
