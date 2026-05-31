import { apiFetch } from "@/lib/api/client";
import { SignUploadRequest, SignUploadResponse } from "@/types/api";

/**
 * Subida en dos pasos:
 *   1. POST /uploads/sign → URL firmada del provider (Supabase / R2).
 *   2. PUT directo al provider con el `File` (web, no React Native).
 *
 * En el móvil esto se hace con XMLHttpRequest para tener `upload.onprogress`;
 * en web preferimos `fetch` por simplicidad y porque el progreso por archivo
 * no es prioritario aún. Si en algún momento hace falta progreso real, hay que
 * volver a XHR.
 */
export const uploadsService = {
  async sign(payload: SignUploadRequest): Promise<SignUploadResponse> {
    return apiFetch<SignUploadResponse>("/uploads/sign", {
      method: "POST",
      body: payload,
    });
  },

  /** Sube un `File` a la URL firmada y devuelve la `publicUrl`. */
  async uploadDirect(file: File, signed: SignUploadResponse): Promise<string> {
    const res = await fetch(signed.uploadUrl, {
      method: signed.method,
      headers: signed.headers,
      body: file,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Upload failed (${res.status}): ${text.slice(0, 200) || res.statusText}`,
      );
    }
    return signed.publicUrl;
  },

  /** Helper end-to-end: firma + sube. Devuelve la URL pública. */
  async uploadFile(file: File, kind: SignUploadRequest["kind"]): Promise<string> {
    const allowed: SignUploadRequest["contentType"][] = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    const contentType = file.type as SignUploadRequest["contentType"];
    if (!allowed.includes(contentType)) {
      throw new Error("Solo se permiten imágenes JPG, PNG o WEBP.");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("La imagen no puede pesar más de 5 MB.");
    }
    const signed = await uploadsService.sign({
      kind,
      contentType,
      contentLength: file.size,
    });
    return uploadsService.uploadDirect(file, signed);
  },
};
