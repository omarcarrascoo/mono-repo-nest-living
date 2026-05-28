import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateReservationDto {
  @IsMongoId()
  amenityId: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsString()
  @Length(0, 280)
  notes?: string;
}

export class UpdateReservationDto {
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsString()
  @Length(0, 280)
  notes?: string;
}

export class ListReservationsQueryDto {
  @IsOptional()
  @IsEnum(['upcoming', 'past', 'cancelled', 'all'])
  filter?: 'upcoming' | 'past' | 'cancelled' | 'all';

  @IsOptional()
  @IsDateString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class AdminListReservationsQueryDto {
  @IsOptional()
  @IsEnum(['upcoming', 'past', 'cancelled', 'all'])
  filter?: 'upcoming' | 'past' | 'cancelled' | 'all';

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsMongoId()
  amenityId?: string;

  @IsOptional()
  @IsDateString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class AvailabilityQueryDto {
  @IsString()
  @Matches(ISO_DATE, { message: 'date must be YYYY-MM-DD' })
  date: string;
}
