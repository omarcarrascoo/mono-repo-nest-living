import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';

export class CreateClubDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 280)
  description?: string;

  @IsOptional()
  @IsString()
  @Length(4, 16)
  @Matches(/^[a-zA-Z0-9-]+$/, {
    message: 'joinCode debe ser alfanumérico (4-16 chars)',
  })
  joinCode?: string;

  @IsOptional()
  @IsIn(['public', 'private'])
  privacy?: 'public' | 'private';
}

export class UpdateClubDto {
  @IsOptional() @IsString() @Length(2, 80) name?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Length(0, 280)
  description?: string | null;

  @IsOptional()
  @IsString()
  @Length(4, 16)
  @Matches(/^[a-zA-Z0-9-]+$/)
  joinCode?: string;

  @IsOptional() @IsIn(['public', 'private']) privacy?: 'public' | 'private';
  @IsOptional() @IsString() status?: string;
}

export class JoinClubDto {
  @IsString()
  @Length(4, 16)
  joinCode: string;
}

export class PromoteAdminDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsIn(['admin', 'user', 'kitchen_operator'])
  role?: 'admin' | 'user' | 'kitchen_operator';
}

export class UpdateMembershipDto {
  @IsOptional()
  @IsIn(['admin', 'user', 'kitchen_operator'])
  role?: 'admin' | 'user' | 'kitchen_operator';

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Length(0, 40)
  unitNumber?: string | null;
}

export class SwitchClubDto {
  @IsString() clubId: string;
}
