import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schemas/category.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Amenity } from '../amenities/schemas/amenity.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Amenity.name) private amenityModel: Model<Amenity>,
  ) {}

  async listForResidency(residencyId: string, includeCounts = true) {
    const categories = await this.categoryModel
      .find({ residencyId, active: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec();

    if (!includeCounts) return categories;

    // Normalizamos categoryId a string antes de agrupar — algunos docs legacy
    // lo tienen como string y otros como ObjectId, y un $group ingenuo los
    // contaría por separado.
    const counts = await this.amenityModel.aggregate([
      { $match: { residencyId } },
      {
        $group: {
          _id: { $toString: '$categoryId' },
          count: { $sum: 1 },
        },
      },
    ]);
    const countById = new Map<string, number>(
      counts.map((c) => [String(c._id), c.count]),
    );

    return categories.map((c) => ({
      ...c,
      amenityCount: countById.get(String(c._id)) ?? 0,
    }));
  }

  async create(residencyId: string, dto: CreateCategoryDto) {
    const exists = await this.categoryModel.findOne({ residencyId, slug: dto.slug });
    if (exists) throw new ConflictException('Slug already exists in this residency');
    return this.categoryModel.create({ ...dto, residencyId });
  }

  async update(id: string, residencyId: string, dto: UpdateCategoryDto) {
    const updated = await this.categoryModel.findOneAndUpdate(
      { _id: id, residencyId },
      dto,
      { new: true },
    );
    if (!updated) throw new NotFoundException('Category not found');
    return updated;
  }

  async remove(id: string, residencyId: string) {
    const used = await this.amenityModel.countDocuments({ categoryId: id, residencyId });
    if (used > 0) {
      throw new ConflictException(
        `Cannot delete: ${used} amenities still use this category`,
      );
    }
    const result = await this.categoryModel.deleteOne({ _id: id, residencyId });
    if (result.deletedCount === 0) throw new NotFoundException('Category not found');
    return { success: true };
  }
}
