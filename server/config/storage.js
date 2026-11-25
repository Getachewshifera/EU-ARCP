// Purpose: Creates and verifies the private Supabase Storage client.
const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET } = require('./environment');

let client;

function getStorageConfig() {
  const url = SUPABASE_URL;
  const serviceRoleKey = SUPABASE_SERVICE_ROLE_KEY;
  const bucket = SUPABASE_BUCKET;

  if (!url || !serviceRoleKey || !bucket
    || /^(?:ADD_MY_SECRET_KEY_IN_SERVER_ENV|replace-with-|your[-_ ]?(?:service|secret)|placeholder|example)/i.test(serviceRoleKey)) {
    const error = new Error('Supabase Storage is not configured on the server.');
    error.status = 503;
    throw error;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    const error = new Error('Supabase Storage configuration is invalid.');
    error.status = 503;
    throw error;
  }

  if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
    const error = new Error('Supabase Storage configuration is invalid.');
    error.status = 503;
    throw error;
  }

  return { url: parsedUrl.toString().replace(/\/+$/, ''), serviceRoleKey, bucket };
}

function getSupabaseClient() {
  if (!client) {
    const { url, serviceRoleKey } = getStorageConfig();
    client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }
  return client;
}

async function verifyStorageConnection() {
  const { bucket } = getStorageConfig();
  const { data, error } = await getSupabaseClient().storage.getBucket(bucket);
  if (error || !data || data.public === true) {
    const connectionError = new Error(
      data?.public === true
        ? 'The configured Supabase bucket must be private.'
        : 'Unable to verify the configured private Supabase bucket.',
    );
    connectionError.status = 503;
    throw connectionError;
  }
  return true;
}

module.exports = { getStorageConfig, getSupabaseClient, verifyStorageConnection };
