import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActiveClubGuard } from '../auth/guards/active-club.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import {
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from './dto/product.dto';

@Controller('delivery/products')
@UseGuards(JwtAuthGuard, ActiveClubGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListProductsQueryDto,
  ) {
    return this.service.list({
      clubId: user.activeClubId!,
      q: query.q,
      categoryId: query.category,
      status: query.status,
      featured:
        query.featured === undefined ? undefined : query.featured === 'true',
    });
  }

  @Get('featured')
  featured(@CurrentUser() user: CurrentUserPayload) {
    return this.service.featuredOfDay(user.activeClubId!);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.findOne(id, user.activeClubId!);
  }

  @Post()
  @Roles('admin')
  create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.create(user.activeClubId!, dto);
  }

  @Put(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
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
