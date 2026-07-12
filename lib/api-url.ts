const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export function getApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiUrl}${normalizedPath}`;
}
