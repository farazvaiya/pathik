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

// === Groq-based text classification (no Docker needed) ===
export async function classifyTextWithGroq(text: string): Promise<NLPResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `You are a classification API for a Dhaka transport safety app called Pathik. Classify this user post and return ONLY valid JSON (no markdown, no explanation).

Post: "${text}"

Return this exact JSON structure:
{
  "category": "accident|assault|robbery|harassment|medical|fire|missing_person|stolen_vehicle|escaped_criminal|traffic_jam|toll_extortion|police_checkpost|natural_disaster|road_hazard|other",
  "severity": "low|medium|high|critical",
  "is_emergency": true|false,
  "confidence": 0.0-1.0,
  "language": "bn|en|mixed",
  "sentiment": "positive|negative|neutral",
  "entities": { "locations": [], "vehicles": [], "persons": [] }
}`
        }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) return null;
    const data: any = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function classifyText(text: string, referenceType: string, referenceId: string): Promise<NLPResult | null> {
  // Try Groq first (no Docker needed)
  const groqResult = await classifyTextWithGroq(text);
  if (groqResult) return { ...groqResult, processing_time_ms: 0 };

  // Fallback to Docker container (if running)
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
