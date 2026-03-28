import {
  Controller,
  Get,
  Patch,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FieldsService } from './fields.service';
import { UpdateFieldDto } from './dto/update-field.dto';
import { SearchFieldsDto } from './dto/search-fields.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { SlotResponseDto } from '../slots/dto/slot-response.dto';

@ApiTags('Fields')
@Controller('fields')
export class FieldsController {
  constructor(private fieldsService: FieldsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search and filter fields by name, city, price, rating and amenities' })
  @ApiResponse({ status: 200, description: 'Return list of fields matching search criteria' })
  search(@Query() dto: SearchFieldsDto) {
    return this.fieldsService.search(dto);
  }

  // Public: barcha aktiv maydonlar (city filter bilan)
  @Get()
  @ApiOperation({ summary: 'Barcha faol maydonlarni olish (city filter bilan)' })
  findAll(@Query('city') city?: string) {
    return this.fieldsService.findAll(city);
  }

  // Public: barcha aktiv maydonlar (city filtersiz)
  @Get('all/list')
  @ApiOperation({ summary: 'Barcha faol maydonlarni olish (filtersiz)' })
  findAllList() {
    return this.fieldsService.findAll();
  }

  // Public: bitta maydon
  @Get(':id')
  @ApiOperation({ summary: 'Bitta maydon haqida ma\'lumot olish' })
  findOne(@Param('id') id: string) {
    return this.fieldsService.findOne(id);
  }

  // Public: maydon slotlari
  @Get(':id/slots')
  @ApiOperation({ summary: 'Maydonning bo\'sh vaqtlarini olish' })
  @ApiResponse({ status: 200, type: [SlotResponseDto], description: 'Sana bo\'yicha slotlar ro\'yxati' })
  getSlots(@Param('id') fieldId: string, @Query('date') date: string) {
    return this.fieldsService.getSlots(fieldId, date);
  }

  // Admin: o'z maydonini ko'rish
  @Get('admin/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adminning o\'z maydonini ko\'rishi' })
  getMyField(@CurrentUser('id') userId: string) {
    return this.fieldsService.findMyField(userId);
  }

  // Admin: o'z maydonini yangilash (PATCH)
  @Patch('admin/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adminning o\'z maydonini qisman yangilashi (PATCH)' })
  updatePatch(@CurrentUser('id') userId: string, @Body() dto: UpdateFieldDto) {
    return this.fieldsService.update(userId, dto);
  }

  // Admin: maydon rasmini yuklash
  @Post('admin/my/upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Admin maydon rasmini yuklashi (Multipart form-data)',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    }
  })
  @ApiOperation({ summary: 'Admin maydon rasmini yuklashi' })
  async uploadImage(@CurrentUser('id') userId: string, @UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('Rasm fayli kerak');
      }
      
      console.log('Fayl qabul qilindi:', file.originalname);
      console.log('Fayl hajmi:', file.size);
      console.log('Fayl turi:', file.mimetype);
      
      // Adminning o'z maydonini topish
      const field = await this.fieldsService.findMyField(userId);
      
      const result = await this.fieldsService.uploadImage(field.id, file);
      return {
        success: true,
        message: 'Rasm muvaffaqiyatli yuklandi',
        data: result
      };
    } catch (error) {
      console.error('Rasm yuklashda xato:', error);
      throw error;
    }
  }

  // Admin: maydon rasmini o'chirish
  @Delete('admin/my/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin maydon rasmini o\'chirishi' })
  @ApiBody({
    description: 'Admin maydon rasmini o\'chirishi uchun rasm URLini yuboring',
    schema: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          example: 'https://i.ibb.co/example/image.jpg',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Rasm muvaffaqiyatli o\'chirildi' })
  @ApiResponse({ status: 400, description: 'Rasm URLi topilmadi yoki xato' })
  @ApiResponse({ status: 404, description: 'Maydon topilmadi' })
  async deleteImage(@CurrentUser('id') userId: string, @Body('imageUrl') imageUrl: string) {
    try {
      if (!imageUrl) {
        throw new BadRequestException('Image URL is required');
      }
      const field = await this.fieldsService.findMyField(userId);
      const updatedField = await this.fieldsService.deleteImage(field.id, imageUrl);
      return {
        success: true,
        message: 'Rasm muvaffaqiyatli o\'chirildi',
        data: updatedField
      };
    } catch (error) {
      console.error('Rasm o\'chirishda xato:', error);
      throw error;
    }
  }

  // Admin: o'z maydonini to'liq yangilash (PUT)
  @Put('admin/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adminning o\'z maydonini to\'liq yangilashi (PUT)' })
  updatePut(@CurrentUser('id') userId: string, @Body() dto: UpdateFieldDto) {
    return this.fieldsService.update(userId, dto);
  }

  // Superadmin: barcha maydonlar
  @Get('superadmin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Superadmin barcha maydonlarni ko\'rishi' })
  findAllAdmin() {
    return this.fieldsService.findAllAdmin();
  }
}
