import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateFieldDto } from './dto/update-field.dto';
import { SearchFieldsDto } from './dto/search-fields.dto';
import axios from 'axios';
import FormData from 'form-data';

@Injectable()
export class FieldsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Search fields with filters
   */
  async search(dto: SearchFieldsDto) {
    const { name, city, maxPrice, minRating, amenities } = dto;

    const where: any = {
      isActive: true,
    };

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (maxPrice) {
      where.pricePerHour = { lte: maxPrice };
    }

    if (minRating) {
      where.rating = { gte: minRating };
    }

    if (amenities && amenities.length > 0) {
      where.amenities = { hasEvery: amenities };
    }

    return (this.prisma as any).field.findMany({
      where,
      orderBy: [
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Uploads an image to ImgBB using their API v1
   * @param file - The file received from Multer
   * @returns Promise<string> - The URL of the uploaded image
   */
  private async uploadToImgBB(file: Express.Multer.File): Promise<string> {
    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
      console.error('CRITICAL: IMGBB_API_KEY is not defined in the environment variables!');
      throw new InternalServerErrorException('Image upload service configuration error. Please contact administrator.');
    }

    try {
      const form = new FormData();
      form.append('key', apiKey);
      form.append('image', file.buffer.toString('base64'));

      const response = await axios.post('https://api.imgbb.com/1/upload', form, {
        headers: {
          ...form.getHeaders(),
        },
        timeout: 30000,
      });

      if (response.data && response.data.success) {
        // Prefer display_url if available, otherwise use url
        const imageUrl = response.data.data.display_url || response.data.data.url;
        console.log(`Successfully uploaded image to ImgBB: ${imageUrl}`);
        return imageUrl;
      } else {
        throw new Error('ImgBB upload failed: success flag is false');
      }
    } catch (error) {
      console.error('ImgBB upload error details:', error.response?.data || error.message);
      throw new BadRequestException(`Failed to upload image to ImgBB: ${error.message}`);
    }
  }

  /**
   * Main method to upload field image and update the database
   * @param fieldId - The ID of the field to update
   * @param file - The file received from Multer
   * @returns Promise<any> - The updated field object
   */
  async uploadImage(fieldId: string, file: Express.Multer.File) {
    if (!fieldId) throw new BadRequestException('Field ID is required');
    if (!file) throw new BadRequestException('File is required');

    console.log(`Starting image upload process for Field ID: ${fieldId}`);

    // Find the field in the database
    const field = await (this.prisma as any).field.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      console.error(`Field not found with ID: ${fieldId}`);
      throw new NotFoundException(`Field with ID ${fieldId} not found`);
    }

    // Clean existing images: remove "undefined", "your-storage.com", and empty strings
    const cleanedImages = (field.images || []).filter((img) => {
      if (!img) return false;
      if (img.includes('undefined')) return false;
      if (img.includes('your-storage.com')) return false;
      return true;
    });

    // Upload new image to ImgBB
    const newImageUrl = await this.uploadToImgBB(file);

    // Add new image to the cleaned images array
    const updatedImagesList = [...cleanedImages, newImageUrl];

    // Save updated field to the database
    const updatedField = await (this.prisma as any).field.update({
      where: { id: fieldId },
      data: {
        images: updatedImagesList,
      },
    });

    console.log(`Successfully updated Field ID: ${fieldId} with new image: ${newImageUrl}`);
    console.log(`Current image count for Field ID ${fieldId}: ${updatedField.images.length}`);

    return updatedField;
  }

  // Barcha aktiv maydonlar — foydalanuvchilar uchun
  async findAll(city?: string) {
    const where: any = { isActive: true };
    if (city) {
      where.city = city;
    }
    return (this.prisma as any).field.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Ommabop maydonlar (rating va reviewCount bo'yicha)
  async getPopular() {
    return (this.prisma as any).field.findMany({
      where: { isActive: true },
      orderBy: [
        { rating: 'desc' },
        { reviewCount: 'desc' },
      ],
      take: 10,
    });
  }

  // Tavsiya etilgan maydonlar (yangi va yuqori ratingli)
  async getRecommended() {
    return (this.prisma as any).field.findMany({
      where: { isActive: true },
      orderBy: [
        { createdAt: 'desc' },
        { rating: 'desc' },
      ],
      take: 10,
    });
  }

  // Maydon bandlik holati (summary)
  async getAvailability(fieldId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next7Days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      next7Days.push(d);
    }

    const slots = await (this.prisma as any).timeSlot.findMany({
      where: {
        fieldId,
        slotDate: { in: next7Days },
      },
    });

    return next7Days.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const daySlots = slots.filter((s: any) => s.slotDate.toISOString().split('T')[0] === dateStr);
      const availableCount = daySlots.filter((s: any) => s.isAvailable).length;
      const totalCount = daySlots.length;

      return {
        date: dateStr,
        availableCount,
        totalCount,
        percentage: totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0,
      };
    });
  }

  // Bitta maydon — public
  async findOne(id: string) {
    const field = await (this.prisma as any).field.findUnique({
      where: { id },
    });
    if (!field) throw new NotFoundException('Maydon topilmadi');
    return field;
  }

  // Admin o'z maydonini ko'radi
  async findMyField(userId: string) {
    const field = await (this.prisma as any).field.findFirst({
      where: { userId },
    });
    if (!field) throw new NotFoundException('Maydon topilmadi');
    return field;
  }

  // Admin o'z maydonini yangilaydi
  async update(userId: string, dto: UpdateFieldDto) {
    const field = await (this.prisma as any).field.findFirst({
      where: { userId },
    });
    if (!field) throw new NotFoundException('Maydon topilmadi');

    return (this.prisma as any).field.update({
      where: { id: field.id },
      data: dto,
    });
  }

  // Superadmin — barcha maydonlar (aktiv + nofaol)
  async findAllAdmin() {
    return (this.prisma as any).field.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Deletes a specific image from the field's images array
   * @param fieldId - The ID of the field
   * @param imageUrl - The URL of the image to remove
   * @returns Promise<Field> - The updated field object
   */
  async deleteImage(fieldId: string, imageUrl: string) {
    if (!fieldId) throw new BadRequestException('Field ID is required');
    if (!imageUrl) throw new BadRequestException('Image URL is required');

    console.log(`Starting image deletion for Field ID: ${fieldId}, URL: ${imageUrl}`);

    const field = await (this.prisma as any).field.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID ${fieldId} not found`);
    }

    const currentImages = field.images || [];
    const updatedImages = currentImages.filter((img) => img !== imageUrl);

    if (currentImages.length === updatedImages.length) {
      throw new BadRequestException('Image URL not found in field images');
    }

    const updatedField = await (this.prisma as any).field.update({
      where: { id: fieldId },
      data: {
        images: updatedImages,
      },
    });

    console.log(`Successfully deleted image from Field ID: ${fieldId}. Current count: ${updatedField.images.length}`);
    return updatedField;
  }
}
