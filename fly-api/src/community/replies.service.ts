import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CommunityPost } from './schemas/post.schema';
import { CommunityPostReply } from './schemas/post-reply.schema';
import { User } from '../users/schemas/user.schema';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import {
  CreateReplyDto,
  ListRepliesQueryDto,
  ToggleReactionDto,
} from './dto/post.dto';
import { NotificationsService } from '../notifications/notifications.service';

const MAX_DEPTH = 2; // 0,1,2 → 3 niveles totales

@Injectable()
export class RepliesService {
  private readonly logger = new Logger(RepliesService.name);

  constructor(
    @InjectModel(CommunityPost.name) private postModel: Model<CommunityPost>,
    @InjectModel(CommunityPostReply.name)
    private replyModel: Model<CommunityPostReply>,
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notifications: NotificationsService,
  ) {}

  async list(
    user: CurrentUserPayload,
    postId: string,
    query: ListRepliesQueryDto,
  ) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new NotFoundException('Post not found');
    }
    const post = await this.postModel
      .findOne({ _id: postId, residencyId: user.residencyId })
      .select('_id')
      .lean()
      .exec();
    if (!post) throw new NotFoundException('Post not found');

    const filter: Record<string, any> = { postId: post._id };
    if (query.parentReplyId !== undefined) {
      filter.parentReplyId = query.parentReplyId
        ? new Types.ObjectId(query.parentReplyId)
        : null;
    }

    return this.replyModel.find(filter).sort({ createdAt: 1 }).lean().exec();
  }

  async create(
    user: CurrentUserPayload,
    postId: string,
    dto: CreateReplyDto,
  ) {
    if (!Types.ObjectId.isValid(postId)) {
      throw new NotFoundException('Post not found');
    }
    const post = await this.postModel.findOne({
      _id: postId,
      residencyId: user.residencyId,
    });
    if (!post) throw new NotFoundException('Post not found');

    let depth = 0;
    let parentReply: CommunityPostReply | null = null;
    if (dto.parentReplyId) {
      if (!Types.ObjectId.isValid(dto.parentReplyId)) {
        throw new BadRequestException('Invalid parent reply id');
      }
      parentReply = await this.replyModel.findOne({
        _id: dto.parentReplyId,
        postId: post._id,
      });
      if (!parentReply) throw new NotFoundException('Parent reply not found');
      if (parentReply.depth >= MAX_DEPTH) {
        throw new BadRequestException('Reply depth limit reached');
      }
      depth = parentReply.depth + 1;
    }

    const author = await this.userModel
      .findById(user.userId)
      .select('fullName avatar role')
      .lean()
      .exec();
    if (!author) throw new NotFoundException('Author not found');

    const created = await this.replyModel.create({
      postId: post._id,
      residencyId: user.residencyId,
      parentReplyId: parentReply ? parentReply._id : null,
      depth,
      authorId: new Types.ObjectId(user.userId),
      authorName: author.fullName,
      authorAvatar: author.avatar,
      authorRole: author.role,
      content: dto.content,
      reactions: {},
    });

    post.repliesCount = (post.repliesCount ?? 0) + 1;
    await post.save();

    // Notify post author when someone else replies on their post.
    if (String(post.authorId) !== user.userId) {
      this.notifications
        .notifyUser(String(post.authorId), {
          kind: 'community_post_reply',
          title: `💬 ${author.fullName} respondió a tu publicación`,
          body: truncate(dto.content, 140),
          data: {
            postId: String(post._id),
            replyId: String(created._id),
          },
        })
        .catch((e) =>
          this.logger.error(`reply notify failed: ${e?.message}`),
        );
    }

    // Notify parent reply author when this is a nested reply (and not self).
    if (
      parentReply &&
      String(parentReply.authorId) !== user.userId &&
      String(parentReply.authorId) !== String(post.authorId)
    ) {
      this.notifications
        .notifyUser(String(parentReply.authorId), {
          kind: 'community_reply_reply',
          title: `💬 ${author.fullName} respondió tu comentario`,
          body: truncate(dto.content, 140),
          data: {
            postId: String(post._id),
            replyId: String(created._id),
            parentReplyId: String(parentReply._id),
          },
        })
        .catch((e) =>
          this.logger.error(`nested reply notify failed: ${e?.message}`),
        );
    }

    return created;
  }

  async remove(user: CurrentUserPayload, postId: string, replyId: string) {
    const reply = await this.replyModel.findOne({
      _id: replyId,
      postId: new Types.ObjectId(postId),
    });
    if (!reply) throw new NotFoundException('Reply not found');
    if (reply.residencyId !== user.residencyId) {
      throw new NotFoundException('Reply not found');
    }
    if (String(reply.authorId) !== user.userId && user.role !== 'admin') {
      throw new ForbiddenException('Cannot delete someone else\'s reply');
    }

    // Cascade: count this reply + all descendants and decrement post repliesCount.
    const descendants = await this.collectDescendants(reply._id as Types.ObjectId);
    const allIds = [reply._id, ...descendants];
    await this.replyModel.deleteMany({ _id: { $in: allIds } });

    const post = await this.postModel.findById(postId);
    if (post) {
      post.repliesCount = Math.max(
        0,
        (post.repliesCount ?? 0) - allIds.length,
      );
      await post.save();
    }

    return { ok: true, deleted: allIds.length };
  }

  async toggleReaction(
    user: CurrentUserPayload,
    postId: string,
    replyId: string,
    dto: ToggleReactionDto,
  ) {
    const reply = await this.replyModel.findOne({
      _id: replyId,
      postId: new Types.ObjectId(postId),
      residencyId: user.residencyId,
    });
    if (!reply) throw new NotFoundException('Reply not found');

    const reactions = reply.reactions ?? new Map();
    let alreadyOnTarget = false;
    for (const [emoji, userIds] of reactions.entries()) {
      const idx = userIds.findIndex((u) => String(u) === user.userId);
      if (idx >= 0) {
        if (emoji === dto.emoji) alreadyOnTarget = true;
        userIds.splice(idx, 1);
        if (userIds.length === 0) reactions.delete(emoji);
        else reactions.set(emoji, userIds);
      }
    }
    if (!alreadyOnTarget) {
      const arr = reactions.get(dto.emoji) ?? [];
      arr.push(new Types.ObjectId(user.userId));
      reactions.set(dto.emoji, arr);
    }
    reply.reactions = reactions;
    reply.markModified('reactions');
    await reply.save();
    return reply;
  }

  private async collectDescendants(
    rootId: Types.ObjectId,
  ): Promise<Types.ObjectId[]> {
    const all: Types.ObjectId[] = [];
    let frontier: Types.ObjectId[] = [rootId];
    while (frontier.length > 0) {
      const children = await this.replyModel
        .find({ parentReplyId: { $in: frontier } })
        .select('_id')
        .lean()
        .exec();
      const ids = children.map((c) => c._id as Types.ObjectId);
      if (ids.length === 0) break;
      all.push(...ids);
      frontier = ids;
    }
    return all;
  }
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trim() + '…';
}
