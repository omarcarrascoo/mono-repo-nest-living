import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createDto: any): Promise<User> {
    const newUser = new this.userModel(createDto);
    return newUser.save();
  }

  async findOne(email: string): Promise<User | undefined> {
    const user = await this.userModel.findOne({ email }).exec();
    return user ?? undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    const user = await this.userModel.findById(id).select('-password').exec();
    return user ?? undefined;
  }

  async findAdminsByResidency(residencyId: string): Promise<User[]> {
    return this.userModel
      .find({ residencyId, role: 'admin' })
      .select('_id email fullName')
      .lean()
      .exec() as unknown as User[];
  }

  async getFavoriteIds(userId: string): Promise<string[]> {
    const user = await this.userModel
      .findById(userId)
      .select('favoriteAmenityIds')
      .lean()
      .exec();
    return (user?.favoriteAmenityIds ?? []).map((id) => String(id));
  }

  async addFavorite(userId: string, amenityId: string) {
    const updated = await this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { favoriteAmenityIds: new Types.ObjectId(amenityId) } },
      { new: true },
    );
    if (!updated) throw new NotFoundException('User not found');
    return { favoriteAmenityIds: updated.favoriteAmenityIds.map(String) };
  }

  async removeFavorite(userId: string, amenityId: string) {
    const updated = await this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { favoriteAmenityIds: new Types.ObjectId(amenityId) } },
      { new: true },
    );
    if (!updated) throw new NotFoundException('User not found');
    return { favoriteAmenityIds: updated.favoriteAmenityIds.map(String) };
  }

  async updateNotificationPreferences(userId: string, prefs: Record<string, boolean>) {
    const $set: Record<string, boolean> = {};
    for (const k of Object.keys(prefs)) {
      $set[`notificationPreferences.${k}`] = prefs[k];
    }
    const updated = await this.userModel
      .findByIdAndUpdate(userId, { $set }, { new: true })
      .select('-password');
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }
}
