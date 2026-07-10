import mongoose from 'mongoose';
import { Alert, IAlert } from '../models/Alert';
import { Sighting } from '../models/Sighting';
import { FeedPost } from '../models/FeedPost';
import { User } from '../models/User';
import { Notification } from '../models/Notification';

describe('Alert Model', () => {
  it('should create an alert with required fields', async () => {
    const alertData = {
      type: 'robbery' as const,
      severity: 'critical' as const,
      isEmergency: true,
      originalText: 'মিরপুর ১০ এ ছিনতাই',
      originalPostId: new mongoose.Types.ObjectId(),
      location: { type: 'Point' as const, coordinates: [90.4125, 23.8103] },
      radius: 2000,
    };

    const alert = new Alert(alertData);
    const saved = await alert.save();

    expect(saved._id).toBeDefined();
    expect(saved.type).toBe('robbery');
    expect(saved.severity).toBe('critical');
    expect(saved.isEmergency).toBe(true);
    expect(saved.status).toBe('active');
    expect(saved.sightingCount).toBe(0);
    expect(saved.flagCount).toBe(0);
  });

  it('should default status to active', async () => {
    const alert = new Alert({
      type: 'accident',
      severity: 'high',
      isEmergency: true,
      originalPostId: new mongoose.Types.ObjectId(),
      location: { type: 'Point', coordinates: [90.4125, 23.8103] },
    });

    const saved = await alert.save();
    expect(saved.status).toBe('active');
  });

  it('should validate alert type enum', async () => {
    const alert = new Alert({
      type: 'invalid_type',
      severity: 'low',
      isEmergency: false,
      originalPostId: new mongoose.Types.ObjectId(),
      location: { type: 'Point', coordinates: [90.4125, 23.8103] },
    });

    await expect(alert.save()).rejects.toThrow();
  });

  it('should validate severity enum', async () => {
    const alert = new Alert({
      type: 'other',
      severity: 'invalid',
      isEmergency: false,
      originalPostId: new mongoose.Types.ObjectId(),
      location: { type: 'Point', coordinates: [90.4125, 23.8103] },
    });

    await expect(alert.save()).rejects.toThrow();
  });

  it('should set default radius to 2000', async () => {
    const alert = new Alert({
      type: 'other',
      severity: 'low',
      isEmergency: false,
      originalPostId: new mongoose.Types.ObjectId(),
      location: { type: 'Point', coordinates: [90.4125, 23.8103] },
    });

    const saved = await alert.save();
    expect(saved.radius).toBe(2000);
  });

  it('should track flagging', async () => {
    const alert = new Alert({
      type: 'other',
      severity: 'low',
      isEmergency: false,
      originalPostId: new mongoose.Types.ObjectId(),
      location: { type: 'Point', coordinates: [90.4125, 23.8103] },
    });

    const saved = await alert.save();
    saved.flaggedBy.push({ userId: new mongoose.Types.ObjectId(), reason: 'suspicious' });
    saved.flagCount = 1;
    await saved.save();

    const reloaded = await Alert.findById(saved._id);
    expect(reloaded!.flagCount).toBe(1);
    expect(reloaded!.flaggedBy.length).toBe(1);
  });

  it('should have 2dsphere index on location', () => {
    const indexes = Alert.schema.indexes();
    const hasGeoIndex = indexes.some(
      ([index]) => JSON.stringify(index).includes('2dsphere')
    );
    expect(hasGeoIndex).toBe(true);
  });
});
