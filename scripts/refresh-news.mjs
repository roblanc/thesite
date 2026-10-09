#!/usr/bin/env node
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const SITE = 'https://thesite.ro';
const FRESH_CACHE_SECONDS = 600;

/** A stale origin request starts the existing authenticated Vercel refresh pipeline. */
export async function ensureFreshNews({
  fetchImpl = fetch,
  now = Date.now,
  sleep = delay,
  maxWaitMs = 110_000,
  pollIntervalMs = 5_000,
} = {}) {
  const deadline = now() + maxWaitMs;
  let lastProblem = 'No response';
  let attempts = 0;

  while (now() < deadline) {
    attempts += 1;
    // A unique query reaches the origin instead of reusing a CDN response. Only
    // limit/view affect the payload; the API ignores the probe parameter.
    const url = new URL('/api/news', SITE);
    url.searchParams.set('limit', '5');
    url.searchParams.set('view', 'card');
    url.searchParams.set('freshnessProbe', `${now()}-${attempts}`);
    try {
      const response = await fetchImpl(url, {
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(Math.max(1, Math.min(20_000, deadline - now()))),
        redirect: 'error',
      });
      if (!response.ok) throw new Error(`News API HTTP ${response.status}`);
      const body = await response.json();
      const age = body.cacheAgeSeconds;
      if (body.success !== true || !Array.isArray(body.data) || body.data.length < 5) {
        lastProblem = 'News API returned fewer than five stories or reported failure';
      } else if (body.fromCache !== true || typeof age !== 'number' || !Number.isFinite(age) || age < 0) {
        lastProblem = 'Fresh Redis cache age is unavailable';
      } else if (age > FRESH_CACHE_SECONDS) {
        lastProblem = `News cache is ${age}s old; awaiting background refresh`;
      } else {
        return { success: true, cacheAgeSeconds: age, stories: body.data.length, attempts };
      }
    } catch (error) {
      lastProblem = error instanceof Error ? error.message : 'News request failed';
    }
    const remaining = deadline - now();
    if (remaining > 0) await sleep(Math.min(pollIntervalMs, remaining));
  }
  throw new Error(`News freshness check failed after ${attempts} attempts: ${lastProblem}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), ...await ensureFreshNews() }));
  } catch (error) {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), success: false, error: error.message }));
    process.exitCode = 1;
  }
}
