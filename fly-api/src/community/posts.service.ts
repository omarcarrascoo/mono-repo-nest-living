import {
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
  CreatePostDto,
  ListPostsQueryDto,
  ToggleReactionDto,
  UpdatePostDto,
} from './dto/post.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectModel(CommunityPost.name) private postModel: Model<CommunityPost>,
    @InjectModel(CommunityPostReply.name)
    private replyModel: Model<CommunityPostReply>,
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notifications: NotificationsService,
  ) {}

  async create(user: CurrentUserPayload, dto: CreatePostDto) {
    const type = dto.type ?? 'post';
    if (type === 'announcement' && user.activeMembershipRole !== 'admin') {
      throw new ForbiddenException('Only admins can publish announcements');
    }
    if (dto.pinned && user.activeMembershipRole !== 'admin') {
      throw new ForbiddenException('Only admins can pin posts');
    }

    const author = await this.userModel
      .findById(user.userId)
      .select('fullName avatar')
      .lean()
      .exec();
    if (!author) throw new NotFoundException('Author not found');

    const created = await this.postModel.create({
      clubId: user.activeClubId!,
      type,
      authorId: new Types.ObjectId(user.userId),
      authorName: author.fullName,
      authorAvatar: author.avatar,
      authorRole: user.activeMembershipRole ?? 'user',
      tag: dto.tag,
      title: dto.title,
      content: dto.content,
      image: dto.image,
      pinned: type === 'announcement' ? dto.pinned ?? true : !!dto.pinned,
      reactions: {},
      repliesCount: 0,
    });

    if (type === 'announcement') {
      this.notifications
        .notifyClub(
          user.activeClubId!,
          {
            kind: 'community_announcement',
            title: `📣 ${author.fullName}: ${dto.title}`,
            body: truncate(dto.content, 140),
            data: { postId: String(created._id), type: 'announcement' },
          },
          { excludeUserId: user.userId },
        )
        .catch((e) =>
          this.logger.error(`announcement broadcast failed: ${e?.message}`),
        );
    }

    return created;
  }

  async list(user: CurrentUserPayload, query: ListPostsQueryDto) {
    const filter: Record<string, any> = { clubId: user.activeClubId };
    if (query.type && query.type !== 'all') filter.type = query.type;
    if (query.q && query.q.trim()) {
      const re = new RegExp(escapeRegex(query.q.trim()), 'i');
      filter.$or = [{ title: re }, { content: re }, { tag: re }];
    }
    return this.postModel
      .find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .limit(200)
      .lean()
      .exec();
  }

  async findOne(user: CurrentUserPayload, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Post not found');
    }
    const post = await this.postModel
      .findOne({ _id: id, clubId: user.activeClubId })
      .lean()
      .exec();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(user: CurrentUserPayload, id: string, dto: UpdatePostDto) {
    const post = await this.postModel.findOne({
      _id: id,
      clubId: user.activeClubId,
    });
    if (!post) throw new NotFoundException('Post not found');

    const isOwner = String(post.authorId) === user.userId;
    if (!isOwner && user.activeMembershipRole !== 'admin') {
      throw new ForbiddenException('Cannot edit someone else\'s post');
    }
    if (dto.pinned !== undefined && user.activeMembershipRole !== 'admin') {
      throw new ForbiddenException('Only admins can pin posts');
    }

    if (dto.title !== undefined) post.title = dto.title;
    if (dto.content !== undefined) post.content = dto.content;
    if (dto.tag !== undefined) post.tag = dto.tag;
    if (dto.image !== undefined) post.image = dto.image;
    if (dto.pinned !== undefined) post.pinned = dto.pinned;
    await post.save();
    return post;
  }

  async remove(user: CurrentUserPayload, id: string) {
    const post = await this.postModel.findOne({
      _id: id,
      clubId: user.activeClubId,
    });
    if (!post) throw new NotFoundException('Post not found');

    const isOwner = String(post.authorId) === user.userId;
    if (!isOwner && user.activeMembershipRole !== 'admin') {
      throw new ForbiddenException('Cannot delete someone else\'s post');
    }

    await this.replyModel.deleteMany({ postId: post._id });
    await post.deleteOne();
    return { ok: true };
  }

  async toggleReaction(
    user: CurrentUserPayload,
    id: string,
    dto: ToggleReactionDto,
  ) {
    const post = await this.postModel.findOne({
      _id: id,
      clubId: user.activeClubId,
    });
    if (!post) throw new NotFoundException('Post not found');

    const userObjectId = new Types.ObjectId(user.userId);
    const reactions = post.reactions ?? new Map();

    let alreadyOnTarget = false;
    for (const [emoji, userIds] of reactions.entries()) {
      const idx = userIds.findIndex((u) => String(u) === user.userId);
      if (idx >= 0) {
        if (emoji === dto.emoji) {
          alreadyOnTarget = true;
        }
        userIds.splice(idx, 1);
        if (userIds.length === 0) {
          reactions.delete(emoji);
        } else {
          reactions.set(emoji, userIds);
        }
      }
    }

    if (!alreadyOnTarget) {
      const arr = reactions.get(dto.emoji) ?? [];
      arr.push(userObjectId);
      reactions.set(dto.emoji, arr);
    }

    post.reactions = reactions;
    post.markModified('reactions');
    await post.save();
    return post;
  }
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trim() + '…';
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
