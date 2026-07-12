type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
};

export function getBackendUrl() {
  return process.env.BACKEND_URL ?? "http://127.0.0.1:5000";
}

export async function fetchBackend<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${getBackendUrl()}${path}`, {
      ...init,
      cache: "no-store",
    });
    const body = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok || !body.success) return null;
    return body.data;
  } catch {
    return null;
  }
}
