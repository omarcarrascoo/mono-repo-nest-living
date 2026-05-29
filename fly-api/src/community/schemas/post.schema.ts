import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommunityPostType = 'announcement' | 'post';

export const REACTION_EMOJIS = ['❤️', '👍', '😊', '🎉', '😢', '🚀'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

@Schema({ timestamps: true, collection: 'communityposts' })
export class CommunityPost extends Document {
  @Prop({ required: true, index: true })
  clubId: string;

  @Prop({
    required: true,
    enum: ['announcement', 'post'],
    default: 'post',
    index: true,
  })
  type: CommunityPostType;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ required: true })
  authorName: string;

  @Prop()
  authorAvatar?: string;

  @Prop({ required: true })
  authorRole: string;

  @Prop()
  tag?: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  image?: string;

  @Prop({ default: false, index: true })
  pinned: boolean;

  /**
   * Reactions are stored as a Map<emoji, userId[]>. Each user can only have
   * one reaction per post — toggling sets/replaces it. Counts are derived.
   */
  @Prop({ type: Map, of: [Types.ObjectId], default: {} })
  reactions: Map<string, Types.ObjectId[]>;

  @Prop({ default: 0 })
  repliesCount: number;
}

export const CommunityPostSchema = SchemaFactory.createForClass(CommunityPost);

CommunityPostSchema.index({ clubId: 1, pinned: -1, createdAt: -1 });
CommunityPostSchema.index({ clubId: 1, type: 1, createdAt: -1 });
