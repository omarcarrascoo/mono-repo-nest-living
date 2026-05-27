import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Amenity } from './schemas/amenity.schema';
import { UsersService } from '../users/users.service';

export interface ListAmenitiesOptions {
  q?: string;
  categoryId?: string;
  favoritesOnly?: boolean;
  userId: string;
  residencyId: string;
}

@Injectable()
export class AmenitiesService {
  constructor(
    @InjectModel(Amenity.name) private amenityModel: Model<Amenity>,
    private readonly usersService: UsersService,
  ) {}

  async create(data: any) {
    return new this.amenityModel(data).save();
  }

  async list(opts: ListAmenitiesOptions) {
    const filter: Record<string, any> = { residencyId: opts.residencyId };

    if (opts.categoryId) {
      // Datos legacy podían guardar categoryId como string; los nuevos como ObjectId.
      // Hacemos match contra ambos para no excluir documentos viejos.
      filter.categoryId = {
        $in: [new Types.ObjectId(opts.categoryId), opts.categoryId],
      };
    }

    if (opts.favoritesOnly) {
      const favIds = await this.usersService.getFavoriteIds(opts.userId);
      if (favIds.length === 0) return [];
      filter._id = { $in: favIds.map((id) => new Types.ObjectId(id)) };
    }

    if (opts.q && opts.q.trim().length > 0) {
      filter.$text = { $search: opts.q.trim() };
      return this.amenityModel
        .find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .lean()
        .exec();
    }

    return this.amenityModel
      .find(filter)
      .sort({ title: 1 })
      .lean()
      .exec();
  }

  async findOne(id: string, residencyId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Amenity not found');
    }
    const amenity = await this.amenityModel
      .findOne({ _id: id, residencyId })
      .exec();
    if (!amenity) throw new NotFoundException('Amenity not found');
    return amenity;
  }

  async update(id: string, residencyId: string, updateData: any) {
    const updated = await this.amenityModel.findOneAndUpdate(
      { _id: id, residencyId },
      updateData,
      { new: true },
    );
    if (!updated) {
      throw new ForbiddenException('Cannot edit amenity from another residency');
    }
    return updated;
  }

  async remove(id: string, residencyId: string) {
    const result = await this.amenityModel.deleteOne({ _id: id, residencyId });
    if (result.deletedCount === 0) {
      throw new ForbiddenException('Cannot delete amenity from another residency');
    }
    return { success: true };
  }

  async toggleFavorite(
    userId: string,
    amenityId: string,
    residencyId: string,
    favorite: boolean,
  ) {
    // Validamos que la amenidad exista en la residencia del usuario
    await this.findOne(amenityId, residencyId);
    return favorite
      ? this.usersService.addFavorite(userId, amenityId)
      : this.usersService.removeFavorite(userId, amenityId);
  }
}
