import { Controller, Post, Delete, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Favorites')
@Controller('favorites')
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Maydonni sevimlilarga qo\'shish', 
    description: 'Foydalanuvchi berilgan maydonni o\'zining sevimli maydonlar ro\'yxatiga qo\'shadi.' 
  })
  @ApiBody({
    description: 'Sevimliga qo\'shish',
    schema: {
      example: {
        fieldId: "eab66ba7-08a5-4f76-a161-7306f130d434"
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Sevimliga qo‘shildi' })
  @ApiResponse({ status: 400, description: 'Noto‘g‘ri ma’lumotlar' })
  @ApiResponse({ status: 404, description: 'Maydon topilmadi' })
  @ApiResponse({ status: 409, description: 'Maydon allaqachon sevimlilarga qo\'shilgan' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateFavoriteDto) {
    return this.favoritesService.create(userId, dto);
  }

  @Delete(':fieldId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Maydonni sevimlilardan o\'chirish', 
    description: 'Berilgan maydon ID si bo\'yicha sevimli maydonlar ro\'yxatidan o\'chiradi.' 
  })
  @ApiResponse({ status: 200, description: 'Sevimlidan o‘chirildi' })
  @ApiResponse({ status: 404, description: 'Sevimli topilmadi' })
  remove(@CurrentUser('id') userId: string, @Param('fieldId') fieldId: string) {
    return this.favoritesService.remove(userId, fieldId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Mening sevimli maydonlarimni ko\'rish', 
    description: 'Tizimga kirgan foydalanuvchining barcha sevimli maydonlar ro\'yxatini qaytaradi.' 
  })
  @ApiResponse({ status: 200, description: 'Sevimli maydonlar ro\'yxati muvaffaqiyatli qaytarildi' })
  getMyFavorites(@CurrentUser('id') userId: string) {
    return this.favoritesService.getMyFavorites(userId);
  }
}
