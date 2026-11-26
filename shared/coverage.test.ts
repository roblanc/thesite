import { describe, expect, it } from 'vitest';
import {
    BIAS_SHARE_FULL_AT,
    biasShares,
    buildCoverageContext,
    computeBlindspot,
    coverageView,
    detectWireAttribution,
    groupReports,
    isNearDuplicate,
    markSyndicated,
    sideOfScore,
    summarizeCoverage,
    toPercentages,
    type CoverageContext,
    type CoverageItem,
} from './coverage';
import { getBiasScore } from './newsSources';

const LEAD_A = 'Guvernul a aprobat miercuri un memorandum privind finanțarea spitalelor regionale din Iași, Cluj și Craiova, cu o valoare totală de 2,3 miliarde de euro, potrivit comunicatului transmis după ședință.';
const LEAD_B = 'Ministrul Sănătății a prezentat la Timișoara noul program de screening pentru cancerul de col uterin, care va fi extins în toate județele până la sfârșitul anului viitor, a anunțat instituția.';

let n = 0;
function item(sourceId: string, over: Partial<CoverageItem> = {}): CoverageItem {
    n++;
    return {
        title: `Titlu diferit numărul ${n} pentru ${sourceId} despre alt unghi al subiectului`,
        description: `Descriere proprie ${n} scrisă de redacția ${sourceId} cu alte cuvinte și alt context ${n}.`,
        pubDate: new Date(Date.UTC(2026, 8, 30, 8, n)).toISOString(),
        link: `https://example.ro/${sourceId}/${n}`,
        source: { id: sourceId },
        ...over,
    };
}

const CONTEXT: CoverageContext = {
    articleShare: { left: 0.3, center: 0.4, right: 0.3 },
    feedHealth: { left: 1, center: 1, right: 1 },
};

describe('biasShares', () => {
    it('gives a centrist outlet nothing on either side', () => {
        for (const score of [-5, -2, 0, 3, 5]) {
            const s = biasShares(score);
            expect(s.left).toBe(0);
            expect(s.right).toBe(0);
            expect(s.center).toBe(1);
        }
    });

    it('counts the left/right categories entirely to their side', () => {
        expect(biasShares(-BIAS_SHARE_FULL_AT)).toEqual({ left: 1, center: 0, right: 0 });
        expect(biasShares(90)).toEqual({ left: 0, center: 0, right: 1 });
        expect(BIAS_SHARE_FULL_AT).toBe(55); // same as the "right" category threshold
    });

    it('is monotonic and continuous, and always sums to 1', () => {
        let prev = biasShares(-100);
        for (let score = -99; score <= 100; score++) {
            const s = biasShares(score);
            expect(s.left + s.center + s.right).toBeCloseTo(1, 10);
            expect(s.left).toBeLessThanOrEqual(prev.left);
            expect(s.right).toBeGreaterThanOrEqual(prev.right);
            expect(Math.abs(s.left - prev.left)).toBeLessThanOrEqual(0.021);
            expect(Math.abs(s.right - prev.right)).toBeLessThanOrEqual(0.021);
            prev = s;
        }
    });

    it('interpolates inside the centre-left/right band', () => {
        expect(biasShares(-25).left).toBeCloseTo(0.4);
        expect(biasShares(35).right).toBeCloseTo(0.6);
    });
});

describe('toPercentages', () => {
    it('returns integers summing to 100', () => {
        const p = toPercentages({ left: 1, center: 1, right: 1 });
        expect(p.left + p.center + p.right).toBe(100);
    });
});

describe('sideOfScore', () => {
    it('uses the category thresholds', () => {
        expect(sideOfScore(-20)).toBe('left');
        expect(sideOfScore(-19)).toBe('center');
        expect(sideOfScore(19)).toBe('center');
        expect(sideOfScore(20)).toBe('right');
    });
});

describe('bar', () => {
    it('shows an all-centre story as 100% centre (no leak)', () => {
        const summary = summarizeCoverage([item('agerpres'), item('cursdeguvernare'), item('rfi')]);
        expect(summary.bias).toEqual({ left: 0, center: 100, right: 0 });
    });

    it('weights each outlet by its score', () => {
        // criticatac -80 (full left), romaniatv 85 (full right), rfi 0 (centre)
        const summary = summarizeCoverage([item('criticatac'), item('romaniatv'), item('rfi')]);
        expect(summary.bias.left + summary.bias.center + summary.bias.right).toBe(100);
        expect(summary.bias.left).toBeGreaterThanOrEqual(33);
        expect(summary.bias.right).toBeGreaterThanOrEqual(33);
    });
});

