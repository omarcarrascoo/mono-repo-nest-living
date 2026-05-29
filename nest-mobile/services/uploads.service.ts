import { apiFetch } from '@/lib/api/client';

export type UploadKind = 'amenity' | 'product' | 'avatar' | 'post';
export type UploadMime = 'image/jpeg' | 'image/png' | 'image/webp';

export interface SignUploadRequest {
  kind: UploadKind;
  contentType: UploadMime;
  contentLength: number;
}

export interface SignUploadResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresIn: number;
}

export const uploadsService = {
  async sign(payload: SignUploadRequest): Promise<SignUploadResponse> {
    return apiFetch<SignUploadResponse>('/uploads/sign', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Sube un archivo desde un URI local (file://, content://, ph://) directo
   * al provider usando la URL firmada. Reporta progreso si se le pasa el
   * callback. Retorna la `publicUrl` definitiva.
   *
   * Implementado con XMLHttpRequest porque es la forma estable de obtener
   * progreso de upload en React Native — fetch() no expone `upload.onprogress`.
   */
  async uploadDirect(
    localUri: string,
    signed: SignUploadResponse,
    onProgress?: (pct: number) => void,
  ): Promise<string> {
    const blob = await fetchAsBlob(localUri);

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(signed.method, signed.uploadUrl);
      for (const [k, v] of Object.entries(signed.headers ?? {})) {
        xhr.setRequestHeader(k, v);
      }
      xhr.upload.onprogress = (e) => {
        if (!onProgress || !e.lengthComputable) return;
        onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(signed.publicUrl);
        } else {
          reject(
            new Error(
              `Upload failed (${xhr.status}): ${xhr.responseText?.slice(0, 200) ?? ''}`,
            ),
          );
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(blob);
    });
  },
};

async function fetchAsBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return res.blob();
}
