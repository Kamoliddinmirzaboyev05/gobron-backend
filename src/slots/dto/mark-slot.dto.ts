import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, Matches } from 'class-validator';

export class MarkSlotDto {
  @ApiProperty({
    example: '2026-04-15',
    description: 'Slot sanasi',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    example: '18:00',
    description: 'Boshlanish vaqti (HH:mm)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):00$/, { message: 'Vaqt HH:00 formatida bo\'lishi kerak' })
  startTime: string;

  @ApiProperty({
    example: '19:00',
    description: 'Tugash vaqti (HH:mm)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):00$/, { message: 'Vaqt HH:00 formatida bo\'lishi kerak' })
  endTime: string;
}
