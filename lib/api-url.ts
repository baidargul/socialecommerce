const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export function getApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiUrl}${normalizedPath}`;
}

export function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(getApiUrl(path), {
    ...init,
    credentials: init.credentials ?? "include",
  });
}
