/**
 * Migration: Update all existing alerts to 5km (5000m) radius
 * Run: npx ts-node src/scripts/migrate-alert-radius.ts
 */
import mongoose from 'mongoose';
import { env } from '../config/env';

async function migrate() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('[migration] Connected to MongoDB');

  const result = await mongoose.connection.db!.collection('alerts').updateMany(
    { radius: { $lt: 5000 } },
    { $set: { radius: 5000 } }
  );

  console.log(`[migration] Updated ${result.modifiedCount} alerts to 5000m radius`);

  // Also update alerts with radius = 0 (non-emergency types like traffic_jam)
  const result2 = await mongoose.connection.db!.collection('alerts').updateMany(
    { radius: 0 },
    { $set: { radius: 5000 } }
  );

  console.log(`[migration] Updated ${result2.modifiedCount} zero-radius alerts to 5000m`);

  await mongoose.disconnect();
  console.log('[migration] Done');
}

migrate().catch((err) => {
  console.error('[migration] Failed:', err);
  process.exit(1);
});
