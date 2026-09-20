import { createClient } from '@supabase/supabase-js';
import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
let developmentEnvLoaded = false;

function loadLocalDevelopmentEnv() {
  if (process.env.NODE_ENV !== 'development' || developmentEnvLoaded) return;
  const inheritedUrl = process.env.NEXT_SUPABASE_URL;
  const inheritedServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  delete process.env.NEXT_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  loadEnvConfig(process.cwd(), true, true);

  if (!process.env.NEXT_SUPABASE_URL && inheritedUrl) process.env.NEXT_SUPABASE_URL = inheritedUrl;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && inheritedServiceRoleKey) process.env.SUPABASE_SERVICE_ROLE_KEY = inheritedServiceRoleKey;
  developmentEnvLoaded = true;
}

export function createServerSupabaseClient() {
  loadLocalDevelopmentEnv();
  const url = process.env.NEXT_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server configuration is missing.');
  }

  let urlProjectRef = '';
  let keyProjectRef = '';
  try {
    urlProjectRef = new URL(url).hostname.split('.')[0];
    keyProjectRef = JSON.parse(Buffer.from(serviceRoleKey.split('.')[1], 'base64url').toString('utf8')).ref || '';
  } catch {
    throw new Error('Supabase server configuration is malformed.');
  }
  if (urlProjectRef && keyProjectRef && urlProjectRef !== keyProjectRef) {
    throw new Error('Supabase URL and service-role key belong to different projects.');
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
