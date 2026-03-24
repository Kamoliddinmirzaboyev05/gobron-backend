import {
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFieldDto {
  @ApiProperty({ example: 'Kamoliddin Mirzaboyev ning maydoni', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Yunusobod tumani, 7-mavze', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'Toshkent', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 41.311081, required: false, nullable: true })
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiProperty({ example: 69.240562, required: false, nullable: true })
  @IsNumber()
  @IsOptional()
  lng?: number;

  @ApiProperty({ example: 150000, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  pricePerHour?: number;

  @ApiProperty({ example: '40x20', required: false, nullable: true })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiProperty({ example: 'Sun\'iy o\'t', required: false, nullable: true })
  @IsString()
  @IsOptional()
  surface?: string;

  @ApiProperty({ example: 'Yaxshi maydon', required: false, nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['Dush', 'Kiyim almashtirish xonasi'], required: false })
  @IsArray()
  @IsOptional()
  amenities?: string[];

  @ApiProperty({ example: ['https://example.com/image1.jpg'], required: false })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: '08:00', required: false })
  @IsString()
  @IsOptional()
  openTime?: string;

  @ApiProperty({ example: '23:00', required: false })
  @IsString()
  @IsOptional()
  closeTime?: string;

  @ApiProperty({ example: '+998901234567', required: false, nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
