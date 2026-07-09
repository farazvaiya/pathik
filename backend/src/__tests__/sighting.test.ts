import mongoose from 'mongoose';
import { Sighting } from '../models/Sighting';

describe('Sighting Model', () => {
  it('should create a sighting with required fields', async () => {
    const sighting = new Sighting({
      alertId: new mongoose.Types.ObjectId(),
      location: { type: 'Point', coordinates: [90.4125, 23.8103] },
      confirmationCount: 1,
    });

    const saved = await sighting.save();
    expect(saved._id).toBeDefined();
    expect(saved.confirmationCount).toBe(1);
    expect(saved.isVerified).toBe(false);
  });

  it('should default confirmation count to 1', async () => {
    const sighting = new Sighting({
      alertId: new mongoose.Types.ObjectId(),
      location: { type: 'Point', coordinates: [90.4125, 23.8103] },
    });

    const saved = await sighting.save();
    expect(saved.confirmationCount).toBe(1);
  });

  it('should track confirmedBy array', async () => {
    const userId = new mongoose.Types.ObjectId();
    const sighting = new Sighting({
      alertId: new mongoose.Types.ObjectId(),
      location: { type: 'Point', coordinates: [90.4125, 23.8103] },
      confirmationCount: 1,
      confirmedBy: [{ userId, createdAt: new Date() }],
    });

    const saved = await sighting.save();
    expect(saved.confirmedBy.length).toBe(1);
    expect(saved.confirmedBy[0].userId?.toString()).toBe(userId.toString());
  });

  it('should have 2dsphere index on location', () => {
    const indexes = Sighting.schema.indexes();
    const hasGeoIndex = indexes.some(
      ([index]) => JSON.stringify(index).includes('2dsphere')
    );
    expect(hasGeoIndex).toBe(true);
  });

  it('should have alertId index', () => {
    const indexes = Sighting.schema.indexes();
    const hasAlertIndex = indexes.some(
      ([index]) => 'alertId' in index
    );
    expect(hasAlertIndex).toBe(true);
  });
});
