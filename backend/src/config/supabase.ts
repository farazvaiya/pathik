import { env } from './env';

let _client: any = null;

export function getSupabaseClient() {
  if (_client) return _client;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@supabase/supabase-js');
    _client = createClient(env.SUPABASE_URL.trim(), env.SUPABASE_SERVICE_ROLE_KEY.trim());
    return _client;
  } catch {
    return null;
  }
}
