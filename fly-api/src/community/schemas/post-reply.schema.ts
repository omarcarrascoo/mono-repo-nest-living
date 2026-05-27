import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'communitypostreplies' })
export class CommunityPostReply extends Document {
  @Prop({ type: Types.ObjectId, ref: 'CommunityPost', required: true, index: true })
  postId: Types.ObjectId;

  @Prop({ required: true, index: true })
  residencyId: string;

  /**
   * Parent reply id when this is a nested reply. Null/undefined for
   * top-level replies on the post.
   */
  @Prop({ type: Types.ObjectId, ref: 'CommunityPostReply', default: null, index: true })
  parentReplyId: Types.ObjectId | null;

  /**
   * Depth in the reply tree: 0 = direct reply to post, 1 = reply-of-reply,
   * 2 = the deepest level we render. Anything beyond is rejected at write time.
   */
  @Prop({ required: true, default: 0 })
  depth: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ required: true })
  authorName: string;

  @Prop()
  authorAvatar?: string;

  @Prop({ required: true })
  authorRole: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Map, of: [Types.ObjectId], default: {} })
  reactions: Map<string, Types.ObjectId[]>;
}

export const CommunityPostReplySchema = SchemaFactory.createForClass(CommunityPostReply);

CommunityPostReplySchema.index({ postId: 1, createdAt: 1 });
CommunityPostReplySchema.index({ postId: 1, parentReplyId: 1, createdAt: 1 });
