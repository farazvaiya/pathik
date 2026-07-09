import mongoose from 'mongoose';
import { Notification } from '../models/Notification';

describe('Notification Model', () => {
  it('should create a notification with required fields', async () => {
    const notif = new Notification({
      userId: new mongoose.Types.ObjectId(),
      type: 'sos_alert',
      title: 'জরুরি অ্যালার্ট!',
      body: 'মিরপুরে ছিনতাই',
    });

    const saved = await notif.save();
    expect(saved._id).toBeDefined();
    expect(saved.isRead).toBe(false);
    expect(saved.sentVia).toEqual([]);
  });

  it('should validate type enum', async () => {
    const notif = new Notification({
      userId: new mongoose.Types.ObjectId(),
      type: 'invalid_type',
      title: 'Test',
    });

    await expect(notif.save()).rejects.toThrow();
  });

  it('should allow all valid notification types', async () => {
    const types = [
      'sos_alert', 'missing_person', 'stolen_vehicle', 'official_alert',
      'sighting_nearby', 'flag_warning', 'alert_resolved', 'sighting_confirmed',
    ];

    for (const type of types) {
      const notif = new Notification({
        userId: new mongoose.Types.ObjectId(),
        type,
        title: `Test ${type}`,
      });
      const saved = await notif.save();
      expect(saved.type).toBe(type);
    }
  });

  it('should have TTL index on createdAt', () => {
    const indexes = Notification.schema.indexes();
    const hasTTLIndex = indexes.some(
      ([index]) => 'createdAt' in index
    );
    expect(hasTTLIndex).toBe(true);
  });

  it('should have user + isRead + createdAt compound index', () => {
    const indexes = Notification.schema.indexes();
    const hasCompoundIndex = indexes.some(
      ([index]) => 'userId' in index && 'isRead' in index && 'createdAt' in index
    );
    expect(hasCompoundIndex).toBe(true);
  });

  it('should strip __v from JSON', async () => {
    const notif = new Notification({
      userId: new mongoose.Types.ObjectId(),
      type: 'alert_resolved',
      title: 'Resolved',
    });

    const saved = await notif.save();
    const json = saved.toJSON();
    expect(json.__v).toBeUndefined();
    expect(json.id).toBeDefined();
    expect(json._id).toBeUndefined();
  });
});
