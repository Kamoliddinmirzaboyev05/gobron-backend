import {
  Controller,
  Get,
  Patch,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FieldsService } from './fields.service';
import { UpdateFieldDto } from './dto/update-field.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Fields')
@Controller('fields')
export class FieldsController {
  constructor(private fieldsService: FieldsService) {}

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
