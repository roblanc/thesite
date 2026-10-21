import { toStoryCard, type StoryCardInput } from '../../shared/storyCard.js';
import { storyRankScore } from '../../shared/coverage.js';

/**
 * Pure helpers for shaping /api/news responses (query parsing, projection, CDN headers).
 * Kept free of Redis/Vercel imports so they can be unit tested.
 */

export type NewsView = 'full' | 'card';

export const DEFAULT_LIST_LIMIT = 50;
/** The cron stores at most 100 stories, so larger limits only fragment the CDN cache. */
export const MAX_LIST_LIMIT = 100;

/**
 * Card projection of the whole feed, written by the cron next to the full `aggregated_news_v2`.
 * About a fifth of its size, so listing pages, the RSS feed, the sitemap and /api/status read
 * this one: every read counts against the Upstash free plan's 10 GB monthly bandwidth.
 */
export const CARDS_CACHE_KEY = 'aggregated_news_v2_cards';

/**
 * List responses: Redis is refreshed every 10–15 minutes, so a 5-minute edge cache keeps
 * new stories visible within ~5 minutes (plus one background revalidation) while most
 * visitors are served straight from the CDN.
 */
export const LIST_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=900';
/** Served from the Postgres snapshot while Redis is being rebuilt — keep it short-lived. */
export const FALLBACK_LIST_CACHE_CONTROL = 'public, s-maxage=30, stale-while-revalidate=60';
export const NO_STORE = 'no-store';

/** A story still in the live feed gains sources every cron run; older ones are frozen. */
export const LIVE_STORY_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=900';
export const ARCHIVED_STORY_CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';
const LIVE_STORY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // matches the cron's MAX_STORY_AGE_MS

type QueryValue = string | string[] | undefined;

function first(value: QueryValue): string | undefined {
    return Array.isArray(value) ? value[0] : value;
}

export function parseListQuery(query: Record<string, QueryValue>): { view: NewsView; limit: number } {
    const view: NewsView = first(query.view) === 'card' ? 'card' : 'full';
    const parsed = parseInt(first(query.limit) ?? '', 10);
    const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, MAX_LIST_LIMIT) : DEFAULT_LIST_LIMIT;
    return { view, limit };
}

export function projectStories<T extends StoryCardInput>(stories: T[], view: NewsView, limit: number) {
    const slice = stories.slice(0, limit);
    return view === 'card' ? slice.map(toStoryCard) : slice;
}

export function storyCacheControl(story: { publishedAt?: string }, servedFrom: 'redis' | 'db', now = Date.now()): string {
    if (servedFrom === 'db') return ARCHIVED_STORY_CACHE_CONTROL;
    const published = story.publishedAt ? Date.parse(story.publishedAt) : NaN;
    if (Number.isNaN(published) || now - published <= LIVE_STORY_WINDOW_MS) return LIVE_STORY_CACHE_CONTROL;
    return ARCHIVED_STORY_CACHE_CONTROL;
}

/**
 * Feed order: storyRankScore (independent reports^1.5 × e^(-hours/18)) — broader coverage and
 * fresher stories first. Shared by the cron (after merging) and the Postgres fallback in /api/news.
 */
export function sortByImportance<T extends { sourcesCount: number; independentCount?: number; publishedAt: string }>(stories: T[], now = Date.now()): T[] {
    return [...stories].sort((a, b) => storyRankScore(b, now) - storyRankScore(a, now));
}
