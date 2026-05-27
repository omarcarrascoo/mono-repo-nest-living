import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class DayScheduleDto {
  @IsString()
  @Matches(HHMM, { message: 'open must be HH:mm' })
  open: string;

  @IsString()
  @Matches(HHMM, { message: 'close must be HH:mm' })
  close: string;

  @IsBoolean()
  closed: boolean;
}

export class WeeklyScheduleDto {
  @ValidateNested() @Type(() => DayScheduleDto) mon: DayScheduleDto;
  @ValidateNested() @Type(() => DayScheduleDto) tue: DayScheduleDto;
  @ValidateNested() @Type(() => DayScheduleDto) wed: DayScheduleDto;
  @ValidateNested() @Type(() => DayScheduleDto) thu: DayScheduleDto;
  @ValidateNested() @Type(() => DayScheduleDto) fri: DayScheduleDto;
  @ValidateNested() @Type(() => DayScheduleDto) sat: DayScheduleDto;
  @ValidateNested() @Type(() => DayScheduleDto) sun: DayScheduleDto;
}

class FeatureDto {
  @IsString() icon: string;
  @IsString() label: string;
}

export class CreateAmenityDto {
  @IsString() @Length(1, 120) title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsMongoId() categoryId?: string;

  @IsOptional() @IsIn(['available', 'busy', 'maintenance']) status?: string;

  @IsOptional() @ValidateNested() @Type(() => WeeklyScheduleDto)
  schedule?: WeeklyScheduleDto;

  @IsOptional() @IsInt() @Min(15) @Max(480)
  slotDurationMinutes?: number;

  @IsOptional() @IsInt() @Min(1) @Max(500)
  maxConcurrentReservations?: number;

  @IsOptional() @IsInt() @Min(0) @Max(50)
  maxPerUserPerDay?: number;

  @IsOptional() @IsInt() @Min(0)
  bookingLeadMinutes?: number;

  @IsOptional() @IsInt() @Min(1) @Max(365)
  bookingHorizonDays?: number;

  @IsOptional() @IsString()
  timezone?: string;

  @IsOptional() @IsInt() @Min(0)
  capacity?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(5)
  rating?: number;

  @IsOptional() @IsInt() @Min(0)
  reviews?: number;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => FeatureDto)
  features?: FeatureDto[];

  @IsOptional() @IsArray() @IsString({ each: true })
  rules?: string[];
}

export class UpdateAmenityDto {
  @IsOptional() @IsString() @Length(1, 120) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsMongoId() categoryId?: string;

  @IsOptional() @IsIn(['available', 'busy', 'maintenance']) status?: string;

  @IsOptional() @ValidateNested() @Type(() => WeeklyScheduleDto)
  schedule?: WeeklyScheduleDto;

  @IsOptional() @IsInt() @Min(15) @Max(480)
  slotDurationMinutes?: number;

  @IsOptional() @IsInt() @Min(1) @Max(500)
  maxConcurrentReservations?: number;

  @IsOptional() @IsInt() @Min(0) @Max(50)
  maxPerUserPerDay?: number;

  @IsOptional() @IsInt() @Min(0)
  bookingLeadMinutes?: number;

  @IsOptional() @IsInt() @Min(1) @Max(365)
  bookingHorizonDays?: number;

  @IsOptional() @IsString()
  timezone?: string;

  @IsOptional() @IsInt() @Min(0)
  capacity?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(5)
  rating?: number;

  @IsOptional() @IsInt() @Min(0)
  reviews?: number;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => FeatureDto)
  features?: FeatureDto[];

  @IsOptional() @IsArray() @IsString({ each: true })
  rules?: string[];
}

export class ListAmenitiesQueryDto {
  @IsOptional() @IsString()
  q?: string;

  @IsOptional() @IsMongoId()
  category?: string;

  @IsOptional() @IsIn(['true', 'false'])
  favorite?: string;
}
