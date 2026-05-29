/**
 * Storage backend abstraction. Cualquier provider que implemente esto puede
 * conectarse al `/uploads/sign` endpoint sin tocar el resto del codigo.
 *
 * Patrón: el FE recibe `uploadUrl` (firmada) + `headers` y le pega un PUT
 * directo. El BE nunca toca el binario.
 */

export interface SignUploadInput {
  key: string;
  contentType: string;
  contentLength: number;
  expiresIn?: number; // seconds
}

export interface SignedUpload {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  method: 'PUT' | 'POST';
  headers: Record<string, string>;
  expiresIn: number;
}

export interface StorageClient {
  signUpload(input: SignUploadInput): Promise<SignedUpload>;
}
