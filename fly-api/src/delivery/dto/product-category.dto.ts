import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

const SLUG = /^[a-z0-9-]+$/;

export class CreateProductCategoryDto {
  @IsString() @Length(1, 60) name: string;

  @IsString()
  @Length(1, 60)
  @Matches(SLUG, { message: 'slug must be lowercase letters, digits and dashes' })
  slug: string;

  @IsString() @Length(1, 30) icon: string;

  @IsOptional() @IsString() color?: string;

  @IsOptional() @IsInt() sortOrder?: number;

  @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateProductCategoryDto {
  @IsOptional() @IsString() @Length(1, 60) name?: string;

  @IsOptional() @IsString() @Length(1, 30) icon?: string;

  @IsOptional() @IsString() color?: string;

  @IsOptional() @IsInt() sortOrder?: number;

  @IsOptional() @IsBoolean() active?: boolean;
}
