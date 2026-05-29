import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActiveClubGuard } from '../auth/guards/active-club.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard, ActiveClubGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.service.listForClub(user.activeClubId!, true);
  }

  @Post()
  @Roles('admin')
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.service.create(user.activeClubId!, dto);
  }

  @Put(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.service.update(id, user.activeClubId!, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.remove(id, user.activeClubId!);
  }
}
