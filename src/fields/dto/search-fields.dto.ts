import { IsString, IsOptional, IsInt, Min, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SearchFieldsDto {
  @ApiProperty({ required: false, description: 'Search by field name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false, description: 'Filter by city' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false, description: 'Maximum price per hour' })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @ApiProperty({ required: false, description: 'Minimum rating' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minRating?: number;

  @ApiProperty({ required: false, description: 'Required amenities (comma separated or multiple values)' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Type(() => String)
  amenities?: string[];
}
