import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { waitUntil } from '@vercel/functions';
import {
    RSSNewsItem,
    NEWS_SOURCES,
    fetchRSSFeed
} from './_lib/shared.js';
import { aggregateNewsBuildTopics, AggregatedStory, calculateBiasDistribution, getTimeAgo, resolveStoryImageFromSources } from './_lib/aggregation.js';
import { setCorsHeaders } from './_lib/cors.js';
import { loadArchivedStory, loadRecentArchivedStories } from './_lib/storyArchive.js';
import {
    parseListQuery,
    projectStories,
    sortByImportance,
    storyCacheControl,
    CARDS_CACHE_KEY,
    FALLBACK_LIST_CACHE_CONTROL,
    LIST_CACHE_CONTROL,
    MAX_LIST_LIMIT,
    NO_STORE,
} from './_lib/newsResponse.js';
import { toStoryCard, type StoryCard } from '../shared/storyCard.js';

// Cache key și durata
const CACHE_KEY = 'aggregated_news_v2';
const CACHE_KEY_TS = 'aggregated_news_v2_ts';
const CACHE_TTL = 25 * 60 * 60; // păstrăm suficient istoric cât să avem fallback dacă refresh-ul eșuează
// După 20 min primul vizitator declanșează refresh în background. GitHub rulează cron-ul de 15 min doar
// de câteva ori pe zi, așa că acesta e ritmul real; fiecare refresh mută ~2 MB prin Upstash (plan Free: 10 GB/lună).
const STALE_AFTER = 20 * 60;
const MIN_SOURCES_THRESHOLD = 2; // matches frontend filter (sourcesCount > 1) — no point storing single-source stories
const REFRESH_LOCK_KEY = `${CACHE_KEY}:refresh_lock`;
const REFRESH_LOCK_TTL = 5 * 60;
const REFRESH_TRIGGER_KEY = `${CACHE_KEY}:refresh_trigger`;
const REFRESH_TRIGGER_TTL = 5 * 60;
// Upper bound for the Postgres snapshot read on a cache miss; past it we answer with an empty list.
const ARCHIVE_FALLBACK_TIMEOUT_MS = 4000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function fetchAllNews(): Promise<RSSNewsItem[]> {
    const results = await Promise.allSettled(NEWS_SOURCES.map(s => fetchRSSFeed(s)));
    const allNews: RSSNewsItem[] = [];
    results.forEach(result => {
        if (result.status === 'fulfilled') allNews.push(...result.value);
    });
    allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    return allNews;
}

/** Fallback: when aggregation produces 0 groups, return top articles as individual stories */
async function buildFallbackStories(allNews: RSSNewsItem[], limit: number): Promise<AggregatedStory[]> {
    return Promise.all(
        allNews.slice(0, limit).map(async (item) => ({
            id: `single-${item.id}`,
            title: item.title,
            description: item.description,
            image: await resolveStoryImageFromSources([item]),
            sources: [item],
            sourcesCount: 1,
            bias: calculateBiasDistribution([item]),
            mainCategory: item.category || 'Actualitate',
            publishedAt: item.pubDate,
            timeAgo: getTimeAgo(item.pubDate),
        }))
    );
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
        console.error('Refresh lock release failed:', error);
    }
}

async function buildAndStoreLatestNews(redis: Redis, limit: number): Promise<AggregatedStory[]> {
    const allNews = await fetchAllNews();
    const aggregated = await aggregateNewsBuildTopics(allNews, MIN_SOURCES_THRESHOLD);
    const storiesToStore = aggregated.length > 0 ? aggregated : await buildFallbackStories(allNews, limit);

    if (storiesToStore.length > 0) {
        await Promise.all([
            redis.set(CACHE_KEY, storiesToStore, { ex: CACHE_TTL }),
            redis.set(CARDS_CACHE_KEY, storiesToStore.map(toStoryCard), { ex: CACHE_TTL }),
            redis.set(CACHE_KEY_TS, Date.now(), { ex: CACHE_TTL }),
        ]);
    }

    return storiesToStore;
}

