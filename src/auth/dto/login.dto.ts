import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator'; 
 
export class LoginDto { 
  @ApiProperty({ example: 'jasur', description: 'Login yoki telefon raqami' })
  @IsString() 
  login: string; 
 
  @ApiProperty({ example: '123456', description: 'Foydalanuvchi paroli' })
  @IsString() 
  password: string; 
} 
