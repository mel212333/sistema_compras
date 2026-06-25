// Hook para acceder a las calificaciones guardadas en localStorage

export function useProviderRatings() {
  const RATINGS_KEY = "provider-ratings";

  const getRatings = () => {
    try {
      return JSON.parse(localStorage.getItem(RATINGS_KEY) || "[]");
    } catch {
      return [];
    }
  };

  const saveRatings = (ratings) => {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  };

  const addRating = (rating) => {
    const ratings = getRatings();
    ratings.push({
      id: Date.now(),
      ...rating,
      fecha_calificacion: new Date().toISOString(),
    });
    saveRatings(ratings);
    return rating;
  };

  const deleteRating = (ratingId) => {
    const ratings = getRatings().filter((r) => r.id !== ratingId);
    saveRatings(ratings);
  };

  const clearRatings = () => {
    localStorage.removeItem(RATINGS_KEY);
  };

  // Función para enviar todas las calificaciones al backend
  const syncRatingsToBackend = async (apiRequest) => {
    const ratings = getRatings();
    if (ratings.length === 0) {
      alert("No hay calificaciones para sincronizar");
      return;
    }

    try {
      // Aquí irá el código para enviar al backend
      // Por ahora, solo retorna los datos
      console.log("Calificaciones listas para enviar:", ratings);
      return ratings;
    } catch (err) {
      throw err;
    }
  };

  return {
    getRatings,
    saveRatings,
    addRating,
    deleteRating,
    clearRatings,
    syncRatingsToBackend,
  };
}
