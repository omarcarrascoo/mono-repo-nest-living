import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductOptionDto {
  @IsString() @Length(1, 60) id: string;

  @IsString() @Length(1, 80) name: string;

  @IsOptional() @IsNumber() priceDelta?: number;

  @IsOptional() @IsBoolean() available?: boolean;

  @IsOptional() @IsBoolean() default?: boolean;
}

export class ProductOptionGroupDto {
  @IsString() @Length(1, 60) id: string;

  @IsString() @Length(1, 80) name: string;

  @IsIn(['single', 'multiple']) mode: 'single' | 'multiple';

  @IsOptional() @IsBoolean() required?: boolean;

  @IsOptional() @IsInt() @Min(1) maxSelections?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionDto)
  @ArrayMaxSize(30)
  options: ProductOptionDto[];
}

export class CreateProductDto {
  @IsMongoId() categoryId: string;

  @IsString() @Length(1, 120) name: string;

  @IsOptional() @IsString() @Length(0, 800) description?: string;

  @IsOptional() @IsString() image?: string;

  @IsNumber() @Min(0) price: number;

  @IsOptional() @IsNumber() @Min(0) originalPrice?: number;

  @IsOptional() @IsIn(['available', 'sold_out', 'hidden']) status?: string;

  @IsOptional() @IsNumber() @Min(0) rating?: number;

  @IsOptional() @IsInt() @Min(0) reviewCount?: number;

  @IsOptional() @IsString() prepTime?: string;

  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionGroupDto)
  @ArrayMaxSize(10)
  optionGroups?: ProductOptionGroupDto[];

  @IsOptional() @IsInt() sortOrder?: number;

  @IsOptional() @IsBoolean() featured?: boolean;
}

export class UpdateProductDto {
  @IsOptional() @IsMongoId() categoryId?: string;
  @IsOptional() @IsString() @Length(1, 120) name?: string;
  @IsOptional() @IsString() @Length(0, 800) description?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsNumber() @Min(0) originalPrice?: number;
  @IsOptional() @IsIn(['available', 'sold_out', 'hidden']) status?: string;
  @IsOptional() @IsNumber() @Min(0) rating?: number;
  @IsOptional() @IsInt() @Min(0) reviewCount?: number;
  @IsOptional() @IsString() prepTime?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductOptionGroupDto)
  @ArrayMaxSize(10)
  optionGroups?: ProductOptionGroupDto[];
  @IsOptional() @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() featured?: boolean;
}

export class ListProductsQueryDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsMongoId() category?: string;
  @IsOptional() @IsIn(['available', 'sold_out', 'hidden']) status?: string;
  @IsOptional() @IsIn(['true', 'false']) featured?: string;
}
