import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { setCorsHeaders } from './_lib/cors.js';
import type { AggregatedStory } from './_lib/aggregation.js';
import { buildRssXml } from './_lib/rssFeed.js';
import { CARDS_CACHE_KEY } from './_lib/newsResponse.js';
import type { StoryCard } from '../shared/storyCard.js';

const CACHE_KEY = 'aggregated_news_v2';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') return res.status(200).end();
    // HEAD is allowed: feed readers and validators probe with it before fetching.
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let redis: Redis | null = null;
    try {
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            let url = process.env.UPSTASH_REDIS_REST_URL;
            if (!url.startsWith('http')) url = `https://${url}`;
            redis = new Redis({ url, token: process.env.UPSTASH_REDIS_REST_TOKEN });
        }
    } catch (e) {
        console.error('[RSS Feed] Redis init failed:', e);
    }

    let stories: Array<AggregatedStory | StoryCard> = [];
    if (redis) {
        try {
            stories = (await redis.get<StoryCard[]>(CARDS_CACHE_KEY))
                || (await redis.get<AggregatedStory[]>(CACHE_KEY))
                || [];
        } catch (e) {
            console.error('[RSS Feed] Redis read failed:', e);
        }
    }

    const rssXml = buildRssXml(stories);

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
    if (req.method === 'HEAD') return res.status(200).end();
    res.status(200).send(rssXml);
}
