import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ClubsService } from './clubs.service';
import {
  CreateClubDto,
  JoinClubDto,
  PromoteAdminDto,
  UpdateClubDto,
  UpdateMembershipDto,
} from './dto/clubs.dto';
import type { MembershipStatus } from './schemas/membership.schema';

@Controller('clubs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  // -------- Super admin --------

  @Post()
  @Roles('super_admin')
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateClubDto,
  ) {
    return this.clubsService.createClub(user.userId, dto);
  }

  @Get()
  @Roles('super_admin')
  async listAll() {
    return this.clubsService.listAllClubs();
  }

  @Patch(':clubId')
  @Roles('super_admin')
  async update(@Param('clubId') clubId: string, @Body() dto: UpdateClubDto) {
    return this.clubsService.updateClub(clubId, dto);
  }

  @Delete(':clubId')
  @Roles('super_admin')
  async remove(@Param('clubId') clubId: string) {
    return this.clubsService.deleteClub(clubId);
  }

  @Post(':clubId/admins')
  @Roles('super_admin')
  async promoteAdmin(
    @CurrentUser() user: CurrentUserPayload,
    @Param('clubId') clubId: string,
    @Body() dto: PromoteAdminDto,
  ) {
    return this.clubsService.promoteAdmin(clubId, dto, user.userId);
  }

  // -------- Cualquier user autenticado --------

  @Post('join')
  async join(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: JoinClubDto,
  ) {
    return this.clubsService.joinByCode(user.userId, dto);
  }

  @Get('me/memberships')
  async myMemberships(@CurrentUser() user: CurrentUserPayload) {
    return this.clubsService.listMyMemberships(user.userId);
  }

  @Delete('me/memberships/:clubId')
  async leave(
    @CurrentUser() user: CurrentUserPayload,
    @Param('clubId') clubId: string,
  ) {
    return this.clubsService.leaveClub(user.userId, clubId);
  }

  // -------- Admin del club --------

  @Get(':clubId/memberships')
  async listMembershipsAdmin(
    @CurrentUser() user: CurrentUserPayload,
    @Param('clubId') clubId: string,
    @Query('status') status?: MembershipStatus,
    @Query('q') q?: string,
  ) {
    await this.clubsService.assertActiveAdminOfClub(user.userId, clubId);
    return this.clubsService.listMembershipsForAdmin(clubId, { status, q });
  }

  @Post('memberships/:membershipId/approve')
  async approve(
    @CurrentUser() user: CurrentUserPayload,
    @Param('membershipId') membershipId: string,
  ) {
    return this.clubsService.approveMembership(membershipId, user.userId);
  }

  @Post('memberships/:membershipId/reject')
  async reject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('membershipId') membershipId: string,
  ) {
    return this.clubsService.rejectMembership(membershipId, user.userId);
  }

  @Patch('memberships/:membershipId')
  async updateMembership(
    @CurrentUser() user: CurrentUserPayload,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMembershipDto,
  ) {
    return this.clubsService.updateMembership(membershipId, user.userId, dto);
  }

  @Delete('memberships/:membershipId')
  async removeMembership(
    @CurrentUser() user: CurrentUserPayload,
    @Param('membershipId') membershipId: string,
  ) {
    return this.clubsService.removeMembership(membershipId, user.userId);
  }
}
