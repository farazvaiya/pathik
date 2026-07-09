import mongoose from 'mongoose';
import { FeedPost } from '../models/FeedPost';

describe('FeedPost Model', () => {
  it('should create a post with required fields', async () => {
    const post = new FeedPost({
      type: 'tip',
      message: 'Test post message',
    });

    const saved = await post.save();
    expect(saved._id).toBeDefined();
    expect(saved.type).toBe('tip');
    expect(saved.status).toBe('active');
    expect(saved.upvotes).toBe(0);
    expect(saved.downvotes).toBe(0);
    expect(saved.isAnonymous).toBe(true);
    expect(saved.aiIsEmergency).toBe(false);
  });

  it('should default isAnonymous to true', async () => {
    const post = new FeedPost({
      message: 'Anonymous post',
    });

    const saved = await post.save();
    expect(saved.isAnonymous).toBe(true);
  });

  it('should validate type enum', async () => {
    const post = new FeedPost({
      type: 'invalid',
      message: 'Invalid type',
    });

    await expect(post.save()).rejects.toThrow();
  });

  it('should validate status enum', async () => {
    const post = new FeedPost({
      message: 'Test',
      status: 'pending_review',
    });

    const saved = await post.save();
    expect(saved.status).toBe('pending_review');
  });

  it('should handle AI classification fields', async () => {
    const post = new FeedPost({
      message: 'AI classified post',
      aiCategory: 'robbery',
      aiSeverity: 'critical',
      aiIsEmergency: true,
      aiConfidence: 0.94,
    });

    const saved = await post.save();
    expect(saved.aiCategory).toBe('robbery');
    expect(saved.aiSeverity).toBe('critical');
    expect(saved.aiIsEmergency).toBe(true);
    expect(saved.aiConfidence).toBe(0.94);
  });

  it('should validate aiCategory enum', async () => {
    const post = new FeedPost({
      message: 'Invalid AI category',
      aiCategory: 'invalid_category',
    });

    await expect(post.save()).rejects.toThrow();
  });

  it('should validate aiSeverity enum', async () => {
    const post = new FeedPost({
      message: 'Invalid severity',
      aiSeverity: 'extreme',
    });

    await expect(post.save()).rejects.toThrow();
  });

  it('should track votedBy array', async () => {
    const post = new FeedPost({
      message: 'Vote test',
      votedBy: [
        { userId: new mongoose.Types.ObjectId(), value: 1 },
        { deviceId: 'device_123', value: -1 },
      ],
      upvotes: 1,
      downvotes: 1,
    });

    const saved = await post.save();
    expect(saved.votedBy.length).toBe(2);
    expect(saved.upvotes).toBe(1);
    expect(saved.downvotes).toBe(1);
  });

  it('should have 2dsphere index on location', () => {
    const indexes = FeedPost.schema.indexes();
    const hasGeoIndex = indexes.some(
      ([index]) => JSON.stringify(index).includes('2dsphere')
    );
    expect(hasGeoIndex).toBe(true);
  });

  it('should have text index on message', () => {
    const indexes = FeedPost.schema.indexes();
    const hasTextIndex = indexes.some(
      ([index]) => 'message' in index && index.message === 'text'
    );
    expect(hasTextIndex).toBe(true);
  });

  it('should link to alert', async () => {
    const alertId = new mongoose.Types.ObjectId();
    const post = new FeedPost({
      message: 'Alert-linked post',
      alertId,
    });

    const saved = await post.save();
    expect(saved.alertId?.toString()).toBe(alertId.toString());
  });

  it('should strip votedBy from JSON', async () => {
    const post = new FeedPost({
      message: 'JSON test',
      votedBy: [{ userId: new mongoose.Types.ObjectId(), value: 1 }],
    });

    const saved = await post.save();
    const json = saved.toJSON();
    expect(json.votedBy).toBeUndefined();
  });
});
