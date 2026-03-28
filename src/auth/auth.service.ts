import { 
 Injectable, 
 ConflictException, 
 UnauthorizedException, 
 } from '@nestjs/common'; 
 import { JwtService } from '@nestjs/jwt'; 
 import { ConfigService } from '@nestjs/config'; 
 import { PrismaService } from '../prisma/prisma.service'; 
 import { RegisterDto } from './dto/register.dto'; 
 import { LoginDto } from './dto/login.dto'; 
 import { UpdateProfileDto } from './dto/update-profile.dto';
 import { Role } from '@prisma/client'; 
 import * as bcrypt from 'bcrypt'; 
 
 @Injectable() 
 export class AuthService { 
 constructor( 
 private prisma: PrismaService, 
 private jwt: JwtService, 
 private config: ConfigService, 
 ) {} 
 
 async register(dto: RegisterDto) { 
    try {
      // Login band emasligini tekshirish 
      const existingLogin = await this.prisma.user.findUnique({ 
        where: { login: dto.login }, 
      }); 
      if (existingLogin) throw new ConflictException('Bu login band'); 

      // Telefon raqami band emasligini tekshirish
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existingPhone) throw new ConflictException('Bu telefon raqami band');
      
      // Parolni hash qilish 
      const hashedPassword = await bcrypt.hash(dto.password, 10); 
      
      // User yaratish (Admin bo'lsa avtomatik Field relation bilan birga)
      const user = await this.prisma.user.create({ 
        data: { 
          fullName: dto.fullName, 
          login: dto.login, 
          phone: dto.phone,
          password: hashedPassword, 
          role: dto.role, 
          // Admin bo'lsa nested create orqali Field yaratish
          field: dto.role === Role.admin ? {
            create: {
              name: `${dto.fullName} ning maydoni`,
              isActive: false,
            }
          } : undefined
        }
      }); 
      
      const tokens = this.generateTokens(user.id); 
      
      return { 
        user: { 
          id: user.id, 
          fullName: user.fullName, 
          login: user.login, 
          phone: user.phone,
          role: user.role
        }, 
        ...tokens, 
      }; 
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
   } 
 
   async login(dto: LoginDto) { 
    try {
      // Userni topish (login yoki telefon raqami orqali)
      const user = await this.prisma.user.findFirst({ 
        where: {
          OR: [
            { login: dto.login },
            { phone: dto.login }
          ]
        }
      }); 
      if (!user) throw new UnauthorizedException('Login yoki parol noto\'g\'ri'); 
      
      // Parolni tekshirish 
      const isMatch = await bcrypt.compare(dto.password, user.password); 
      if (!isMatch) throw new UnauthorizedException('Login yoki parol noto\'g\'ri'); 
      
      const tokens = this.generateTokens(user.id); 
      
      return { 
        user: { 
          id: user.id, 
          fullName: user.fullName, 
          login: user.login, 
          phone: user.phone,
          role: user.role
        }, 
        ...tokens, 
      }; 
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
   } 
 
 async getMe(userId: string) { 
     return this.prisma.user.findUnique({ 
       where: { id: userId }, 
       select: { 
         id: true, 
         fullName: true, 
         login: true, 
         phone: true,
         role: true, 
         createdAt: true,
       } 
     }); 
   } 
 
   async updateProfile(userId: string, dto: UpdateProfileDto) {
     const data: any = {};
     if (dto.fullName) data.fullName = dto.fullName;
     if (dto.login) {
       const existing = await this.prisma.user.findFirst({
         where: { login: dto.login, NOT: { id: userId } },
       });
       if (existing) throw new ConflictException('Bu login band');
       data.login = dto.login;
     }
     if (dto.phone) {
       const existing = await this.prisma.user.findFirst({
         where: { phone: dto.phone, NOT: { id: userId } },
       });
       if (existing) throw new ConflictException('Bu telefon raqami band');
       data.phone = dto.phone;
     }
     if (dto.password) {
       data.password = await bcrypt.hash(dto.password, 10);
     }
 
     return this.prisma.user.update({
       where: { id: userId },
       data,
       select: {
         id: true,
         fullName: true,
         login: true,
         phone: true,
         role: true,
       },
     });
   } 
 
 generateTokens(userId: string) { 
    const payload = { sub: userId }; 
    const accessToken = this.jwt.sign(payload, { 
      expiresIn: this.config.get('JWT_EXPIRES_IN') || '1d', 
    }); 
    const refreshToken = this.jwt.sign(payload, { 
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d', 
    }); 
    return { accessToken, refreshToken }; 
  } 
 } 
