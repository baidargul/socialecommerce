import { getApiUrl } from "@/lib/api-url";

export type MultipartUploadResult<T> = {
  status: number;
  body: T;
};

export function uploadFormData<T>(
  path: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<MultipartUploadResult<T>> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", getApiUrl(path));
    request.withCredentials = true;

    request.upload.addEventListener("loadstart", () => onProgress?.(0));
    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      onProgress?.(
        Math.min(100, Math.round((event.loaded / event.total) * 100)),
      );
    });
    request.upload.addEventListener("load", () => onProgress?.(100));

    request.addEventListener("load", () => {
      try {
        resolve({
          status: request.status,
          body: JSON.parse(request.responseText) as T,
        });
      } catch {
        reject(new Error("The upload service returned an invalid response."));
      }
    });
    request.addEventListener("error", () =>
      reject(new Error("Could not reach the upload service.")),
    );
    request.addEventListener("abort", () =>
      reject(new Error("Upload was cancelled.")),
    );
    request.send(formData);
  });
}
