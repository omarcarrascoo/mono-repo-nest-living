import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsInt, IsString, Max, Min } from 'class-validator';
import { ulid } from 'ulid';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { STORAGE_CLIENT } from './uploads.tokens';
import type { StorageClient } from './storage.types';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
type AllowedMime = (typeof ALLOWED_MIME)[number];

const MIME_TO_EXT: Record<AllowedMime, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

class SignUploadDto {
  @IsIn(['amenity', 'product', 'avatar', 'post'])
  kind: 'amenity' | 'product' | 'avatar' | 'post';

  @IsString()
  @IsIn(ALLOWED_MIME as unknown as string[], {
    message: 'mime must be one of image/jpeg, image/png, image/webp',
  })
  contentType: AllowedMime;

  @IsInt()
  @Min(1)
  @Max(MAX_BYTES)
  contentLength: number;
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(
    @Inject(STORAGE_CLIENT) private readonly storage: StorageClient,
  ) {}

  @Post('sign')
  async sign(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SignUploadDto,
  ) {
    const ext = MIME_TO_EXT[dto.contentType];
    if (!ext) {
      throw new BadRequestException('Unsupported mime type');
    }

    const namespace =
      dto.kind === 'avatar'
        ? `users/${user.userId}/avatar`
        : `clubs/${user.activeClubId ?? 'global'}/${dto.kind}`;
    const key = `${namespace}/${ulid()}.${ext}`;

    return this.storage.signUpload({
      key,
      contentType: dto.contentType,
      contentLength: dto.contentLength,
    });
  }
}
