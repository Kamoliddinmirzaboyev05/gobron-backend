import { ApiProperty } from '@nestjs/swagger';

export class SlotResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'uuid-field-id' })
  fieldId: string;

  @ApiProperty({ example: '2026-04-15' })
  slotDate: Date;

  @ApiProperty({ example: '18:00' })
  startTime: string;

  @ApiProperty({ example: '19:00' })
  endTime: string;

  @ApiProperty({ example: true })
  isAvailable: boolean;
}
