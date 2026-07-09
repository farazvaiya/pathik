import axios from 'axios';
import { logger } from '../utils/logger';

const AI_SERVICES = {
  nlp: process.env.AI_NLP_URL || 'http://localhost:8001',
  image: process.env.AI_IMAGE_URL || 'http://localhost:8002',
  deepfake: process.env.AI_DEEPFAKE_URL || 'http://localhost:8003',
  clustering: process.env.AI_CLUSTERING_URL || 'http://localhost:8004',
};

export interface NLPResult {
  category: string;
  severity: string;
  is_emergency: boolean;
  confidence: number;
  language: string;
  sentiment: string;
  entities: { locations: string[]; vehicles: string[]; persons: string[] };
  processing_time_ms: number;
}

export interface ImageAnalysisResult {
  objects: Array<{ class_name: string; confidence: number; bbox: number[] }>;
  license_plates: Array<{ text: string; confidence: number }>;
  person_attributes: Array<{ gender?: string; age_group?: string; clothing_color?: string }>;
  vehicle_attributes: Array<{ vehicle_type?: string; color?: string }>;
  deepfake_score: number;
  is_ai_generated: boolean;
  processing_time_ms: number;
}

export interface ClusteringResult {
  cluster_id: number;
  centroid_lat: number;
  centroid_lng: number;
  sighting_count: number;
  confidence_score: number;
  movement_direction?: string;
  movement_speed_kmh?: number;
}

export async function classifyText(text: string, referenceType: string, referenceId: string): Promise<NLPResult | null> {
  try {
    const response = await axios.post<{ result: NLPResult }>(`${AI_SERVICES.nlp}/classify`, {
      text,
      reference_type: referenceType,
      reference_id: referenceId,
    }, { timeout: 5000 });
    return response.data as unknown as NLPResult;
  } catch (err) {
    logger.error('NLP classification failed', { error: (err as Error).message });
    return null;
  }
}

export async function analyzeImage(imageUrl: string, referenceType: string, referenceId: string): Promise<ImageAnalysisResult | null> {
  try {
    const imageResponse = await axios.get<ArrayBuffer>(imageUrl, { responseType: 'arraybuffer', timeout: 10000 });
    const formData = new FormData();
    const blob = new Blob([Buffer.from(imageResponse.data)]);
    formData.append('file', blob, 'image.jpg');
    formData.append('reference_type', referenceType);
    formData.append('reference_id', referenceId);

    const response = await axios.post<ImageAnalysisResult>(`${AI_SERVICES.image}/analyze`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 15000,
    });
    return response.data;
  } catch (err) {
    logger.error('Image analysis failed', { error: (err as Error).message });
    return null;
  }
}

export async function clusterSightings(alertId: string, sightings: Array<{ sighting_id: string; lat: number; lng: number; timestamp: string; trust_score: number }>): Promise<ClusteringResult[]> {
  try {
    const response = await axios.post<{ clusters: ClusteringResult[] }>(`${AI_SERVICES.clustering}/cluster`, sightings, {
      params: { alert_id: alertId },
      timeout: 10000,
    });
    return response.data.clusters || [];
  } catch (err) {
    logger.error('Clustering failed', { error: (err as Error).message });
    return [];
  }
}

export async function checkHealth(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  for (const [name, url] of Object.entries(AI_SERVICES)) {
    try {
      await axios.get(`${url}/health`, { timeout: 2000 });
      results[name] = true;
    } catch {
      results[name] = false;
    }
  }
  return results;
}
