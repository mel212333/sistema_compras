export const API_URL = import.meta.env.VITE_API_URL || "http://10.0.0.118:4000/api";

export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  API_URL.replace(/\/api\/?$/, "");

export function apiAssetUrl(url) {
  if (!url) return null;
  return String(url).startsWith("http") ? url : `${API_ORIGIN}${url}`;
}
