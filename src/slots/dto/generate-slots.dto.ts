import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class GenerateSlotsDto {
  @ApiProperty({
    example: '2026-04-15',
    description: 'Slotlar yaratiladigan sana',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;
}
