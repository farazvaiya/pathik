import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../');

function resolvePath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

export function readJsonArray<T>(filename: string): T[] {
  try {
    const filePath = resolvePath(filename);
    if (!fs.existsSync(filePath)) return [];
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function writeJsonArray<T>(filename: string, items: T[], limit = 1000): void {
  const filePath = resolvePath(filename);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(items.slice(0, limit), null, 2));
}

export function readJsonFile<T>(filename: string): T | null {
  try {
    const filePath = resolvePath(filename);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

export function writeJsonFile<T>(filename: string, data: T): void {
  const filePath = resolvePath(filename);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function fileExists(filename: string): boolean {
  return fs.existsSync(resolvePath(filename));
}