describe('wire copies', () => {
    it('detects explicit agency credits but not photo credits', () => {
        expect(detectWireAttribution('Bucureşti, 30 sep /Agerpres/ - Guvernul a aprobat')).toBe('agerpres');
        expect(detectWireAttribution('Ceva s-a întâmplat (AGERPRES)')).toBe('agerpres');
        expect(detectWireAttribution('Sursa: News.ro')).toBe('newsro');
        expect(detectWireAttribution('informează Mediafax.')).toBe('mediafax');
        expect(detectWireAttribution('Foto: Agerpres')).toBeNull();
        expect(detectWireAttribution('Agerpres a publicat un raport anual')).toBeNull();
    });

    it('matches the same lead but not two reports that only share a quote', () => {
        expect(isNearDuplicate(item('digi24', { description: LEAD_A }), item('antena3', { description: LEAD_A }))).toBe(true);
        const quote = '„Nu vom vota niciun guvern până când nu se schimbă complet situația din Parlament și din țară”';
        expect(isNearDuplicate(
            item('digi24', { description: `Liderul partidului a declarat la Cotroceni: ${quote}` }),
            item('antena3', { description: `Într-o conferință de presă ținută seara, politicianul a spus ${quote}` }),
        )).toBe(false);
    });

    it('counts a republished agency text once, with the agency score', () => {
        const items = [
            item('newsro', { description: LEAD_A }),
            item('realitatea', { description: LEAD_A }),
            item('romaniatv', { description: LEAD_A }),
            item('hotnews', { description: LEAD_B }),
        ];
        const units = groupReports(items);
        expect(units).toHaveLength(2);
        const wire = units.find((u) => u.members.length === 3)!;
        expect(wire.agency).toBe('newsro');
        expect(wire.score).toBe(getBiasScore('newsro'));

        const marked = markSyndicated(items);
        expect(marked.map((i) => !!i.syndicated)).toEqual([false, true, true, false]);

        const summary = summarizeCoverage(items);
        expect(summary.outlets).toBe(4);
        expect(summary.independent).toBe(2);
        expect(summary.syndicatedOutlets).toBe(2);
        // Two realitatea/romaniatv copies no longer push the bar to the right.
        expect(summary.bias.right).toBe(0);
    });

    it('uses the earliest item as the original when no agency is known', () => {
        const items = [
            item('antena3', { description: LEAD_B, pubDate: '2026-09-30T10:00:00Z' }),
            item('hotnews', { description: LEAD_B, pubDate: '2026-09-30T09:00:00Z' }),
        ];
        const [unit] = groupReports(items);
        expect(unit.agency).toBeNull();
        expect(items[unit.original].source.id).toBe('hotnews');
        expect(markSyndicated(items).map((i) => !!i.syndicated)).toEqual([true, false]);
    });

    it('marks every copy when the credited agency is not in the story', () => {
        const items = [
            item('g4media', { description: `${LEAD_B} (AGERPRES)` }),
            item('hotnews', { description: 'Alt text, tot de la agenție. Sursa: Agerpres' }),
        ];
        const units = groupReports(items);
        expect(units).toHaveLength(1);
        expect(units[0].original).toBe(-1);
        expect(units[0].score).toBe(getBiasScore('agerpres'));
        expect(markSyndicated(items).every((i) => i.syndicated)).toBe(true);
    });

    it('counts two items from the same outlet once without calling either a copy', () => {
        const items = [item('mediafax'), item('mediafax')];
        expect(summarizeCoverage(items).independent).toBe(1);
        expect(markSyndicated(items).some((i) => i.syndicated)).toBe(false);
    });
});

