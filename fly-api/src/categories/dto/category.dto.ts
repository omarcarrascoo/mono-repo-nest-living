import { IsBoolean, IsHexColor, IsInt, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Length(1, 60)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase letters, numbers and dashes' })
  @Length(1, 60)
  slug: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @Length(1, 60)
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
