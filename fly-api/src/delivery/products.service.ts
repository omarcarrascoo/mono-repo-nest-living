import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

export interface ListProductsOptions {
  clubId: string;
  q?: string;
  categoryId?: string;
  status?: string;
  featured?: boolean;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async list(opts: ListProductsOptions) {
    const filter: Record<string, any> = { clubId: opts.clubId };

    // Default: hide products marked hidden unless explicitly requested.
    if (opts.status) {
      filter.status = opts.status;
    } else {
      filter.status = { $ne: 'hidden' };
    }

    if (opts.categoryId) {
      filter.categoryId = {
        $in: [new Types.ObjectId(opts.categoryId), opts.categoryId],
      };
    }

    if (typeof opts.featured === 'boolean') {
      filter.featured = opts.featured;
    }

    if (opts.q && opts.q.trim().length > 0) {
      filter.$text = { $search: opts.q.trim() };
      return this.productModel
        .find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .lean()
        .exec();
    }

    return this.productModel
      .find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .lean()
      .exec();
  }

  async findOne(id: string, clubId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Product not found');
    }
    const product = await this.productModel
      .findOne({ _id: id, clubId })
      .lean()
      .exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  /**
   * Looks up the loaded model docs (not lean) so the order service can read
   * authoritative price + option data.
   */
  async findManyByIds(ids: string[], clubId: string) {
    if (ids.length === 0) return [];
    const validIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    return this.productModel
      .find({ _id: { $in: validIds }, clubId })
      .lean()
      .exec();
  }

  async featuredOfDay(clubId: string) {
    // Strategy: prefer an explicitly-flagged `featured: true` available product.
    // Fall back to highest-rated available product.
    const flagged = await this.productModel
      .findOne({ clubId, featured: true, status: 'available' })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
    if (flagged) return flagged;

    return this.productModel
      .findOne({ clubId, status: 'available' })
      .sort({ rating: -1, reviewCount: -1 })
      .lean()
      .exec();
  }

  async create(clubId: string, dto: CreateProductDto) {
    return this.productModel.create({ ...dto, clubId });
  }

  async update(id: string, clubId: string, dto: UpdateProductDto) {
    const updated = await this.productModel.findOneAndUpdate(
      { _id: id, clubId },
      dto,
      { new: true },
    );
    if (!updated) {
      throw new ForbiddenException('Cannot edit product from another residency');
    }
    return updated;
  }

  async remove(id: string, clubId: string) {
    const result = await this.productModel.deleteOne({ _id: id, clubId });
    if (result.deletedCount === 0) {
      throw new ForbiddenException(
        'Cannot delete product from another residency',
      );
    }
    return { success: true };
  }
}
