export function titleCase(s: string): string {
  return String(s || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export interface CleanOptions {
  lowercase?: boolean;
  uppercase?: boolean;
}

export function cleanInput(value: unknown, maxLen = 240, opts: CleanOptions = {}): string {
  let s = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (opts.lowercase) s = s.toLowerCase();
  if (opts.uppercase) s = s.toUpperCase();
  return s.slice(0, maxLen);
}

export function cleanStringList(list: unknown, maxItems = 50, maxLen = 120): string[] {
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  for (const item of list) {
    const v = cleanInput(item, maxLen);
    if (v) out.push(v);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function cleanNumber(value: unknown, options?: { min?: number; max?: number }): number | null {
  const num = Number(value);
  const min = options?.min ?? -Infinity;
  const max = options?.max ?? Infinity;
  return Number.isFinite(num) && num >= min && num <= max ? num : null;
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
