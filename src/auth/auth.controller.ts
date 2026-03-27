import { Controller, Post, Get, Body, UseGuards, Put } from '@nestjs/common'; 
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service'; 
import { RegisterDto } from './dto/register.dto'; 
 import { LoginDto } from './dto/login.dto'; 
 import { UpdateProfileDto } from './dto/update-profile.dto';
 import { JwtAuthGuard } from './guards/jwt-auth.guard'; 
import { CurrentUser } from '../common/decorators/current-user.decorator'; 
 
@ApiTags('Auth')
@Controller('auth') 
export class AuthController { 
  constructor(private authService: AuthService) {} 
 
  @Post('register') 
  @ApiOperation({ summary: 'Yangi foydalanuvchini ro\'yxatdan o\'tkazish' })
  @ApiBody({
    description: 'Ro\'yxatdan o\'tish ma\'lumotlari',
    schema: {
      example: {
        fullName: "Jasur Toshmatov",
        login: "jasur",
        phone: "+998901234567",
        password: "password123",
        role: "user"
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Foydalanuvchi muvaffaqiyatli yaratildi' })
  @ApiResponse({ status: 409, description: 'Login yoki telefon raqami band' })
  register(@Body() dto: RegisterDto) { 
    return this.authService.register(dto); 
  } 
 
  @Post('login') 
  @ApiOperation({ summary: 'Tizimga kirish (Login yoki telefon raqami orqali)' })
  @ApiBody({
    description: 'Kirish ma\'lumotlari (Login yoki telefon raqami)',
    schema: {
      example: {
        login: "+998901234567",
        password: "password123"
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli kirish, tokenlar qaytariladi' })
  @ApiResponse({ status: 401, description: 'Login yoki parol noto\'g\'ri' })
  login(@Body() dto: LoginDto) { 
    return this.authService.login(dto); 
  } 
 
  @Get('me') 
   @UseGuards(JwtAuthGuard) 
   @ApiBearerAuth()
   @ApiOperation({ summary: 'Joriy foydalanuvchi ma\'lumotlarini olish' })
   @ApiResponse({ status: 200, description: 'Foydalanuvchi ma\'lumotlari' })
   @ApiResponse({ status: 401, description: 'Avtorizatsiyadan o\'tilmagan' })
   getMe(@CurrentUser('id') userId: string) { 
     return this.authService.getMe(userId); 
   } 
 
  @Put('profile') 
  @UseGuards(JwtAuthGuard) 
  @ApiBearerAuth() 
  @ApiOperation({ summary: 'Profil ma\'lumotlarini yangilash' }) 
  @ApiResponse({ status: 200, description: 'Profil muvaffaqiyatli yangilandi' }) 
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) { 
    return this.authService.updateProfile(userId, dto); 
  } 
 } 
