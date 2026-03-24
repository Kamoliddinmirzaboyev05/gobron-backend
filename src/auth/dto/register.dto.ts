import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, MinLength } from 'class-validator'; 
import { Role } from '@prisma/client'; 
 
export class RegisterDto { 
  @ApiProperty({ example: 'Jasur Toshmatov', description: 'Foydalanuvchining to\'liq ismi' })
  @IsString() 
  fullName: string; 
 
  @ApiProperty({ example: 'jasur', description: 'Login (kamida 3 ta belgi)' })
  @IsString() 
  @MinLength(3) 
  login: string; 
 
  @ApiProperty({ example: '123456', description: 'Parol (kamida 6 ta belgi)' })
  @IsString() 
  @MinLength(6) 
  password: string; 
 
  @ApiProperty({ enum: Role, example: Role.user, description: 'Foydalanuvchi roli' })
  @IsEnum(Role) 
  role: Role; 
} 
