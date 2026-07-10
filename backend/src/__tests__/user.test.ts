import mongoose from 'mongoose';
import { User } from '../models/User';

describe('User Model', () => {
  it('should create a user with required fields', async () => {
    const user = new User({
      email: 'test@pathik.app',
      passwordHash: 'Test@12345',
      displayName: 'Test User',
    });

    const saved = await user.save();
    expect(saved._id).toBeDefined();
    expect(saved.email).toBe('test@pathik.app');
    expect(saved.role).toBe('user');
    expect(saved.trustScore).toBe(0.50);
    expect(saved.isPhoneVerified).toBe(false);
    expect(saved.isOfficiallyVerified).toBe(false);
  });

  it('should default trust score to 0.50', async () => {
    const user = new User({
      email: 'trust@pathik.app',
      passwordHash: 'Test@12345',
      displayName: 'Trust User',
    });

    const saved = await user.save();
    expect(saved.trustScore).toBe(0.50);
  });

  it('should validate role enum', async () => {
    const user = new User({
      email: 'role@pathik.app',
      passwordHash: 'Test@12345',
      displayName: 'Role User',
      role: 'invalid_role',
    });

    await expect(user.save()).rejects.toThrow();
  });

  it('should allow police role', async () => {
    const user = new User({
      email: 'police@pathik.app',
      passwordHash: 'Test@12345',
      displayName: 'Police User',
      role: 'police',
    });

    const saved = await user.save();
    expect(saved.role).toBe('police');
  });

  it('should allow rab role', async () => {
    const user = new User({
      email: 'rab@pathik.app',
      passwordHash: 'Test@12345',
      displayName: 'RAB User',
      role: 'rab',
    });

    const saved = await user.save();
    expect(saved.role).toBe('rab');
  });

  it('should hash password on save', async () => {
    const user = new User({
      email: 'hash@pathik.app',
      passwordHash: 'Test@12345',
      displayName: 'Hash User',
    });

    const saved = await user.save();
    expect(saved.passwordHash).not.toBe('Test@12345');
    expect(saved.passwordHash.length).toBeGreaterThan(20);
  });

  it('should compare password correctly', async () => {
    const user = new User({
      email: 'compare@pathik.app',
      passwordHash: 'Test@12345',
      displayName: 'Compare User',
    });

    await user.save();
    const isMatch = await user.comparePassword('Test@12345');
    expect(isMatch).toBe(true);

    const isWrong = await user.comparePassword('wrong');
    expect(isWrong).toBe(false);
  });

  it('should have trustScore index', () => {
    const indexes = User.schema.indexes();
    const hasTrustIndex = indexes.some(
      ([index]) => 'trustScore' in index
    );
    expect(hasTrustIndex).toBe(true);
  });

  it('should have 2dsphere index on jurisdictionLocation', () => {
    const indexes = User.schema.indexes();
    const hasGeoIndex = indexes.some(
      ([index]) => JSON.stringify(index).includes('2dsphere')
    );
    expect(hasGeoIndex).toBe(true);
  });
});
