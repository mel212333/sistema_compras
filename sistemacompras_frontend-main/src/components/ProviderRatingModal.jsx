import { useState } from "react";

const StarRating = ({ value, onChange, label }) => {
  const [hover, setHover] = useState(0);

  return (
    <div>
      <label className="text-xs font-semibold uppercase text-slate-500">{label}</label>
      <div className="mt-2 flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-2xl transition hover:scale-110"
          >
            {star <= (hover || value) ? "⭐" : "☆"}
          </button>
        ))}
        {value > 0 && <span className="ml-2 text-xs font-semibold text-slate-600">{value}/5</span>}
      </div>
    </div>
  );
};

export default function ProviderRatingModal({ isOpen, providers, currentProvider, onProviderChange, onClose, onSubmit, isLoading }) {
  const [rating, setRating] = useState({
    general: 0,
    precio: 0,
    rapidez: 0,
    calidad: 0,
    observaciones: "",
  });

  const providerList = Array.isArray(providers) ? providers : [];

  const handleSubmit = () => {
    if (rating.general === 0) {
      alert("Por favor, asigna una calificación general");
      return;
    }
    if (providerList.length > 1 && !currentProvider) {
      alert("Por favor, selecciona un proveedor");
      return;
    }
    onSubmit(rating);
    setRating({ general: 0, precio: 0, rapidez: 0, calidad: 0, observaciones: "" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Calificar proveedor</h2>
          <p className="mt-1 text-sm text-slate-600">Comparte tu experiencia para ayudar a otros usuarios</p>
        </div>

        <div className="space-y-4">
          {providerList.length > 1 && (
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500">Proveedor</label>
              <select
                value={currentProvider?.id || ""}
                onChange={(e) => {
                  const selected = providerList.find((p) => p.id === Number(e.target.value));
                  onProviderChange(selected);
                }}
                className="mt-1 w-full rounded border bg-white px-3 py-2"
              >
                <option value="">Selecciona un proveedor</option>
                {providerList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.proveedor?.nombre || p.proveedor_nombre || `Proveedor #${p.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {providerList.length === 1 && (
            <div className="rounded bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase text-slate-500">Proveedor</div>
              <div className="mt-1 font-semibold text-slate-900">
                {currentProvider?.proveedor?.nombre || currentProvider?.proveedor_nombre || `Proveedor #${currentProvider?.id}`}
              </div>
            </div>
          )}

          <StarRating
            label="Calificación general"
            value={rating.general}
            onChange={(v) => setRating({ ...rating, general: v })}
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={`precio-${star}`}
                    type="button"
                    onClick={() => setRating({ ...rating, precio: star })}
                    className="text-lg transition hover:scale-105"
                  >
                    {star <= rating.precio ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
              <label className="text-xs font-semibold uppercase text-slate-500">Precio</label>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={`rapidez-${star}`}
                    type="button"
                    onClick={() => setRating({ ...rating, rapidez: star })}
                    className="text-lg transition hover:scale-105"
                  >
                    {star <= rating.rapidez ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
              <label className="text-xs font-semibold uppercase text-slate-500">Rapidez</label>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={`calidad-${star}`}
                    type="button"
                    onClick={() => setRating({ ...rating, calidad: star })}
                    className="text-lg transition hover:scale-105"
                  >
                    {star <= rating.calidad ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
              <label className="text-xs font-semibold uppercase text-slate-500">Calidad</label>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">Observaciones (opcional)</label>
            <textarea
              value={rating.observaciones}
              onChange={(e) => setRating({ ...rating, observaciones: e.target.value })}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              rows={3}
              placeholder="Ej: Buen servicio, pero empaques defectuosos..."
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? "Guardando..." : "Guardar calificación"}
          </button>
        </div>
      </div>
    </div>
  );
}
