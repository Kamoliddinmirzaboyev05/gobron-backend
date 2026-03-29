import { ApiProperty } from '@nestjs/swagger';

export class SlotDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: '18:00' })
  startTime: string;

  @ApiProperty({ example: '19:00' })
  endTime: string;

  @ApiProperty({ example: true })
  isAvailable: boolean;
}

export class DaySlotsDto {
  @ApiProperty({ example: '2026-03-29' })
  date: string;

  @ApiProperty({ example: 'Bugun' })
  dayLabel: string;

  @ApiProperty({ type: [SlotDto] })
  slots: SlotDto[];
}

export class FieldsSlotsResponseDto {
  @ApiProperty({ type: [DaySlotsDto] })
  dates: DaySlotsDto[];
}
