import {
  IsString,
  IsInt,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  fieldId: string;

  @IsDateString()
  bookingDate: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsInt()
  @Min(0)
  totalPrice: number;

  @IsString()
  @IsOptional()
  note?: string;
}
