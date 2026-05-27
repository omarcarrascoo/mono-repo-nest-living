import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunityPost, CommunityPostSchema } from './schemas/post.schema';
import {
  CommunityPostReply,
  CommunityPostReplySchema,
} from './schemas/post-reply.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PostsService } from './posts.service';
import { RepliesService } from './replies.service';
import { PostsController } from './posts.controller';
import { RepliesController } from './replies.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CommunityPost.name, schema: CommunityPostSchema },
      { name: CommunityPostReply.name, schema: CommunityPostReplySchema },
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => NotificationsModule),
  ],
  controllers: [PostsController, RepliesController],
  providers: [PostsService, RepliesService],
  exports: [PostsService, RepliesService],
})
export class CommunityModule {}
