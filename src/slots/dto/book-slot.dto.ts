import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class BookSlotDto {
  @ApiProperty({
    description: 'Slotning UUID identifikatori',
    example: '784fe600-fbac-4ff7-9533-b1311bebec2',
  })
  @IsUUID()
  @IsNotEmpty()
  slotId: string;

  @ApiPropertyOptional({
    description: 'Maydonning UUID identifikatori',
    example: '73b68bca-c255-4709-965c-951f48a20393',
  })
  @IsUUID()
  @IsOptional()
  fieldId?: string;

  @ApiPropertyOptional({
    description: 'Band qilinayotgan sana (YYYY-MM-DD)',
    example: '2026-03-30',
  })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    description: 'Boshlanish vaqti (HH:mm)',
    example: '09:00',
  })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Tugash vaqti (HH:mm)',
    example: '10:00',
  })
  @IsString()
  @IsOptional()
  endTime?: string;
}
