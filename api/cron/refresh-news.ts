import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import {
    RSSNewsItem,
    NEWS_SOURCES,
    fetchRSSFeed
} from '../_lib/shared.js';
import { aggregateNewsBuildTopics, AggregatedStory, applyCoverage, coverageContextFor, getTimeAgo } from '../_lib/aggregation.js';
import { mergeWithExisting, storiesToArchive } from '../_lib/storyMerge.js';
import { archiveStories } from '../_lib/storyArchive.js';
import { sortByImportance, CARDS_CACHE_KEY } from '../_lib/newsResponse.js';
import { toStoryCard } from '../../shared/storyCard.js';

const CACHE_KEY = 'aggregated_news_v2';
const CACHE_KEY_TS = 'aggregated_news_v2_ts';
const CACHE_TTL = 25 * 60 * 60;
const MIN_SOURCES_THRESHOLD = 2; // matches frontend filter (sourcesCount > 1) — single-source stories are filtered out anyway
const MAX_STORY_AGE_MS = 7 * 24 * 60 * 60 * 1000; // Expire stories older than 7 days
const MAX_STORIES = 100;
const REFRESH_LOCK_KEY = `${CACHE_KEY}:refresh_lock`;
const REFRESH_LOCK_TTL = 10 * 60;

async function fetchAllNews(): Promise<RSSNewsItem[]> {
    // Toate sursele în paralel — se termină în max 3s (timeout per sursă)
    const results = await Promise.allSettled(NEWS_SOURCES.map(s => fetchRSSFeed(s)));
    const allNews: RSSNewsItem[] = [];

    results.forEach(result => {
        if (result.status === 'fulfilled') {
            allNews.push(...result.value);
        }
    });

    allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return allNews;
}

async function acquireRefreshLock(redis: Redis): Promise<string | null> {
    const lockId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const result = await redis.set(REFRESH_LOCK_KEY, lockId, { nx: true, ex: REFRESH_LOCK_TTL });
    return result === 'OK' ? lockId : null;
}

