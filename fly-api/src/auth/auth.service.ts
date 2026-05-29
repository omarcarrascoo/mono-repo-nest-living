import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ClubsService } from '../clubs/clubs.service';

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  dateOfBirth?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private clubsService: ClubsService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findOne(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  /**
   * Genera un access_token resolviendo automáticamente un club activo si el
   * user pertenece a alguno. Si pasas `targetClubId`, valida que tenga
   * membership activa en ese club; si no, throw ForbiddenException.
   * Devuelve también el club/rol resueltos para que el FE no tenga que
   * decodificar el JWT.
   */
  async signTokenForUser(
    user: any,
    targetClubId?: string,
  ): Promise<{
    access_token: string;
    activeClubId: string | null;
    activeMembershipRole: 'admin' | 'user' | 'kitchen_operator' | null;
  }> {
    const userId = String(user._id ?? user.id);
    let activeClubId: string | null = null;
    let activeMembershipRole: 'admin' | 'user' | 'kitchen_operator' | null = null;

    if (targetClubId) {
      const m = await this.clubsService.findActiveMembership(userId, targetClubId);
      if (!m) {
        throw new ForbiddenException(
          'No tienes membresía activa en ese club',
        );
      }
      activeClubId = String(m.clubId);
      activeMembershipRole = m.role;
    } else {
      const m = await this.clubsService.findFirstActiveMembership(userId);
      if (m) {
        activeClubId = String(m.clubId);
        activeMembershipRole = m.role;
      }
    }

    const access_token = this.jwtService.sign({
      sub: userId,
      email: user.email,
      globalRole: user.globalRole ?? null,
      activeClubId,
      activeMembershipRole,
    });

    return { access_token, activeClubId, activeMembershipRole };
  }

  async login(user: any) {
    return this.signTokenForUser(user);
  }

  async switchClub(userId: string, clubId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.signTokenForUser(user, clubId);
  }

  async register(dto: RegisterDto) {
    if (!dto.email || !dto.password || !dto.fullName) {
      throw new ConflictException(
        'email, password y fullName son requeridos',
      );
    }
    const exists = await this.usersService.findOne(dto.email);
    if (exists) throw new ConflictException('Ese correo ya está registrado');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
      dateOfBirth: dto.dateOfBirth,
      // role / globalRole / membership / club nunca vienen del cliente.
      globalRole: null,
    });

    const tokenRes = await this.signTokenForUser(user);
    const sanitized = (user as any).toObject ? (user as any).toObject() : user;
    delete sanitized.password;
    return { user: sanitized, ...tokenRes };
  }
}
