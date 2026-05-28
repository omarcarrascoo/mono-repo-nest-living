import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async findStaffByResidency(residencyId: string): Promise<User[]> {
    return this.userModel
      .find({ residencyId, role: { $in: ['admin', 'kitchen_operator'] } })
      .select('_id email fullName role')
      .lean()
      .exec() as unknown as User[];
  }

  async findAllByResidency(residencyId: string): Promise<User[]> {
    return this.userModel
      .find({ residencyId })
      .select('_id email fullName role avatar')
      .lean()
      .exec() as unknown as User[];
  }

  async findByResidencyAndUnitPrefix(
    residencyId: string,
    unitPrefix: string,
  ): Promise<User[]> {
    const safe = unitPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.userModel
      .find({
        residencyId,
        unitNumber: { $regex: `^${safe}`, $options: 'i' },
      })
      .select('_id email fullName role avatar unitNumber')
      .lean()
      .exec() as unknown as User[];
  }

  async listForResidencyDirectory(
    residencyId: string,
    q?: string,
  ): Promise<User[]> {
    const filter: Record<string, any> = { residencyId };
    if (q && q.trim()) {
      const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { fullName: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
        { unitNumber: { $regex: safe, $options: 'i' } },
      ];
    }
    return this.userModel
      .find(filter)
      .select('_id email fullName role avatar unitNumber')
      .sort({ fullName: 1 })
      .limit(100)
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

  async updateAsAdmin(
    residencyId: string,
    targetUserId: string,
    dto: {
      fullName?: string;
      role?: 'admin' | 'user' | 'kitchen_operator';
      unitNumber?: string | null;
      avatar?: string | null;
      status?: string;
    },
  ): Promise<User> {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Invalid user id');
    }
    const user = await this.userModel.findOne({
      _id: targetUserId,
      residencyId,
    });
    if (!user) throw new NotFoundException('User not found');

    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.unitNumber !== undefined) user.unitNumber = dto.unitNumber ?? '';
    if (dto.avatar !== undefined) user.avatar = dto.avatar ?? '';
    if (dto.status !== undefined) user.status = dto.status;

    await user.save();
    const sanitized = user.toObject();
    delete (sanitized as any).password;
    return sanitized as User;
  }

  async removeAsAdmin(
    residencyId: string,
    actorUserId: string,
    targetUserId: string,
  ): Promise<{ ok: true }> {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Invalid user id');
    }
    if (String(actorUserId) === String(targetUserId)) {
      throw new ForbiddenException('Cannot delete yourself');
    }
    const user = await this.userModel.findOne({
      _id: targetUserId,
      residencyId,
    });
    if (!user) throw new NotFoundException('User not found');
    await user.deleteOne();
    return { ok: true };
  }
}