async function releaseRefreshLock(redis: Redis, lockId: string): Promise<void> {
    try {
        const currentLock = await redis.get<string>(REFRESH_LOCK_KEY);
        if (currentLock === lockId) {
            await redis.del(REFRESH_LOCK_KEY);
        }
    } catch (error) {
        console.error('[CRON] Refresh lock release failed:', error);
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Verify this is a cron request from Vercel
    const cronSecret = process.env.CRON_SECRET;
    if (process.env.NODE_ENV === 'production' && !cronSecret) {
        return res.status(500).json({ error: 'CRON_SECRET is not configured in production' });
    }
    if (cronSecret) {
        const authHeader = req.headers['authorization'];
        if (authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    // Initialize Redis inside handler — prevents module-level crash if env vars are missing
    // Also normalize URL to handle values without https:// prefix (same pattern as api/news.ts)
    let redis: Redis | null = null;
    try {
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            let url = process.env.UPSTASH_REDIS_REST_URL;
            if (!url.startsWith('http')) url = `https://${url}`;
            redis = new Redis({ url, token: process.env.UPSTASH_REDIS_REST_TOKEN });
        } else {
            console.warn('[CRON] Redis env vars not set — cache will not be updated');
        }
    } catch (e) {
        console.error('[CRON] Redis init failed:', e);
    }

    if (!redis) {
        return res.status(500).json({ success: false, error: 'Redis unavailable — check UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars' });
    }

    const lockId = await acquireRefreshLock(redis);
    if (!lockId) {
        return res.status(200).json({
            success: true,
            skipped: true,
            message: 'Refresh already in progress',
        });
    }

    let status = 500;
    let body: Record<string, unknown> = { success: false, error: 'Unknown error' };
    try {
        console.log('[CRON] Starting news refresh with source accumulation...');
        const startTime = Date.now();

        // 1. Fetch fresh news from RSS
        const allNews = await fetchAllNews();
        console.log(`[CRON] Fetched ${allNews.length} news items`);

        // 2. Load existing stories from Redis (pentru acumulare surse)
        const existingRaw = await redis.get<AggregatedStory[]>(CACHE_KEY);
        const existingStories: AggregatedStory[] = existingRaw ?? [];
        console.log(`[CRON] Loaded ${existingStories.length} existing stories from cache`);

        // 3. Agregă știrile proaspete (a story that continues a cached one keeps its headline
        //    unless it grew a lot, so the LLM is only asked for new or outgrown stories)
        const freshStories = await aggregateNewsBuildTopics(allNews, MIN_SOURCES_THRESHOLD, existingStories);
        console.log(`[CRON] Aggregated ${freshStories.length} fresh stories`);

        // 4. Merge with cached stories (strict overlap, one-to-one, stable ids — see _lib/storyMerge.ts)
        //    and carry forward old stories not seen in this run, as long as they are < 7 days old.
        const now = Date.now();
        const { merged: mergedFreshStories, unmatched } = mergeWithExisting(freshStories, existingStories);

        const carryForwardStories = unmatched
            .filter(existing => now - new Date(existing.publishedAt).getTime() <= MAX_STORY_AGE_MS)
            .map(s => ({
                ...s,
                timeAgo: getTimeAgo(s.publishedAt), // recalculează timeAgo
            }));

        console.log(`[CRON] Carrying forward ${carryForwardStories.length} stories not seen in current RSS`);

        // 5. Recalculează bara, preluările și blindspot-urile pentru toate poveștile (inclusiv cele
        //    reportate din rulări anterioare), cu datele acestei rulări: ce feed-uri au răspuns și
        //    cât a publicat fiecare parte. Un feed căzut nu mai poate crea un blindspot fals.
        const coverageContext = coverageContextFor(allNews);
        const rescored = [...mergedFreshStories, ...carryForwardStories].map(s => applyCoverage(s, coverageContext));

        // 6. Combină și sortează după importanță (relatări independente + freshness)
        const allStories = sortByImportance(rescored).slice(0, MAX_STORIES);
        const blindspotCount = allStories.filter(s => s.blindspot === 'left' || s.blindspot === 'right').length;

        const multiSourceCount = allStories.filter(s => s.sourcesCount >= 2).length;
        console.log(`[CRON] Final: ${allStories.length} stories (${multiSourceCount} cu ≥2 surse)`);

        await Promise.all([
            redis.set(CACHE_KEY, allStories, { ex: CACHE_TTL }),
            redis.set(CARDS_CACHE_KEY, allStories.map(toStoryCard), { ex: CACHE_TTL }),
            redis.set(CACHE_KEY_TS, Date.now(), { ex: CACHE_TTL }),
        ]);

        // Archive individual stories for 30 days — enables lookup even after expiry from main feed.
        // Only new or changed stories are rewritten, to save Upstash bandwidth.
        const STORY_ARCHIVE_TTL = 30 * 24 * 60 * 60;
        const toArchive = storiesToArchive(allStories, existingStories);
        // Awaited: un-awaited writes can be dropped when the function freezes after responding.
        const archiveResults = await Promise.allSettled(
            toArchive.map(story => redis!.set(`story:${story.id}`, story, { ex: STORY_ARCHIVE_TTL }))
        );
        const archiveFailures = archiveResults.filter(r => r.status === 'rejected').length;
        if (archiveFailures > 0) console.error(`[CRON] Story archive write failed for ${archiveFailures} stories`);

        // Permanent archive in Postgres. Best-effort: a DB failure must never fail the refresh.
        let dbArchive: { stories: number; sources: number } | { error: string } | null = null;
        try {
            dbArchive = await archiveStories(allStories);
        } catch (e) {
            console.error('[CRON] Permanent archive write failed:', e);
            dbArchive = { error: e instanceof Error ? e.message : String(e) };
        }

        const duration = Date.now() - startTime;
        console.log(`[CRON] Cache refreshed in ${duration}ms`);

        status = 200;
        body = {
            success: true,
            message: 'Cache refreshed with source accumulation',
            dbArchive,
            stats: {
                newsItems: allNews.length,
                freshStories: freshStories.length,
                carryForwardStories: carryForwardStories.length,
                totalStored: allStories.length,
                storyKeysWritten: toArchive.length,
                multiSourceStories: multiSourceCount,
                blindspots: blindspotCount,
                feedHealth: coverageContext.feedHealth,
                durationMs: duration,
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('[CRON] Error refreshing cache:', error);
        body = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    } finally {
        // Release before responding: Vercel may freeze the function as soon as the
        // response is sent, which left the lock stuck for its full 10-minute TTL.
        await releaseRefreshLock(redis, lockId);
    }
    return res.status(status).json(body);
}
