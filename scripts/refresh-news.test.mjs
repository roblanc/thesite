import assert from 'node:assert/strict';
import { test } from 'vitest';
import { ensureFreshNews } from './refresh-news.mjs';

const fresh = { success: true, fromCache: true, cacheAgeSeconds: 10, data: Array(5).fill({}) };
const response = (body, status = 200) => ({ ok: status === 200, status, json: async () => body });

function harness(responses) {
  let time = 0;
  const urls = [];
  return {
    urls,
    options: {
      now: () => time,
      sleep: async ms => { time += ms; },
      maxWaitMs: 20,
      pollIntervalMs: 5,
      fetchImpl: async url => {
        urls.push(url.href);
        const result = responses[Math.min(urls.length - 1, responses.length - 1)];
        if (result instanceof Error) throw result;
        return result;
      },
    },
  };
}

test('accepts a recent populated Redis cache', async () => {
  const h = harness([response(fresh)]);
  assert.deepEqual(await ensureFreshNews(h.options), { success: true, cacheAgeSeconds: 10, stories: 5, attempts: 1 });
});

test('waits for stale news to refresh and bypasses CDN on every request', async () => {
  const h = harness([response({ ...fresh, cacheAgeSeconds: 4000 }), response(fresh)]);
  assert.equal((await ensureFreshNews(h.options)).attempts, 2);
  assert.equal(new Set(h.urls).size, 2);
  assert.ok(h.urls.every(url => new URL(url).origin === 'https://thesite.ro'));
});

test('recovers from a transient HTTP or transport failure', async () => {
  const h = harness([response({}, 503), new Error('Network unavailable'), response(fresh)]);
  assert.equal((await ensureFreshNews(h.options)).attempts, 3);
});

test('stale HTTP 200 responses eventually fail', async () => {
  const h = harness([response({ ...fresh, cacheAgeSeconds: 4000 })]);
  await assert.rejects(ensureFreshNews(h.options), /cache is 4000s old/);
});

test('archive-only, missing, invalid ages and empty news cannot report freshness', async () => {
  for (const body of [
    { ...fresh, fromCache: false, fromArchive: true },
    { ...fresh, cacheAgeSeconds: null },
    { ...fresh, cacheAgeSeconds: '10' },
    { ...fresh, cacheAgeSeconds: -1 },
    { ...fresh, data: [] },
    { ...fresh, success: false },
  ]) {
    await assert.rejects(ensureFreshNews(harness([response(body)]).options), /freshness check failed/);
  }
});

test('malformed JSON and permanent HTTP failure eventually fail', async () => {
  for (const result of [response({}, 500), { ok: true, json: async () => { throw new SyntaxError('Invalid JSON'); } }]) {
    await assert.rejects(ensureFreshNews(harness([result]).options), /freshness check failed/);
  }
});
