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
import { ProductCategoriesService } from './product-categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActiveClubGuard } from '../auth/guards/active-club.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from './dto/product-category.dto';

@Controller('delivery/categories')
@UseGuards(JwtAuthGuard, ActiveClubGuard, RolesGuard)
export class ProductCategoriesController {
  constructor(private readonly service: ProductCategoriesService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.service.listForClub(user.activeClubId!);
  }

  @Post()
  @Roles('admin')
  create(
    @Body() dto: CreateProductCategoryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.create(user.activeClubId!, dto);
  }

  @Put(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductCategoryDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.update(id, user.activeClubId!, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.remove(id, user.activeClubId!);
  }
}
