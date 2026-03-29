import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-field-id' })
  @IsString()
  fieldId: string;

  @ApiProperty({ example: '2026-03-29' })
  @IsDateString()
  bookingDate: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '19:00' })
  @IsString()
  endTime: string;

  @ApiProperty({ example: 150000 })
  @IsInt()
  @Min(0)
  totalPrice: number;

  @ApiProperty({ example: 'Admin orqali band qilindi', required: false })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({ example: 'Ali Valiyev', required: false })
  @IsString()
  @IsOptional()
  clientName?: string;

  @ApiProperty({ example: '+998901234567', required: false })
  @IsString()
  @IsOptional()
  clientPhone?: string;

  @ApiProperty({ example: 'uuid-slot-id', required: false })
  @IsString()
  @IsOptional()
  timeSlotId?: string;
}
