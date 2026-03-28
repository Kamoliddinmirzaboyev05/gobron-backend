import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class GenerateSlotsBatchDto {
  @ApiProperty({
    example: 30,
    description: 'Necha kun uchun slotlarni yaratish kerakligi',
  })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  days: number;
}