/**
 * Refresh a stale cache in the background. Prefers the full cron pipeline
 * (/api/cron/refresh-news), which merges with existing stories and writes the
 * 30-day `story:<id>` archive, so story links shared on social media keep working.
 * A short trigger key throttles this to one call per window across all visitors.
 */
async function triggerStaleRefresh(redis: Redis, req: VercelRequest): Promise<void> {
    try {
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret) {
            const claimed = await redis.set(REFRESH_TRIGGER_KEY, Date.now(), { nx: true, ex: REFRESH_TRIGGER_TTL });
            if (claimed !== 'OK') return;
            const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
            const response = await fetch(`https://${host}/api/cron/refresh-news`, {
                headers: { Authorization: `Bearer ${cronSecret}` },
            });
            if (!response.ok) console.error('Background cron refresh failed:', response.status);
            return;
        }

        // No CRON_SECRET (local dev): rebuild in-process.
        const lockId = await acquireRefreshLock(redis);
        if (!lockId) return;
        try {
            await buildAndStoreLatestNews(redis, 50);
        } finally {
            await releaseRefreshLock(redis, lockId);
        }
    } catch (error) {
        console.error('Background refresh failed:', error);
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Redis init inside handler — prevents module-level crash if env vars are missing
    let redis: Redis | null = null;
    try {
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            let url = process.env.UPSTASH_REDIS_REST_URL;
            if (!url.startsWith('http')) url = `https://${url}`;

            redis = new Redis({
                url: url,
                token: process.env.UPSTASH_REDIS_REST_TOKEN,
            });
        }
    } catch (e) {
        console.error('Redis init failed:', e);
    }

    try {
        // Per-story archive lookup: GET /api/news?id=<storyId>
        const storyId = req.query.id as string | undefined;
        if (storyId) {
            let story: AggregatedStory | null = null;
            let servedFrom: 'redis' | 'db' = 'redis';
            if (redis) {
                try {
                    story = await redis.get<AggregatedStory>(`story:${storyId}`);
                } catch (e) {
                    console.error('Redis story read failed:', e);
                }
            }
            if (!story) {
                // Permanent archive: stories older than the 30-day Redis TTL.
                try {
                    story = await loadArchivedStory(storyId);
                    servedFrom = 'db';
                } catch (e) {
                    console.error('Permanent archive read failed:', e);
                }
            }
            if (story) {
                // Unchanged stories keep the copy written when they last changed, so timeAgo is old.
                story = { ...story, timeAgo: getTimeAgo(story.publishedAt) };
                res.setHeader('Cache-Control', storyCacheControl(story, servedFrom));
                return res.status(200).json({ success: true, data: story, fromArchive: true, servedFrom });
            }
            return res.status(404).json({ success: false, error: 'Story not found in archive' });
        }

        // ?view=card returns the slim projection used by listing pages (see shared/storyCard.ts);
        // the default full shape is kept for the social scripts and other consumers.
        const { view, limit } = parseListQuery(req.query);

        // Redis read — graceful if unavailable. Card views read the slim card copy; the full
        // stories are only read if it is missing (before the first cron run that writes it).
        let cached: AggregatedStory[] | null = null;
        let cachedCards: StoryCard[] | null = null;
        let tsRaw: number | null = null;
        if (redis) {
            try {
                if (view === 'card') {
                    [cachedCards, tsRaw] = await Promise.all([
                        redis.get<StoryCard[]>(CARDS_CACHE_KEY),
                        redis.get<number>(CACHE_KEY_TS),
                    ]);
                }
                if (!cachedCards?.length) {
                    cachedCards = null;
                    [cached, tsRaw] = await Promise.all([
                        redis.get<AggregatedStory[]>(CACHE_KEY),
                        redis.get<number>(CACHE_KEY_TS),
                    ]);
                }
            } catch (e) {
                console.error('Redis read failed:', e);
                // Non-fatal, just continue to fetch fresh
            }
        }

        const cacheAge = tsRaw ? (Date.now() - tsRaw) / 1000 : Infinity;
        const isStale = cacheAge > STALE_AFTER;

        if (cachedCards || (cached && cached.length > 0)) {
            // Recalculate timeAgo at serve time — prevents stale relative timestamps from Redis
            const data = cachedCards
                ? cachedCards.slice(0, limit).map(s => ({ ...s, timeAgo: getTimeAgo(s.publishedAt) }))
                : projectStories(cached!.map(s => ({ ...s, timeAgo: getTimeAgo(s.publishedAt) })), view, limit);
            // Instant delivery via Vercel Edge Cache
            res.setHeader('Cache-Control', LIST_CACHE_CONTROL);
            res.status(200).json({
                success: true,
                data,
                fromCache: true,
                stale: isStale,
                cacheAgeSeconds: Math.round(cacheAge),
            });

            if (isStale && redis) {
                // waitUntil keeps the function alive after the response is sent,
                // otherwise Vercel may freeze the instance mid-refresh.
                waitUntil(triggerStaleRefresh(redis, req));
            }
            return;
        }

        if (redis) {
            // Cache miss (Redis empty/expired or unreadable). Never make a visitor wait for the
            // full RSS + embeddings + LLM rebuild: serve the last durable snapshot from Postgres
            // (or an empty list) right away and rebuild in the background, like the stale path.
            console.log('Cache miss — serving archive snapshot and refreshing in background');
            waitUntil(triggerStaleRefresh(redis, req));

            let snapshot: AggregatedStory[] = [];
            try {
                snapshot = await withTimeout(loadRecentArchivedStories(MAX_LIST_LIMIT), ARCHIVE_FALLBACK_TIMEOUT_MS, 'Archive snapshot');
            } catch (e) {
                console.error('Archive snapshot read failed:', e);
            }
            const stories = sortByImportance(snapshot);

            res.setHeader('Cache-Control', stories.length > 0 ? FALLBACK_LIST_CACHE_CONTROL : NO_STORE);
            return res.status(200).json({
                success: true,
                data: projectStories(stories, view, limit),
                fromCache: false,
                fromArchive: stories.length > 0,
                stale: true,
                refreshing: true,
            });
        }

        // No Redis configured (local dev without Upstash): nothing could hold a background
        // rebuild, so build synchronously as before.
        console.log('No Redis — fetching fresh news synchronously');
        let allNews: RSSNewsItem[] = [];
        try {
            allNews = await fetchAllNews();
        } catch (e) {
            throw new Error(`fetchAllNews failed: ${e instanceof Error ? e.message : String(e)}`);
        }

        let aggregated: AggregatedStory[] = [];
        try {
            aggregated = await aggregateNewsBuildTopics(allNews, MIN_SOURCES_THRESHOLD);
        } catch (e) {
            throw new Error(`aggregateNewsBuildTopics failed: ${e instanceof Error ? e.message : String(e)}`);
        }

        // Fallback: if aggregation produced nothing but we have articles, show them individually
        if (aggregated.length === 0 && allNews.length > 0) {
            aggregated = await buildFallbackStories(allNews, limit);
        }

        res.setHeader('Cache-Control', aggregated.length === 0 ? NO_STORE : LIST_CACHE_CONTROL);
        return res.status(200).json({
            success: true,
            data: projectStories(aggregated, view, limit),
            fromCache: false,
            fetchedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error in news API:', error);
        const isDevelopment = process.env.NODE_ENV !== 'production';
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch news',
            ...(isDevelopment
                ? {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    name: error instanceof Error ? error.name : undefined,
                    stack: error instanceof Error ? error.stack : undefined,
                }
                : {}),
        });
    }
}
