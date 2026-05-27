import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RepliesService } from './replies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import {
  CreateReplyDto,
  ListRepliesQueryDto,
  ToggleReactionDto,
} from './dto/post.dto';

@Controller('community/posts/:postId/replies')
@UseGuards(JwtAuthGuard)
export class RepliesController {
  constructor(private readonly service: RepliesService) {}

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Param('postId') postId: string,
    @Query() query: ListRepliesQueryDto,
  ) {
    return this.service.list(user, postId, query);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('postId') postId: string,
    @Body() dto: CreateReplyDto,
  ) {
    return this.service.create(user, postId, dto);
  }

  @Delete(':replyId')
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('postId') postId: string,
    @Param('replyId') replyId: string,
  ) {
    return this.service.remove(user, postId, replyId);
  }

  @Post(':replyId/reactions')
  toggleReaction(
    @CurrentUser() user: CurrentUserPayload,
    @Param('postId') postId: string,
    @Param('replyId') replyId: string,
    @Body() dto: ToggleReactionDto,
  ) {
    return this.service.toggleReaction(user, postId, replyId, dto);
  }
}
