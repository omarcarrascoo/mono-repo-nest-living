import { Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  SignUploadInput,
  SignedUpload,
  StorageClient,
} from './storage.types';

/**
 * Supabase Storage. Free tier = 1GB storage + 2GB egress/mes.
 *
 * `createSignedUploadUrl()` devuelve un URL+token que el FE usa para hacer
 * un `PUT` directo (header `x-upsert: true` opcional). El bucket debe ser
 * **public** para que el `getPublicUrl()` resulte servible.
 */
export class SupabaseStorageClient implements StorageClient {
  private readonly logger = new Logger(SupabaseStorageClient.name);
  private readonly client: SupabaseClient;
  readonly bucket: string;

  constructor() {
    const url = process.env.SUPABASE_URL ?? '';
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
    this.bucket = process.env.SUPABASE_BUCKET ?? 'nestquest-media';

    if (!url || !key) {
      this.logger.warn(
        'Supabase credentials missing — /uploads/sign will fail until SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set',
      );
    } else {
      // Sanity check: el JWT del service_role contiene `"role":"service_role"`
      // en su payload (segundo segmento, base64). Si no, está usando la anon
      // key y los inserts fallarán contra RLS.
      const payload = decodeJwtPayload(key);
      const role = payload?.role ?? 'unknown';
      if (role !== 'service_role') {
        this.logger.warn(
          `Supabase key role is "${role}" — RLS will block uploads. ` +
            'Use the SERVICE ROLE key (Settings → API → service_role).',
        );
      } else {
        this.logger.log(
          `Supabase ready (bucket="${this.bucket}", role=service_role)`,
        );
      }
    }

    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async signUpload(input: SignUploadInput): Promise<SignedUpload> {
    const expiresIn = input.expiresIn ?? 60 * 5;
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUploadUrl(input.key);

    if (error || !data) {
      throw new Error(
        `Supabase signed upload failed: ${error?.message ?? 'unknown error'}`,
      );
    }

    const publicUrl = this.client.storage
      .from(this.bucket)
      .getPublicUrl(input.key).data.publicUrl;

    return {
      uploadUrl: data.signedUrl,
      publicUrl,
      key: data.path ?? input.key,
      method: 'PUT',
      headers: {
        'Content-Type': input.contentType,
        // Supabase upserts atomically when the resource doesn't exist; el
        // `x-upsert: true` cubre el caso de retry idempotente.
        'x-upsert': 'true',
      },
      expiresIn,
    };
  }
}

function decodeJwtPayload(jwt: string): Record<string, any> | null {
  try {
    const [, payload] = jwt.split('.');
    if (!payload) return null;
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = Buffer.from(
      padded.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
