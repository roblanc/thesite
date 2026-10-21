import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import type { AggregatedStory } from './_lib/aggregation.js';
import { listArchivedStoriesForSitemap } from './_lib/storyArchive.js';
import { CARDS_CACHE_KEY } from './_lib/newsResponse.js';
import type { StoryCard } from '../shared/storyCard.js';
import { buildSitemapIndex, buildStorySitemap, type SitemapStory } from './_lib/sitemapXml.js';

/**
 * /sitemap.xml          -> sitemap index (this function, no query)
 * /sitemap-pages.xml    -> static file from scripts/generate-sitemap.js (fixed pages)
 * /sitemap-stories.xml  -> this function with ?type=stories: live stories from Redis plus the
 *                          permanent Postgres archive, so /stire/:id pages stay discoverable.
 */

const CACHE_KEY = 'aggregated_news_v2';
const ARCHIVE_LIMIT = 5000;

async function loadLiveStories(): Promise<SitemapStory[]> {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return [];
    try {
        const url = UPSTASH_REDIS_REST_URL.startsWith('http') ? UPSTASH_REDIS_REST_URL : `https://${UPSTASH_REDIS_REST_URL}`;
        const redis = new Redis({ url, token: UPSTASH_REDIS_REST_TOKEN });
        const stories = (await redis.get<StoryCard[]>(CARDS_CACHE_KEY))
            || (await redis.get<AggregatedStory[]>(CACHE_KEY))
            || [];
        return stories.map(s => ({ id: s.id, lastmod: s.publishedAt }));
    } catch (e) {
        console.error('[Sitemap API] Redis read failed:', e);
        return [];
    }
}

async function loadArchive(): Promise<SitemapStory[]> {
    try {
        return await listArchivedStoriesForSitemap(ARCHIVE_LIMIT);
    } catch (e) {
        console.error('[Sitemap API] Archive read failed:', e);
        return [];
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let xml: string;
    if (req.query.type === 'stories') {
        const [live, archived] = await Promise.all([loadLiveStories(), loadArchive()]);
        xml = buildStorySitemap([...live, ...archived]);
    } else {
        xml = buildSitemapIndex();
    }

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    if (req.method === 'HEAD') return res.status(200).end();
    res.status(200).send(xml);
}
