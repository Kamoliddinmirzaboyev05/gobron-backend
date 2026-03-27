import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFavoriteDto } from './dto/create-favorite';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add a field to the user's favorites
   */
  async create(userId: string, dto: CreateFavoriteDto) {
    // 1. Check if the field exists
    const field = await this.prisma.field.findUnique({
      where: { id: dto.fieldId },
    });
    if (!field) throw new NotFoundException('Field not found');

    // 2. Try to add to favorites (unique constraint will prevent duplicates)
    try {
      return await (this.prisma as any).favorite.create({
        data: {
          userId,
          fieldId: dto.fieldId,
        },
        include: { field: true },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Field already in favorites');
      }
      throw error;
    }
  }

  /**
   * Remove a field from the user's favorites
   */
  async remove(userId: string, fieldId: string) {
    const favorite = await (this.prisma as any).favorite.findUnique({
      where: {
        userId_fieldId: {
          userId,
          fieldId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await (this.prisma as any).favorite.delete({
      where: {
        userId_fieldId: {
          userId,
          fieldId,
        },
      },
    });

    return { message: 'Removed from favorites' };
  }

  /**
   * Get all favorite fields of the current user
   */
  async getMyFavorites(userId: string) {
    const favorites = await (this.prisma as any).favorite.findMany({
      where: { userId },
      include: {
        field: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to return field objects directly
    return favorites.map((fav: any) => fav.field);
  }
}
