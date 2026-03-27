import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Jasur Toshmatov', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'jasur_new', required: false })
  @IsString()
  @IsOptional()
  @MinLength(3)
  login?: string;

  @ApiProperty({ example: '+998901234567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'newpassword123', required: false })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;
}
