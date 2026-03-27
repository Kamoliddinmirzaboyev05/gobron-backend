import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Leave a review for a field
   * Calculates and updates the field's average rating
   */
  async create(userId: string, dto: CreateReviewDto) {
    // 1. Check if the field exists
    const field = await this.prisma.field.findUnique({
      where: { id: dto.fieldId },
    });
    if (!field) throw new NotFoundException('Field not found');

    // 2. Check if the user has already reviewed this field (optional: can limit to 1 review per user)
    const existingReview = await (this.prisma as any).review.findFirst({
      where: { userId, fieldId: dto.fieldId },
    });
    if (existingReview) {
      throw new BadRequestException('You have already reviewed this field');
    }

    // 3. Create the review
    const review = await (this.prisma as any).review.create({
      data: {
        userId,
        fieldId: dto.fieldId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: { user: true },
    });

    // 4. Update the field's average rating and count
    await this.updateFieldRating(dto.fieldId);

    return review;
  }

  /**
   * Get all reviews for a specific field
   */
  async getFieldReviews(fieldId: string) {
    return await (this.prisma as any).review.findMany({
      where: { fieldId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all reviews left by the current user
   */
  async getMyReviews(userId: string) {
    return await (this.prisma as any).review.findMany({
      where: { userId },
      include: {
        field: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Recalculates the average rating for a field and updates it
   */
  private async updateFieldRating(fieldId: string) {
    const reviews = await (this.prisma as any).review.findMany({
      where: { fieldId },
      select: { rating: true },
    });

    const count = reviews.length;
    const avgRating = count > 0 
      ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / count 
      : 0;

    await (this.prisma as any).field.update({
      where: { id: fieldId },
      data: {
        rating: avgRating,
        reviewCount: count,
      },
    });
  }
}
