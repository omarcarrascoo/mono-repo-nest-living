import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schemas/user.schema';
import { Membership } from '../clubs/schemas/membership.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Membership.name) private membershipModel: Model<Membership>,
  ) {}

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

  async isUserActiveInClub(userId: string, clubId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(clubId)) {
      return false;
    }
    const m = await this.membershipModel
      .findOne({
        userId: new Types.ObjectId(userId),
        clubId: new Types.ObjectId(clubId),
        status: 'active',
      })
      .select('_id')
      .lean()
      .exec();
    return !!m;
  }

  // ---- Reads scoped to a club via Membership ----

  /**
   * Lista admins activos del club. Usado por notificaciones internas.
   */
  async findAdminsByClub(clubId: string): Promise<User[]> {
    const memberships = await this.membershipModel
      .find({
        clubId: new Types.ObjectId(clubId),
        role: 'admin',
        status: 'active',
      })
      .select('userId')
      .lean()
      .exec();
    if (memberships.length === 0) return [];
    const ids = memberships.map((m) => m.userId);
    return this.userModel
      .find({ _id: { $in: ids } })
      .select('_id email fullName')
      .lean()
      .exec() as unknown as User[];
  }

  async findStaffByClub(clubId: string): Promise<User[]> {
    const memberships = await this.membershipModel
      .find({
        clubId: new Types.ObjectId(clubId),
        role: { $in: ['admin', 'kitchen_operator'] },
        status: 'active',
      })
      .select('userId role')
      .lean()
      .exec();
    if (memberships.length === 0) return [];
    const ids = memberships.map((m) => m.userId);
    const users = (await this.userModel
      .find({ _id: { $in: ids } })
      .select('_id email fullName')
      .lean()
      .exec()) as any[];
    const roleByUser = new Map(
      memberships.map((m) => [String(m.userId), m.role]),
    );
    return users.map((u) => ({
      ...u,
      role: roleByUser.get(String(u._id)) ?? 'user',
    })) as unknown as User[];
  }

  async findAllByClub(clubId: string): Promise<User[]> {
    const memberships = await this.membershipModel
      .find({ clubId: new Types.ObjectId(clubId), status: 'active' })
      .select('userId')
      .lean()
      .exec();
    if (memberships.length === 0) return [];
    return this.userModel
      .find({ _id: { $in: memberships.map((m) => m.userId) } })
      .select('_id email fullName avatar')
      .lean()
      .exec() as unknown as User[];
  }

  async findByClubAndUnitPrefix(
    clubId: string,
    unitPrefix: string,
  ): Promise<User[]> {
    const safe = unitPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const memberships = await this.membershipModel
      .find({
        clubId: new Types.ObjectId(clubId),
        status: 'active',
        unitNumber: { $regex: `^${safe}`, $options: 'i' },
      })
      .select('userId unitNumber')
      .lean()
      .exec();
    if (memberships.length === 0) return [];
    const users = (await this.userModel
      .find({ _id: { $in: memberships.map((m) => m.userId) } })
      .select('_id email fullName avatar')
      .lean()
      .exec()) as any[];
    const unitByUser = new Map(
      memberships.map((m) => [String(m.userId), m.unitNumber]),
    );
    return users.map((u) => ({
      ...u,
      unitNumber: unitByUser.get(String(u._id)) ?? '',
    })) as unknown as User[];
  }

  /**
   * Directorio del club activo: lista todos los miembros activos enriquecidos
   * con su rol y unidad dentro del club.
   */
  async listForClubDirectory(clubId: string, q?: string) {
    const memberships = await this.membershipModel
      .find({ clubId: new Types.ObjectId(clubId), status: 'active' })
      .populate('userId', '_id email fullName avatar')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
      .exec();

    let mapped = memberships
      .map((m: any) => {
        if (!m.userId) return null;
        return {
          membershipId: String(m._id),
          id: String(m.userId._id ?? m.userId),
          email: m.userId.email,
          fullName: m.userId.fullName,
          avatar: m.userId.avatar ?? null,
          role: m.role,
          unitNumber: m.unitNumber ?? null,
          status: m.status,
        };
      })
      .filter(Boolean) as Array<any>;

    if (q && q.trim()) {
      const safe = q.trim().toLowerCase();
      mapped = mapped.filter((u) =>
        [u.fullName, u.email, u.unitNumber]
          .filter(Boolean)
          .some((s: string) => String(s).toLowerCase().includes(safe)),
      );
    }
    mapped.sort((a, b) => String(a.fullName).localeCompare(String(b.fullName)));
    return mapped;
  }

  // ---- Per-user CRUD ----

  async getFavoriteIds(userId: string): Promise<string[]> {
    const user = await this.userModel
      .findById(userId)
      .select('favoriteAmenityIds')
      .lean()
      .exec();
    return ((user as any)?.favoriteAmenityIds ?? []).map((id: any) => String(id));
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

  async updateNotificationPreferences(
    userId: string,
    prefs: Record<string, boolean>,
  ) {
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

  async updateOwnProfile(
    userId: string,
    dto: {
      fullName?: string;
      avatar?: string | null;
      dateOfBirth?: string | null;
    },
  ): Promise<User> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user id');
    }
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.avatar !== undefined) user.avatar = dto.avatar ?? '';
    if (dto.dateOfBirth !== undefined) user.dateOfBirth = dto.dateOfBirth ?? '';
    await user.save();
    const sanitized = user.toObject();
    delete (sanitized as any).password;
    return sanitized as User;
  }
}
