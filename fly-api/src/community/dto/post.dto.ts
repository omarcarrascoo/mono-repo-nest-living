import {
  IsBoolean,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { REACTION_EMOJIS } from '../schemas/post.schema';

export class CreatePostDto {
  @IsOptional()
  @IsIn(['announcement', 'post'])
  type?: 'announcement' | 'post';

  @IsOptional() @IsString() @Length(0, 60) tag?: string;

  @IsString() @Length(1, 140) title: string;

  @IsString() @Length(1, 4000) content: string;

  @IsOptional() @IsString() @Length(0, 600) image?: string;

  @IsOptional() @IsBoolean() pinned?: boolean;
}

export class UpdatePostDto {
  @IsOptional() @IsString() @Length(0, 60) tag?: string;

  @IsOptional() @IsString() @Length(1, 140) title?: string;

  @IsOptional() @IsString() @Length(1, 4000) content?: string;

  @IsOptional() @IsString() @Length(0, 600) image?: string;

  @IsOptional() @IsBoolean() pinned?: boolean;
}

export class ListPostsQueryDto {
  @IsOptional() @IsIn(['all', 'announcement', 'post']) type?: string;

  @IsOptional() @IsString() @Length(0, 80) q?: string;
}

export class ToggleReactionDto {
  @IsIn(REACTION_EMOJIS as unknown as string[])
  emoji: string;
}

export class CreateReplyDto {
  @IsOptional() @IsMongoId() parentReplyId?: string;

  @IsString() @Length(1, 2000) content: string;
}

export class ListRepliesQueryDto {
  @IsOptional() @IsMongoId() parentReplyId?: string;
}
