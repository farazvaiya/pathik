import { z } from 'zod';

const ALERT_TYPES = [
  'accident', 'assault', 'robbery', 'harassment', 'medical',
  'fire', 'missing_person', 'stolen_vehicle', 'escaped_criminal',
  'traffic_jam', 'toll_extortion', 'police_checkpost',
  'natural_disaster', 'road_hazard', 'other',
] as const;

export const createAlertSchema = z.object({
  type: z.enum(ALERT_TYPES).optional(),
  message: z.string().min(1, 'Message is required').max(1200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  locationName: z.string().max(200).optional(),
  image: z.string().max(500).optional(),
  isAnonymous: z.boolean().default(true),
});

export const sightingSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  locationName: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  isAnonymous: z.boolean().default(true),
});

export const confirmSightingSchema = z.object({
  sightingId: z.string().min(1),
});

export const flagAlertSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const resolveAlertSchema = z.object({
  resolution: z.string().min(1, 'Resolution is required').max(500),
  status: z.enum(['resolved', 'false_alarm']),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type SightingInput = z.infer<typeof sightingSchema>;