describe('blindspot', () => {
    // right: realitatea, romaniatv, b1tv, cotidianul; centre: rfi, protv, tvr; left: hotnews, snoop, pressone
    const rightOnly = (nCenter: number) => [
        item('realitatea'), item('romaniatv'), item('b1tv'),
        ...['rfi', 'protv', 'tvr'].slice(0, nCenter).map((id) => item(id)),
    ];

    it('flags a side that is absent from a large enough story', () => {
        // n = 6: 0.7^6 = 0.118 <= 0.15
        expect(computeBlindspot(summarizeCoverage(rightOnly(3)), CONTEXT)).toBe('left');
    });

    it('needs more coverage when the absence could be chance', () => {
        // n = 5: 0.7^5 = 0.168 > 0.15
        expect(computeBlindspot(summarizeCoverage(rightOnly(2)), CONTEXT)).toBe('none');
        // A thinner left (10% of articles) needs much more coverage before silence counts.
        const thin = { ...CONTEXT, articleShare: { left: 0.1, center: 0.6, right: 0.3 } };
        expect(computeBlindspot(summarizeCoverage(rightOnly(3)), thin)).toBe('none');
    });

    it('does not flag small stories', () => {
        const items = [item('realitatea'), item('romaniatv'), item('b1tv')];
        expect(computeBlindspot(summarizeCoverage(items), { ...CONTEXT, articleShare: { left: 0.9, center: 0.05, right: 0.05 } })).toBe('none');
    });

    it('needs the other side to have covered it', () => {
        const items = [item('realitatea'), item('romaniatv'), item('rfi'), item('protv'), item('tvr'), item('biziday'), item('agerpres')];
        expect(computeBlindspot(summarizeCoverage(items), CONTEXT)).toBe('none');
    });

    it('does not call it ignored when a left outlet ran even a copy', () => {
        const items = [...rightOnly(3), item('hotnews', { description: 'Text de agenție. Sursa: Agerpres' })];
        expect(computeBlindspot(summarizeCoverage(items), CONTEXT)).toBe('none');
    });

    it('does not read broken feeds as an editorial choice', () => {
        const sick = { ...CONTEXT, feedHealth: { left: 0.4, center: 1, right: 1 } };
        expect(computeBlindspot(summarizeCoverage(rightOnly(3)), sick)).toBe('none');
    });

    it('flags the right symmetrically', () => {
        const items = [item('hotnews'), item('snoop'), item('pressone'), item('rfi'), item('protv'), item('tvr')];
        expect(computeBlindspot(summarizeCoverage(items), CONTEXT)).toBe('right');
    });
});

describe('buildCoverageContext', () => {
    it('measures article share and feed health per side', () => {
        const sources = [{ id: 'hotnews' }, { id: 'pressone' }, { id: 'rfi' }, { id: 'realitatea' }];
        const fetched = [{ source: { id: 'hotnews' } }, { source: { id: 'rfi' } }, { source: { id: 'rfi' } }, { source: { id: 'realitatea' } }];
        const ctx = buildCoverageContext(fetched, sources);
        expect(ctx.articleShare).toEqual({ left: 0.25, center: 0.5, right: 0.25 });
        expect(ctx.feedHealth).toEqual({ left: 0.5, center: 1, right: 1 });
    });
});

describe('coverageView', () => {
    it('uses the server figures when present', () => {
        const sources = [item('hotnews'), { ...item('realitatea'), syndicated: true }, item('rfi')];
        const view = coverageView({ sources, bias: { left: 10, center: 80, right: 10 }, independentCount: 2 });
        expect(view.bias).toEqual({ left: 10, center: 80, right: 10 });
        expect(view.independent).toBe(2);
        expect(view.syndicated).toEqual([false, true, false]);
        expect(view.outletsBySide).toEqual({ left: 1, center: 1, right: 1 });
    });

    it('trusts the bar of a listing card, which has no text to detect copies in', () => {
        const view = coverageView({ sources: [{ source: { id: 'hotnews' } }, { source: { id: 'realitatea' } }], bias: { left: 20, center: 50, right: 30 } });
        expect(view.bias).toEqual({ left: 20, center: 50, right: 30 });
        expect(view.independent).toBe(2);
        expect(view.outletsBySide).toEqual({ left: 1, center: 0, right: 1 });
    });

    it('recomputes for stories cached before the fields existed', () => {
        const sources = [item('newsro', { description: LEAD_A }), item('antena3', { description: LEAD_A })];
        const view = coverageView({ sources, bias: { left: 0, center: 20, right: 80 } });
        expect(view.independent).toBe(1);
        expect(view.bias).toEqual(summarizeCoverage(sources).bias);
        expect(view.syndicated).toEqual([false, true]);
    });
});
