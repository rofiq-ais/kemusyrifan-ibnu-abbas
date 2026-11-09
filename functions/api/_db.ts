import { neon } from '@neondatabase/serverless';

declare global {
  type PagesFunction<T = any> = (context: {
    request: Request;
    env: T;
    params?: any;
    data?: any;
  }) => Promise<Response>;
}

export interface Env {
  DATABASE_URL: string;
}

export function getDb(env: Env) {
  const url = env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }
  return neon(url);
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}
