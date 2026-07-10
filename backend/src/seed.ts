import { connectDBOrExit, disconnectDB } from './config/db';
import { readJsonFile } from './utils/fileStore';
import { logger } from './utils/logger';
import { Corridor } from './models/Corridor';
import { MetroFare } from './models/MetroFare';
import { BusFare } from './models/BusFare';

async function seedCorridors(): Promise<number> {
  const data = readJsonFile<any>('routes.json');
  const corridors = data?.corridors ?? [];
  if (!corridors.length) { logger.warn('[seed] No corridors in routes.json'); return 0; }
  await Corridor.deleteMany({});
  const docs = corridors.map((c: any) => ({
    from: String(c.from).toLowerCase().trim(),
    to: String(c.to).toLowerCase().trim(),
    direct: { mode: c.direct?.mode ?? 'bus', names: c.direct?.names ?? [], stops: c.direct?.stops ?? [], fare: c.direct?.fare },
  }));
  await Corridor.insertMany(docs, { ordered: false });
  logger.info(`[seed] Corridors: ${docs.length} inserted`);
  return docs.length;
}

async function seedMetroFares(): Promise<number> {
  const data = readJsonFile<any>('metro.json');
  const faresMap = data?.fares ?? {};
  const docs: any[] = [];
  for (const [from, row] of Object.entries(faresMap)) {
    if (!row || typeof row !== 'object') continue;
    for (const [to, fare] of Object.entries(row as Record<string, unknown>)) {
      if (typeof fare === 'number' && Number.isFinite(fare)) docs.push({ from: from.trim(), to: to.trim(), fare });
    }
  }
  if (!docs.length) { logger.warn('[seed] No metro fares in metro.json'); return 0; }
  await MetroFare.deleteMany({});
  await MetroFare.insertMany(docs, { ordered: false });
  logger.info(`[seed] Metro fares: ${docs.length} inserted`);
  return docs.length;
}

async function seedBusFares(): Promise<number> {
  const data = readJsonFile<any>('fair.json');
  const routes = data?.routes ?? [];
  if (!routes.length) { logger.warn('[seed] No bus fare routes in fair.json'); return 0; }
  const docs = routes.map((r: any) => ({
    routeId: String(r.route_id), routeName: String(r.route_name ?? ''),
    origin: String(r.origin ?? ''), destination: String(r.destination ?? ''),
    totalDistanceKm: Number(r.total_distance_km) || 0, fareRatePerKm: Number(r.fare_rate_per_km) || 0,
    stations: Array.isArray(r.stations) ? r.stations.map(String) : [],
  }));
  await BusFare.deleteMany({});
  await BusFare.insertMany(docs, { ordered: false });
  logger.info(`[seed] Bus fare routes: ${docs.length} inserted`);
  return docs.length;
}

async function main() {
  logger.info('[seed] Connecting to MongoDB…');
  await connectDBOrExit();
  const corridors = await seedCorridors();
  const metroFares = await seedMetroFares();
  const busFares = await seedBusFares();
  logger.info(`[seed] Done. Corridors=${corridors}, MetroFares=${metroFares}, BusFares=${busFares}`);
  await disconnectDB();
}

main().catch((err) => { logger.error(`[seed] Failed: ${err.message}`); process.exit(1); });
