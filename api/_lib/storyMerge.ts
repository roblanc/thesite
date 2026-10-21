import { AggregatedStory, calculateBiasDistribution, calculateBlindspot, getTimeAgo } from './aggregation.js';
import { linkSet, matchStories } from './storyMatch.js';

/**
 * Merging a fresh aggregation run with the stories already in the cache.
 *
 * The previous rule ("same event if they share ≥1 source link", then re-add every
 * old source) let clusters snowball: a fresh cluster touching a big old one inherited
 * all of its sources, several fresh clusters could inherit the same old one, and after
 * two days a single "story" held 100+ articles about different events.
 *
 * Rules now:
 * - A fresh story matches an old one only on substantial link overlap, one-to-one
 *   (see ./storyMatch.ts).
 * - Only old sources published close to the fresh cluster's time window are re-added, and
 *   only for outlets the fresh cluster does not already have: one article per outlet.
 * - The matched story keeps its original id, so /stire/<id> links stay stable, and the
 *   earlier of the two start times, so its age does not reset when new articles join.
 */

const REATTACH_WINDOW_MS = 24 * 60 * 60 * 1000;

function timeOf(pubDate: string): number {
    const t = Date.parse(pubDate);
    return Number.isNaN(t) ? NaN : t;
}

function earlier(a: string | undefined, b: string): string {
    const ta = a ? timeOf(a) : NaN;
    const tb = timeOf(b);
    if (Number.isNaN(ta)) return b;
    if (Number.isNaN(tb)) return a!;
    return ta < tb ? a! : b;
}

function mergeSources(fresh: AggregatedStory, existing: AggregatedStory): AggregatedStory {
    const freshLinks = linkSet(fresh);
    const outlets = new Set(fresh.sources.map(s => s.source?.id));
    const freshTimes = fresh.sources.map(s => timeOf(s.pubDate)).filter(t => !Number.isNaN(t));
    const windowStart = freshTimes.length ? Math.min(...freshTimes) - REATTACH_WINDOW_MS : -Infinity;
    const windowEnd = freshTimes.length ? Math.max(...freshTimes) + REATTACH_WINDOW_MS : Infinity;

    const dropped = existing.sources.filter(s => {
        if (freshLinks.has(s.link)) return false;
        const outlet = s.source?.id;
        if (outlet !== undefined && outlets.has(outlet)) return false;
        const t = timeOf(s.pubDate);
        if (!Number.isNaN(t) && (t < windowStart || t > windowEnd)) return false;
        outlets.add(outlet);
        return true;
    });

    const sources = dropped.length ? [...fresh.sources, ...dropped] : fresh.sources;
    const bias = dropped.length ? calculateBiasDistribution(sources) : fresh.bias;
    const publishedAt = earlier(existing.publishedAt, fresh.publishedAt);
    return {
        ...fresh,
        id: existing.id,
        publishedAt,
        timeAgo: publishedAt === fresh.publishedAt ? fresh.timeAgo : getTimeAgo(publishedAt),
        sources,
        sourcesCount: sources.length,
        bias,
        blindspot: dropped.length ? calculateBlindspot(sources) : fresh.blindspot,
    };
}

export interface MergeResult {
    merged: AggregatedStory[];
    /** Old stories that no fresh story inherited and that share no link with the fresh run. */
    unmatched: AggregatedStory[];
}

export function mergeWithExisting(fresh: AggregatedStory[], existing: AggregatedStory[]): MergeResult {
    const freshToExisting = matchStories(fresh, existing);
    const takenExisting = new Set(freshToExisting.values());

    const usedIds = new Set<string>();
    const merged = fresh.map((story, f) => {
        const e = freshToExisting.get(f);
        const result = e === undefined ? story : mergeSources(story, existing[e]);
        // Guard against id collisions between a fresh id and an inherited one.
        let id = result.id;
        for (let n = 2; usedIds.has(id); n++) id = `${result.id}-${n}`;
        usedIds.add(id);
        return id === result.id ? result : { ...result, id };
    });

    const mergedLinks = new Set(merged.flatMap(s => s.sources.map(src => src.link)));
    const unmatched = existing.filter((story, e) =>
        !takenExisting.has(e) &&
        !usedIds.has(story.id) &&
        !story.sources.some(src => mergedLinks.has(src.link))
    );

    return { merged, unmatched };
}

/**
 * Stories whose `story:<id>` copy in Redis needs rewriting: new ones and ones whose content
 * changed since the previous run. timeAgo is ignored, since it changes every run and readers
 * recompute it. The rest keep the copy written earlier, whose 30-day TTL outlasts the 7 days a
 * story stays in the feed; rewriting all 100 every run cost a third of the Upstash bandwidth.
 */
export function storiesToArchive(stories: AggregatedStory[], previous: AggregatedStory[]): AggregatedStory[] {
    const before = new Map(previous.map(s => [s.id, archiveContent(s)]));
    return stories.filter(s => before.get(s.id) !== archiveContent(s));
}

function archiveContent({ timeAgo, ...content }: AggregatedStory): string {
    return JSON.stringify(content);
}
