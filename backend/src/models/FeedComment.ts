import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeedComment extends Document {
  _id: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId | null;
  authorId: mongoose.Types.ObjectId | null;
  displayName: string | null;
  deviceId: string | null;
  message: string;
  media: string | null;
  mediaType: 'image' | 'video' | null;
  status: 'active' | 'deleted';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeedCommentSchema = new Schema<IFeedComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: 'FeedPost', required: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'FeedComment', default: null, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    displayName: { type: String, default: null, maxlength: 80 },
    deviceId: { type: String, default: null, index: true },
    message: { type: String, required: true, trim: true, maxlength: 600 },
    media: { type: String, default: null, maxlength: 500 },
    mediaType: { type: String, enum: ['image', 'video', null], default: null },
    status: { type: String, enum: ['active', 'deleted'], default: 'active', index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

FeedCommentSchema.index({ postId: 1, status: 1, createdAt: 1 });
FeedCommentSchema.index({ parentId: 1, createdAt: 1 });

FeedCommentSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export const FeedComment: Model<IFeedComment> =
  mongoose.models.FeedComment || mongoose.model<IFeedComment>('FeedComment', FeedCommentSchema);
