import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductCategory } from './schemas/product-category.schema';
import { Product } from './schemas/product.schema';
import {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from './dto/product-category.dto';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectModel(ProductCategory.name)
    private categoryModel: Model<ProductCategory>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async listForClub(clubId: string, includeCounts = true) {
    const categories = await this.categoryModel
      .find({ clubId, active: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec();

    if (!includeCounts) return categories;

    const counts = await this.productModel.aggregate([
      { $match: { clubId, status: { $ne: 'hidden' } } },
      { $group: { _id: { $toString: '$categoryId' }, count: { $sum: 1 } } },
    ]);
    const countById = new Map<string, number>(
      counts.map((c) => [String(c._id), c.count]),
    );

    return categories.map((c) => ({
      ...c,
      productCount: countById.get(String(c._id)) ?? 0,
    }));
  }

  async create(clubId: string, dto: CreateProductCategoryDto) {
    const exists = await this.categoryModel.findOne({
      clubId,
      slug: dto.slug,
    });
    if (exists) {
      throw new ConflictException('Slug already exists in this residency');
    }
    return this.categoryModel.create({ ...dto, clubId });
  }

  async update(
    id: string,
    clubId: string,
    dto: UpdateProductCategoryDto,
  ) {
    const updated = await this.categoryModel.findOneAndUpdate(
      { _id: id, clubId },
      dto,
      { new: true },
    );
    if (!updated) throw new NotFoundException('Product category not found');
    return updated;
  }

  async remove(id: string, clubId: string) {
    const used = await this.productModel.countDocuments({
      categoryId: id,
      clubId,
    });
    if (used > 0) {
      throw new ConflictException(
        `Cannot delete: ${used} products still use this category`,
      );
    }
    const result = await this.categoryModel.deleteOne({
      _id: id,
      clubId,
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Product category not found');
    }
    return { success: true };
  }
}
