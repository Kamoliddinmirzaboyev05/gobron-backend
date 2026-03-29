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
import { FieldsSlotsResponseDto } from '../slots/dto/slot-response.dto';
import { SlotsService } from '../slots/slots.service';

@ApiTags('Fields')
@Controller('fields')
export class FieldsController {
  constructor(
    private fieldsService: FieldsService,
    private slotsService: SlotsService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Search and filter fields by name, city, price, rating and amenities' })
  @ApiResponse({ status: 200, description: 'Return list of fields matching search criteria' })
  search(@Query() dto: SearchFieldsDto) {
    return this.fieldsService.search(dto);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Ommabop maydonlarni olish' })
  @ApiResponse({ status: 200, description: 'Ommabop maydonlar ro\'yxati' })
  getPopular() {
    return this.fieldsService.getPopular();
  }

  @Get('recommended')
  @ApiOperation({ summary: 'Tavsiya etilgan maydonlarni olish' })
  @ApiResponse({ status: 200, description: 'Tavsiya etilgan maydonlar ro\'yxati' })
  getRecommended() {
    return this.fieldsService.getRecommended();
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Maydon bandlik holati (keyingi 7 kun)' })
  @ApiResponse({ 
    status: 200, 
    description: '7 kunlik bandlik summary',
    schema: {
      example: [
        { date: '2026-03-29', availableCount: 5, totalCount: 15, percentage: 33 }
      ]
    }
  })
  getAvailability(@Param('id') id: string) {
    return this.fieldsService.getAvailability(id);
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

  // Public: maydon slotlari (3 kunlik)
  @Get(':id/slots')
  @ApiOperation({ summary: 'Maydonning bo\'sh vaqtlarini olish (keyingi 3 kun yoki tanlangan sana)' })
  @ApiResponse({ status: 200, type: FieldsSlotsResponseDto, description: 'Guruhlangan slotlar ro\'yxati' })
  getSlots(@Param('id') fieldId: string, @Query('date') date?: string) {
    return this.slotsService.getSlots(fieldId, date);
  }

  // Admin: o'z maydonini ko'rish
  @ApiTags('Admin - Fields')
  @Get('admin/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adminning o\'z maydonini ko\'rishi' })
  @ApiResponse({ status: 200, description: 'Maydon ma\'lumotlari' })
  getMyField(@CurrentUser('id') userId: string) {
    return this.fieldsService.findMyField(userId);
  }

  // Admin: o'z maydonini yangilash (PATCH)
  @ApiTags('Admin - Fields')
  @Patch('admin/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adminning o\'z maydonini qisman yangilashi (PATCH)' })
  @ApiResponse({ status: 200, description: 'Yangilangan maydon' })
  updatePatch(@CurrentUser('id') userId: string, @Body() dto: UpdateFieldDto) {
    return this.fieldsService.update(userId, dto);
  }

  // Admin: o'z maydonini to'liq yangilash (PUT)
  @ApiTags('Admin - Fields')
  @Put('admin/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adminning o\'z maydonini to\'liq yangilashi (PUT)' })
  @ApiResponse({ status: 200, description: 'Yangilangan maydon' })
  updatePut(@CurrentUser('id') userId: string, @Body() dto: UpdateFieldDto) {
    return this.fieldsService.update(userId, dto);
  }

  // Admin: maydon rasmini yuklash
  @ApiTags('Admin - Images')
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
  @ApiResponse({ status: 201, description: 'Rasm muvaffaqiyatli yuklandi' })
  async uploadImage(@CurrentUser('id') userId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Rasm yuklanmadi');
    return this.fieldsService.uploadImage(userId, file);
  }

  // Admin: maydon rasmini o'chirish
  @ApiTags('Admin - Images')
  @Delete('admin/my/image/:imageName')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin maydon rasmini o\'chirishi' })
  @ApiResponse({ status: 200, description: 'Rasm o\'chirildi' })
  deleteImage(
    @CurrentUser('id') userId: string,
    @Param('imageName') imageName: string,
  ) {
    return this.fieldsService.deleteImage(userId, imageName);
  }

  // Superadmin: barcha maydonlar
  @ApiTags('Admin - Fields')
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Superadmin barcha maydonlarni ko\'rishi' })
  @ApiResponse({ status: 200, description: 'Barcha maydonlar ro\'yxati' })
  findAllAdmin() {
    return this.fieldsService.findAllAdmin();
  }
}
