const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const rawSocketUrl = import.meta.env.VITE_SOCKET_URL as string | undefined;

export const API_BASE_URL = (rawApiBaseUrl ?? "").trim().replace(/\/+$/, "");
const socketOverrideProvided = rawSocketUrl !== undefined;
const normalizedSocketOverride = (rawSocketUrl ?? "").trim().replace(/\/+$/, "");
export const SOCKET_DISABLED = socketOverrideProvided && normalizedSocketOverride === "";
export const SOCKET_URL = SOCKET_DISABLED
  ? ""
  : socketOverrideProvided
  ? normalizedSocketOverride
  : API_BASE_URL || window.location.origin;

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
