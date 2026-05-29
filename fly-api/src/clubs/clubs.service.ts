import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Club } from './schemas/club.schema';
import {
  Membership,
  MembershipRole,
  MembershipStatus,
} from './schemas/membership.schema';
import { User } from '../users/schemas/user.schema';
import {
  CreateClubDto,
  JoinClubDto,
  PromoteAdminDto,
  UpdateClubDto,
  UpdateMembershipDto,
} from './dto/clubs.dto';

function randomCode(len = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

@Injectable()
export class ClubsService {
  constructor(
    @InjectModel(Club.name) private clubModel: Model<Club>,
    @InjectModel(Membership.name) private membershipModel: Model<Membership>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  // ------------------------------------------------------------------
  // Super admin
  // ------------------------------------------------------------------

  async createClub(superAdminId: string, dto: CreateClubDto): Promise<Club> {
    let joinCode = dto.joinCode?.toUpperCase();
    if (joinCode) {
      const exists = await this.clubModel.findOne({ joinCode }).lean();
      if (exists) throw new ConflictException('joinCode ya está en uso');
    } else {
      // generate unique code
      for (let i = 0; i < 5; i++) {
        const candidate = randomCode(8);
        const exists = await this.clubModel.findOne({ joinCode: candidate }).lean();
        if (!exists) {
          joinCode = candidate;
          break;
        }
      }
      if (!joinCode) {
        throw new ConflictException('No pudimos generar un joinCode único');
      }
    }

    const club = await this.clubModel.create({
      name: dto.name,
      description: dto.description,
      joinCode,
      privacy: dto.privacy ?? 'public',
      createdBySuperAdminId: new Types.ObjectId(superAdminId),
    });
    return club;
  }

  async listAllClubs(): Promise<Club[]> {
    return this.clubModel.find().sort({ createdAt: -1 }).lean().exec() as any;
  }

  async updateClub(clubId: string, dto: UpdateClubDto): Promise<Club> {
    if (!Types.ObjectId.isValid(clubId)) {
      throw new BadRequestException('Invalid clubId');
    }
    const club = await this.clubModel.findById(clubId);
    if (!club) throw new NotFoundException('Club no encontrado');

    if (dto.joinCode) {
      const code = dto.joinCode.toUpperCase();
      if (code !== club.joinCode) {
        const taken = await this.clubModel
          .findOne({ joinCode: code, _id: { $ne: club._id } })
          .lean();
        if (taken) throw new ConflictException('joinCode ya está en uso');
        club.joinCode = code;
      }
    }
    if (dto.name !== undefined) club.name = dto.name;
    if (dto.description !== undefined) club.description = dto.description ?? '';
    if (dto.privacy !== undefined) club.privacy = dto.privacy;
    if (dto.status !== undefined) club.status = dto.status;
    await club.save();
    return club;
  }

  async deleteClub(clubId: string): Promise<{ ok: true }> {
    if (!Types.ObjectId.isValid(clubId)) {
      throw new BadRequestException('Invalid clubId');
    }
    const removed = await this.clubModel.findByIdAndDelete(clubId);
    if (!removed) throw new NotFoundException('Club no encontrado');
    await this.membershipModel.deleteMany({ clubId: removed._id });
    return { ok: true };
  }

  /**
   * Super admin marca a un usuario existente como admin del club. Si ya tiene
   * membership, se le sube el rol y se le activa; si no, se le crea una
   * membership ya activa.
   */
  async promoteAdmin(
    clubId: string,
    dto: PromoteAdminDto,
    actorSuperAdminId: string,
  ): Promise<Membership> {
    if (!Types.ObjectId.isValid(clubId) || !Types.ObjectId.isValid(dto.userId)) {
      throw new BadRequestException('clubId/userId inválido');
    }
    const club = await this.clubModel.findById(clubId).lean();
    if (!club) throw new NotFoundException('Club no encontrado');

    const user = await this.userModel.findById(dto.userId).lean();
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const role: MembershipRole = dto.role ?? 'admin';
    const existing = await this.membershipModel.findOne({
      userId: user._id,
      clubId: club._id,
    });

    if (existing) {
      existing.role = role;
      existing.status = 'active';
      existing.approvedAt = new Date();
      existing.approvedById = new Types.ObjectId(actorSuperAdminId);
      await existing.save();
      return existing;
    }

    return this.membershipModel.create({
      userId: user._id,
      clubId: club._id,
      role,
      status: 'active',
      approvedAt: new Date(),
      approvedById: new Types.ObjectId(actorSuperAdminId),
    });
  }

  // ------------------------------------------------------------------
  // Cualquier user
  // ------------------------------------------------------------------

  async listMyMemberships(userId: string) {
    const memberships = await this.membershipModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('clubId', 'name description privacy status')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return memberships.map((m: any) => ({
      id: String(m._id),
      clubId: String(m.clubId?._id ?? m.clubId),
      club: m.clubId
        ? {
            id: String(m.clubId._id ?? m.clubId),
            name: m.clubId.name,
            description: m.clubId.description ?? null,
            privacy: m.clubId.privacy,
            status: m.clubId.status,
          }
        : null,
      role: m.role,
      status: m.status,
      unitNumber: m.unitNumber ?? null,
      createdAt: m.createdAt,
      approvedAt: m.approvedAt ?? null,
    }));
  }

  /**
   * Solicitud de unirse. Si el club es 'public' devuelve membership active;
   * si es 'private' queda pending hasta que un admin lo apruebe.
   */
  async joinByCode(userId: string, dto: JoinClubDto): Promise<Membership> {
    const code = dto.joinCode.toUpperCase();
    const club = await this.clubModel.findOne({ joinCode: code });
    if (!club) throw new NotFoundException('Código de club inválido');

    const userObjectId = new Types.ObjectId(userId);
    const existing = await this.membershipModel.findOne({
      userId: userObjectId,
      clubId: club._id,
    });
    if (existing) {
      if (existing.status === 'rejected') {
        // Permite reintentar si fue rechazado antes
        existing.status = club.privacy === 'public' ? 'active' : 'pending';
        existing.approvedAt = club.privacy === 'public' ? new Date() : undefined;
        await existing.save();
        return existing;
      }
      throw new ConflictException(
        existing.status === 'active'
          ? 'Ya eres miembro de este club'
          : 'Ya tienes una solicitud pendiente',
      );
    }

    return this.membershipModel.create({
      userId: userObjectId,
      clubId: club._id,
      role: 'user',
      status: club.privacy === 'public' ? 'active' : 'pending',
      approvedAt: club.privacy === 'public' ? new Date() : undefined,
    });
  }

  async leaveClub(userId: string, clubId: string): Promise<{ ok: true }> {
    if (!Types.ObjectId.isValid(clubId)) {
      throw new BadRequestException('clubId inválido');
    }
    const m = await this.membershipModel.findOne({
      userId: new Types.ObjectId(userId),
      clubId: new Types.ObjectId(clubId),
    });
    if (!m) throw new NotFoundException('No tienes membresía en este club');
    if (m.role === 'admin') {
      const otherAdmins = await this.membershipModel.countDocuments({
        clubId: m.clubId,
        role: 'admin',
        status: 'active',
        _id: { $ne: m._id },
      });
      if (otherAdmins === 0) {
        throw new ForbiddenException(
          'Eres el único admin activo, no puedes salir hasta que haya otro',
        );
      }
    }
    await m.deleteOne();
    return { ok: true };
  }

  // ------------------------------------------------------------------
  // Admin del club
  // ------------------------------------------------------------------

  async assertActiveAdminOfClub(userId: string, clubId: string): Promise<void> {
    if (!Types.ObjectId.isValid(clubId)) {
      throw new BadRequestException('clubId inválido');
    }
    const m = await this.membershipModel
      .findOne({
        userId: new Types.ObjectId(userId),
        clubId: new Types.ObjectId(clubId),
        role: 'admin',
        status: 'active',
      })
      .lean();
    if (!m) throw new ForbiddenException('No eres admin de este club');
  }

  async assertActiveMemberOfClub(userId: string, clubId: string): Promise<MembershipRole> {
    if (!Types.ObjectId.isValid(clubId)) {
      throw new BadRequestException('clubId inválido');
    }
    const m = await this.membershipModel
      .findOne({
        userId: new Types.ObjectId(userId),
        clubId: new Types.ObjectId(clubId),
        status: 'active',
      })
      .lean();
    if (!m) throw new ForbiddenException('No eres miembro activo de este club');
    return m.role;
  }

  async listMembershipsForAdmin(
    clubId: string,
    opts: { status?: MembershipStatus; q?: string } = {},
  ) {
    const filter: Record<string, any> = { clubId: new Types.ObjectId(clubId) };
    if (opts.status) filter.status = opts.status;

    const memberships = await this.membershipModel
      .find(filter)
      .populate('userId', 'fullName email avatar dateOfBirth status')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
      .exec();

    let mapped = memberships.map((m: any) => ({
      id: String(m._id),
      role: m.role,
      status: m.status,
      unitNumber: m.unitNumber ?? null,
      createdAt: m.createdAt,
      approvedAt: m.approvedAt ?? null,
      user: m.userId
        ? {
            id: String(m.userId._id ?? m.userId),
            fullName: m.userId.fullName,
            email: m.userId.email,
            avatar: m.userId.avatar ?? null,
            dateOfBirth: m.userId.dateOfBirth ?? null,
            status: m.userId.status,
          }
        : null,
    }));

    if (opts.q && opts.q.trim()) {
      const needle = opts.q.trim().toLowerCase();
      mapped = mapped.filter((m) =>
        [m.user?.fullName, m.user?.email, m.unitNumber]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(needle)),
      );
    }
    return mapped;
  }

  async approveMembership(
    membershipId: string,
    actingAdminId: string,
  ): Promise<Membership> {
    if (!Types.ObjectId.isValid(membershipId)) {
      throw new BadRequestException('membershipId inválido');
    }
    const m = await this.membershipModel.findById(membershipId);
    if (!m) throw new NotFoundException('Membresía no encontrada');
    await this.assertActiveAdminOfClub(actingAdminId, String(m.clubId));

    if (m.status === 'active') return m;
    m.status = 'active';
    m.approvedAt = new Date();
    m.approvedById = new Types.ObjectId(actingAdminId);
    await m.save();
    return m;
  }

  async rejectMembership(
    membershipId: string,
    actingAdminId: string,
  ): Promise<Membership> {
    if (!Types.ObjectId.isValid(membershipId)) {
      throw new BadRequestException('membershipId inválido');
    }
    const m = await this.membershipModel.findById(membershipId);
    if (!m) throw new NotFoundException('Membresía no encontrada');
    await this.assertActiveAdminOfClub(actingAdminId, String(m.clubId));

    m.status = 'rejected';
    m.approvedAt = undefined;
    m.approvedById = undefined;
    await m.save();
    return m;
  }

  async updateMembership(
    membershipId: string,
    actingAdminId: string,
    dto: UpdateMembershipDto,
  ): Promise<Membership> {
    if (!Types.ObjectId.isValid(membershipId)) {
      throw new BadRequestException('membershipId inválido');
    }
    const m = await this.membershipModel.findById(membershipId);
    if (!m) throw new NotFoundException('Membresía no encontrada');
    await this.assertActiveAdminOfClub(actingAdminId, String(m.clubId));

    if (dto.role !== undefined) m.role = dto.role;
    if (dto.unitNumber !== undefined) m.unitNumber = dto.unitNumber ?? '';
    await m.save();
    return m;
  }

  async removeMembership(
    membershipId: string,
    actingAdminId: string,
  ): Promise<{ ok: true }> {
    if (!Types.ObjectId.isValid(membershipId)) {
      throw new BadRequestException('membershipId inválido');
    }
    const m = await this.membershipModel.findById(membershipId);
    if (!m) throw new NotFoundException('Membresía no encontrada');
    await this.assertActiveAdminOfClub(actingAdminId, String(m.clubId));

    if (String(m.userId) === String(actingAdminId)) {
      throw new ForbiddenException('No puedes eliminarte a ti mismo');
    }
    await m.deleteOne();
    return { ok: true };
  }

  // ------------------------------------------------------------------
  // Helpers usados por auth (switch club / login)
  // ------------------------------------------------------------------

  async findActiveMembership(userId: string, clubId: string) {
    return this.membershipModel
      .findOne({
        userId: new Types.ObjectId(userId),
        clubId: new Types.ObjectId(clubId),
        status: 'active',
      })
      .lean();
  }

  async findFirstActiveMembership(userId: string) {
    return this.membershipModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: 'active',
      })
      .sort({ createdAt: -1 })
      .lean();
  }
}
