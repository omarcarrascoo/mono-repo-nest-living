import { Logger, Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { R2Client } from './r2.client';
import { SupabaseStorageClient } from './supabase.client';
import { STORAGE_CLIENT } from './uploads.tokens';
import type { StorageClient } from './storage.types';

const logger = new Logger('UploadsModule');

function makeStorage(): StorageClient {
  // Default: Supabase (free tier 1GB + 2GB egress/mes).
  // Cuando crezca el uso, setea STORAGE_PROVIDER=r2 y configura las R2_* envs.
  const provider = (process.env.STORAGE_PROVIDER ?? 'supabase').toLowerCase();
  if (provider === 'r2') {
    logger.log('Storage provider: Cloudflare R2');
    return new R2Client();
  }
  logger.log('Storage provider: Supabase Storage');
  return new SupabaseStorageClient();
}

@Module({
  controllers: [UploadsController],
  providers: [
    {
      provide: STORAGE_CLIENT,
      useFactory: makeStorage,
    },
  ],
  exports: [STORAGE_CLIENT],
})
export class UploadsModule {}
