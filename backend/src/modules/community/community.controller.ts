import { Request, Response, NextFunction } from 'express';
import { readJsonArray, writeJsonArray } from '../../utils/fileStore';
import { cleanInput, cleanNumber, cleanStringList, titleCase, createId } from '../../utils/cleaners';

const COMMUNITY_ROUTES_FILE = 'community-routes.json';
const COMMUNITY_STOPS_FILE = 'community-stops.json';

interface CommunityRoute {
  id: string; from: string; to: string; fromDisplay: string; toDisplay: string;
  busName: string; fare: number | null; stops: string[]; authorId: string;
  votes: { agree: number; disagree: number }; voters: Record<string, string>;
  status: string; createdAt: string;
}

interface CommunityStop {
  id: string; name: string; area: string; lat: number | null; lng: number | null;
  authorId: string; status: string; createdAt: string;
}

function sanitizeRoute(input: any, existing?: any): CommunityRoute {
  const from = cleanInput(input.from || existing?.from, 120, { lowercase: true });
  const to = cleanInput(input.to || existing?.to, 120, { lowercase: true });
  return {
    id: cleanInput(existing?.id || input.id, 80) || createId('crowdroute'),
    from, to,
    fromDisplay: cleanInput(input.fromDisplay || titleCase(from), 120),
    toDisplay: cleanInput(input.toDisplay || titleCase(to), 120),
    busName: cleanInput(input.busName || existing?.busName, 120),
    fare: cleanNumber(input.fare ?? existing?.fare, { min: 0, max: 1000 }),
    stops: cleanStringList(input.stops || existing?.stops),
    authorId: cleanInput(input.authorId || existing?.authorId || 'anonymous', 100),
    votes: {
      agree: Math.max(0, Number(existing?.votes?.agree ?? input.votes?.agree ?? 0) || 0),
      disagree: Math.max(0, Number(existing?.votes?.disagree ?? input.votes?.disagree ?? 0) || 0),
    },
    voters: typeof existing?.voters === 'object' && existing.voters !== null ? existing.voters : {},
    status: cleanInput(existing?.status || input.status || 'active', 30),
    createdAt: existing?.createdAt || input.createdAt || new Date().toISOString(),
  };
}

function sanitizeStop(input: any, existing?: any): CommunityStop {
  return {
    id: cleanInput(existing?.id || input.id, 80) || createId('stop'),
    name: cleanInput(input.name || existing?.name, 120),
    area: cleanInput(input.area || existing?.area, 120),
    lat: cleanNumber(input.lat ?? existing?.lat, { min: -90, max: 90 }),
    lng: cleanNumber(input.lng ?? existing?.lng, { min: -180, max: 180 }),
    authorId: cleanInput(input.authorId || existing?.authorId || 'anonymous', 100),
    status: cleanInput(existing?.status || input.status || 'active', 30),
    createdAt: existing?.createdAt || input.createdAt || new Date().toISOString(),
  };
}

function publicItem(item: any): any {
  const { voters, ...safe } = item;
  return safe;
}

function applyVote(items: any[], id: string, vote: string, userId: string) {
  const safeId = cleanInput(id, 80);
  const safeVote = cleanInput(vote, 20);
  const safeUser = cleanInput(userId || 'anonymous', 100);
  if (!safeId || !['agree', 'disagree'].includes(safeVote)) return { ok: false, statusCode: 400, error: 'Invalid vote' };
  const item = items.find((e: any) => e.id === safeId);
  if (!item) return { ok: false, statusCode: 404, error: 'Item not found' };
  if (!item.votes) item.votes = { agree: 0, disagree: 0 };
  if (!item.voters || typeof item.voters !== 'object') item.voters = {};
  const previous = item.voters[safeUser];
  if (previous === safeVote) {
    delete item.voters[safeUser];
    item.votes[safeVote] = Math.max(0, Number(item.votes[safeVote] || 0) - 1);
  } else {
    if (previous && item.votes[previous] !== undefined) item.votes[previous] = Math.max(0, Number(item.votes[previous] || 0) - 1);
    item.voters[safeUser] = safeVote;
    item.votes[safeVote] = Number(item.votes[safeVote] || 0) + 1;
  }
  return { ok: true, item };
}

export function getRoutes(_req: Request, res: Response): void {
  const routes = readJsonArray<CommunityRoute>(COMMUNITY_ROUTES_FILE).filter((r) => r.status !== 'deleted').map(publicItem);
  res.json({ success: true, data: routes });
}

export function createRoute(req: Request, res: Response, next: NextFunction): void {
  try {
    const route = sanitizeRoute(req.body);
    if (!route.from || !route.to) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'from and to are required' } }); return; }
    const routes = readJsonArray<CommunityRoute>(COMMUNITY_ROUTES_FILE).map((r: any) => sanitizeRoute(r, r));
    routes.unshift(route);
    writeJsonArray(COMMUNITY_ROUTES_FILE, routes, 1000);
    res.status(201).json({ success: true, data: publicItem(route) });
  } catch (err) { next(err); }
}

export function voteOnRoute(req: Request, res: Response, next: NextFunction): void {
  try {
    const routes = readJsonArray<any>(COMMUNITY_ROUTES_FILE).map((r: any) => sanitizeRoute(r, r));
    const result = applyVote(routes, req.body.id, req.body.vote, req.body.userId);
    if (!result.ok) { res.status(result.statusCode || 400).json({ success: false, error: { code: 'VOTE_ERROR', message: result.error } }); return; }
    writeJsonArray(COMMUNITY_ROUTES_FILE, routes, 1000);
    res.json({ success: true, data: publicItem(result.item) });
  } catch (err) { next(err); }
}

export function getStops(_req: Request, res: Response): void {
  const stops = readJsonArray<CommunityStop>(COMMUNITY_STOPS_FILE).filter((s) => s.status !== 'deleted').map(publicItem);
  res.json({ success: true, data: stops });
}

export function createStop(req: Request, res: Response, next: NextFunction): void {
  try {
    const stop = sanitizeStop(req.body);
    if (!stop.name) { res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name is required' } }); return; }
    const stops = readJsonArray<CommunityStop>(COMMUNITY_STOPS_FILE).map((s: any) => sanitizeStop(s, s));
    stops.unshift(stop);
    writeJsonArray(COMMUNITY_STOPS_FILE, stops, 1000);
    res.status(201).json({ success: true, data: publicItem(stop) });
  } catch (err) { next(err); }
}
