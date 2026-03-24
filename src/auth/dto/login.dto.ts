import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator'; 
 
export class LoginDto { 
  @ApiProperty({ example: 'jasur', description: 'Foydalanuvchi logini' })
  @IsString() 
  login: string; 
 
  @ApiProperty({ example: '123456', description: 'Foydalanuvchi paroli' })
  @IsString() 
  password: string; 
} 
