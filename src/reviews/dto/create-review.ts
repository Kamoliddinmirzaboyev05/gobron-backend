import { IsString, IsInt, Min, Max, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'The ID of the field to review' })
  @IsUUID()
  fieldId: string;

  @ApiProperty({ example: 5, description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Great field, well maintained!', description: 'Review comment', required: false })
  @IsString()
  @IsOptional()
  comment?: string;
}
