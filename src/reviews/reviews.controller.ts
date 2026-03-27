import { Controller, Post, Get, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Foydalanuvchi maydon uchun sharh va baho qoldiradi', 
    description: 'Foydalanuvchi band qilib bo\'lgan maydon uchun 1 dan 5 gacha baho va sharh qoldiradi. Har bir foydalanuvchi bitta maydon uchun faqat bitta sharh qoldira oladi.' 
  })
  @ApiBody({
    description: 'Sharh qoldirish',
    schema: {
      example: {
        fieldId: "eab66ba7-08a5-4f76-a161-7306f130d434",
        rating: 5,
        comment: "Maydon juda zo'r ekan, hamma sharoitlari bor!"
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Sharh muvaffaqiyatli qo‘shildi' })
  @ApiResponse({ status: 400, description: 'Noto‘g‘ri ma’lumotlar yoki foydalanuvchi allaqachon sharh qoldirgan' })
  @ApiResponse({ status: 404, description: 'Maydon topilmadi' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Foydalanuvchining barcha sharhlarini olish', 
    description: 'Tizimga kirgan foydalanuvchi tomonidan qoldirilgan barcha sharhlar ro\'yxatini qaytaradi.' 
  })
  @ApiResponse({ status: 200, description: 'Sharhlar ro\'yxati muvaffaqiyatli qaytarildi' })
  getMyReviews(@CurrentUser('id') userId: string) {
    return this.reviewsService.getMyReviews(userId);
  }

  @Get('field/:fieldId')
  @ApiOperation({ 
    summary: 'Maydonning barcha sharhlarini olish', 
    description: 'Berilgan maydon ID si bo\'yicha barcha foydalanuvchilar qoldirgan sharhlarni qaytaradi.' 
  })
  @ApiResponse({ status: 200, description: 'Maydon sharhlari muvaffaqiyatli qaytarildi' })
  @ApiResponse({ status: 404, description: 'Maydon topilmadi' })
  getFieldReviews(@Param('fieldId') fieldId: string) {
    return this.reviewsService.getFieldReviews(fieldId);
  }
}
