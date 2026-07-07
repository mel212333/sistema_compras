import { API_URL } from "./config";


export async function apiRequest(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem("token");

  const headers = {};
  const isFormData = body instanceof FormData;

  // Solo seteo JSON cuando NO es FormData
  if (!isFormData) headers["Content-Type"] = "application/json";

  if (token) headers.Authorization = `Bearer ${token}`;

  const options = { method, headers };

  if (body !== null) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${endpoint}`, options);

  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    const preview = text.replace(/\s+/g, " ").trim().slice(0, 120);
    throw new Error(
      res.ok
        ? "La respuesta del servidor no tiene formato JSON."
        : `Error ${res.status}: el servidor devolvio una respuesta no valida.${preview ? ` (${preview})` : ""}`
    );
  }

  if (!res.ok) throw new Error((data && data.error) || `Error ${res.status}`);

  return data;
}


export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) throw new Error((data && data.error) || "Login inválido");

  localStorage.setItem("token", data.token);
  return data;
}
