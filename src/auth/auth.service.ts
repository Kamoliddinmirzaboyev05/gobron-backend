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
 // Login band emasligini tekshirish 
 const existing = await this.prisma.user.findUnique({ 
 where: { login: dto.login }, 
 }); 
 if (existing) throw new ConflictException('Bu login band'); 
 
 // Parolni hash qilish 
 const hashedPassword = await bcrypt.hash(dto.password, 10); 
 
 // User yaratish 
 const user = await this.prisma.user.create({ 
 data: { 
 fullName: dto.fullName, 
 login: dto.login, 
 password: hashedPassword, 
 role: dto.role, 
 }, 
 }); 
 
 // Agar admin bo'lsa — bo'sh maydon yaratish 
 if (dto.role === Role.admin) { 
 await this.prisma.field.create({ 
 data: { 
 userId: user.id, 
 name: `${dto.fullName} ning maydoni`, 
 isActive: false, 
 }, 
 }); 
 } 
 
 const tokens = this.generateTokens(user.id); 
 
 return { 
 user: { 
 id: user.id, 
 fullName: user.fullName, 
 login: user.login, 
 role: user.role, 
 }, 
 ...tokens, 
 }; 
 } 
 
 async login(dto: LoginDto) { 
 // Userni topish 
 const user = await this.prisma.user.findUnique({ 
 where: { login: dto.login }, 
 include: { field: true }, 
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
 role: user.role, 
 field: user.field, 
 }, 
 ...tokens, 
 }; 
 } 
 
 async getMe(userId: string) { 
     return this.prisma.user.findUnique({ 
       where: { id: userId }, 
       select: { 
         id: true, 
         fullName: true, 
         login: true, 
         role: true, 
         createdAt: true, 
         field: true, 
       }, 
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
