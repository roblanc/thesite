import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { setCorsHeaders } from './_lib/cors.js';
import { CARDS_CACHE_KEY } from './_lib/newsResponse.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const statusSecret = process.env.STATUS_SECRET || process.env.CRON_SECRET;
    if (process.env.NODE_ENV === 'production') {
        if (!statusSecret) {
            return res.status(503).json({ error: 'Status endpoint is disabled' });
        }
        if (req.headers.authorization !== `Bearer ${statusSecret}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }

    const out: Record<string, unknown> = {};

    // Vercel region
    out.region = process.env.VERCEL_REGION ?? process.env.AWS_REGION ?? 'unknown';

    // Redis
    try {
        let url = process.env.UPSTASH_REDIS_REST_URL!;
        if (url && !url.startsWith('http')) url = `https://${url}`;

        const redis = new Redis({
            url: url,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        });
        // The health check calls this hourly: count stories from the slim card copy, and fall
        // back to the full feed only if it is missing.
        const [cards, ts] = await Promise.all([
            redis.get<unknown[]>(CARDS_CACHE_KEY),
            redis.get<number>('aggregated_news_v2_ts'),
        ]);
        const cache = cards ?? await redis.get<unknown[]>('aggregated_news_v2');
        out.redis = {
            status: 'ok',
            hasCache: cache !== null,
            cacheItems: Array.isArray(cache) ? cache.length : 0,
            cacheAgeSeconds: ts ? Math.round((Date.now() - ts) / 1000) : null,
        };
    } catch (e) {
        out.redis = { status: 'error', message: String(e) };
    }

    // RSS direct fetch test (digi24)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const r = await fetch('https://www.digi24.ro/rss', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml',
            },
            signal: controller.signal as RequestInit['signal'],
        });
        clearTimeout(timeoutId);
        const body = await r.text();
        out.rss_digi24 = {
            status: r.ok ? 'ok' : 'http_error',
            httpStatus: r.status,
            isXML: body.trimStart().startsWith('<') && !body.toLowerCase().startsWith('<html'),
            bodyLength: body.length,
        };
    } catch (e) {
        out.rss_digi24 = { status: 'fetch_error', message: String(e) };
    }

    // RSS via allorigins.win
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const r = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://www.digi24.ro/rss'), {
            signal: controller.signal as RequestInit['signal'],
        });
        clearTimeout(timeoutId);
        const body = await r.text();
        out.rss_digi24_via_allorigins = {
            status: r.ok ? 'ok' : 'http_error',
            httpStatus: r.status,
            isXML: body.trimStart().startsWith('<') && !body.toLowerCase().startsWith('<html'),
            bodyLength: body.length,
        };
    } catch (e) {
        out.rss_digi24_via_allorigins = { status: 'fetch_error', message: String(e) };
    }

    return res.status(200).json(out);
}
