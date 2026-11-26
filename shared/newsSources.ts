import { getFactuality } from './sourceFactuality.js';

export type SourceBias = 'left' | 'center-left' | 'center' | 'center-right' | 'right';
export type SourceFactuality = 'high' | 'mixed' | 'low';
export type SourceCategory = 'mainstream' | 'independent' | 'tabloid' | 'public';
export type BiasConfidence = 'high' | 'medium' | 'low';

/**
 * One row per outlet as it is written below. `biasScore` is the single source of truth for an
 * outlet's political placement, on the scale -100 (far left) … 0 (centre) … +100 (far right).
 *
 * - Outlets with a documented profile (src/data/sourceProfiles.ts, which holds the rationale)
 *   use the profile's researched score and confidence. The profile reads the score from here.
 * - Outlets without a profile got the representative score of the category they had before
 *   (left -70, center-left -35, center 0, center-right 35, right 70) and `biasConfidence: 'low'`.
 *   Puterea.ro is the one exception: its old custom weights (70% right, 25% centre) are kept by
 *   placing it at 55, the lowest score of the "right" category (71% right / 29% centre).
 *
 * `factuality` here is the older hand-set rating. It is only a fallback: see
 * `effectiveFactuality`, which prefers the evidence-based rating in shared/sourceFactuality.ts.
 */
export interface NewsSourceDefinition {
  id: string;
  name: string;
  url: string;
  rssUrl: string;
  logo?: string;
  biasScore: number;
  biasConfidence: BiasConfidence;
  factuality: SourceFactuality;
  category: SourceCategory;
}

export interface BaseNewsSource extends NewsSourceDefinition {
  /** Derived from `biasScore` with `scoreToBiasCategory`; kept for labels, filters and old clients. */
  bias: SourceBias;
}

export const NEWS_SOURCE_DEFINITIONS = [
  { id: 'agerpres', name: 'Agerpres', url: 'https://www.agerpres.ro', rssUrl: 'https://www.agerpres.ro/rss/economic', biasScore: 5, biasConfidence: 'high', factuality: 'high', category: 'public' },
  { id: 'mediafax', name: 'Mediafax', url: 'https://www.mediafax.ro', rssUrl: 'https://www.mediafax.ro/feed', biasScore: 10, biasConfidence: 'medium', factuality: 'high', category: 'mainstream' },
  { id: 'protv', name: 'ProTV', url: 'https://stirileprotv.ro', rssUrl: 'https://rss.stirileprotv.ro/', biasScore: -10, biasConfidence: 'high', factuality: 'high', category: 'mainstream' },
  { id: 'tvr', name: 'TVR', url: 'https://stiri.tvr.ro', rssUrl: 'https://stiri.tvr.ro/rss.xml', biasScore: 5, biasConfidence: 'medium', factuality: 'high', category: 'public' },
  { id: 'bursa', name: 'Bursa', url: 'https://www.bursa.ro', rssUrl: 'https://www.bursa.ro/rss', biasScore: 10, biasConfidence: 'medium', factuality: 'high', category: 'mainstream' },
  { id: 'biziday', name: 'Biziday', url: 'https://www.biziday.ro', rssUrl: 'https://www.biziday.ro/feed/', biasScore: 0, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'digi24', name: 'Digi24', url: 'https://www.digi24.ro', rssUrl: 'https://www.digi24.ro/rss', biasScore: 5, biasConfidence: 'high', factuality: 'high', category: 'mainstream' },
  { id: 'hotnews', name: 'HotNews', url: 'https://www.hotnews.ro', rssUrl: 'https://www.hotnews.ro/feed', biasScore: -20, biasConfidence: 'high', factuality: 'high', category: 'mainstream' },
  { id: 'recorder', name: 'Recorder', url: 'https://recorder.ro', rssUrl: 'https://recorder.ro/feed/', biasScore: -15, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'libertatea', name: 'Libertatea', url: 'https://www.libertatea.ro', rssUrl: 'https://www.libertatea.ro/rss', biasScore: -15, biasConfidence: 'medium', factuality: 'mixed', category: 'mainstream' },
  { id: 'adevarul', name: 'Adevărul', url: 'https://adevarul.ro', rssUrl: 'https://adevarul.ro/rss/', biasScore: 10, biasConfidence: 'medium', factuality: 'mixed', category: 'mainstream' },
  { id: 'newsweek', name: 'Newsweek România', url: 'https://newsweek.ro', rssUrl: 'https://newsweek.ro/rss', biasScore: 25, biasConfidence: 'high', factuality: 'high', category: 'mainstream' },
  { id: 'snoop', name: 'Snoop.ro', url: 'https://snoop.ro', rssUrl: 'https://snoop.ro/rss', biasScore: -25, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'spotmedia', name: 'Spotmedia', url: 'https://spotmedia.ro', rssUrl: 'https://spotmedia.ro/feed', biasScore: 5, biasConfidence: 'medium', factuality: 'high', category: 'independent' },
  { id: 'paginademedia', name: 'Pagina de Media', url: 'https://www.paginademedia.ro', rssUrl: 'https://www.paginademedia.ro/feed/', biasScore: 0, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'vice', name: 'Vice România', url: 'https://www.vice.com/ro', rssUrl: 'https://www.vice.com/ro/rss', biasScore: -35, biasConfidence: 'medium', factuality: 'mixed', category: 'independent' },
  { id: 'scena9', name: 'Scena9', url: 'https://www.scena9.ro', rssUrl: 'https://www.scena9.ro/feed', biasScore: -40, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'g4media', name: 'G4Media', url: 'https://www.g4media.ro', rssUrl: 'https://www.g4media.ro/feed', biasScore: 20, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'criticatac', name: 'CriticAtac', url: 'https://www.criticatac.ro', rssUrl: 'https://www.criticatac.ro/feed/', biasScore: -80, biasConfidence: 'high', factuality: 'mixed', category: 'independent' },
  { id: 'ziare', name: 'Ziare.com', url: 'https://www.ziare.com', rssUrl: 'https://www.ziare.com/rss/news.xml', biasScore: 10, biasConfidence: 'medium', factuality: 'mixed', category: 'mainstream' },
  { id: 'gandul', name: 'Gândul', url: 'https://www.gandul.ro', rssUrl: 'https://www.gandul.ro/rss', biasScore: 50, biasConfidence: 'high', factuality: 'mixed', category: 'mainstream' },
  { id: 'capital', name: 'Capital', url: 'https://www.capital.ro', rssUrl: 'https://www.capital.ro/feed/', biasScore: 35, biasConfidence: 'medium', factuality: 'mixed', category: 'mainstream' },
  { id: 'europafm', name: 'Europa FM', url: 'https://www.europafm.ro', rssUrl: 'https://www.europafm.ro/feed/', biasScore: 20, biasConfidence: 'medium', factuality: 'high', category: 'mainstream' },
  { id: 'profit', name: 'Profit.ro', url: 'https://www.profit.ro', rssUrl: 'https://www.profit.ro/rss', biasScore: 20, biasConfidence: 'high', factuality: 'high', category: 'mainstream' },
  { id: 'zf', name: 'Ziarul Financiar', url: 'https://www.zf.ro', rssUrl: 'https://www.zf.ro/rss', biasScore: 25, biasConfidence: 'high', factuality: 'high', category: 'mainstream' },
  { id: 'romanialibera', name: 'România Liberă', url: 'https://romanialibera.ro', rssUrl: 'https://romanialibera.ro/feed/', biasScore: 35, biasConfidence: 'medium', factuality: 'mixed', category: 'mainstream' },
  { id: 'observator', name: 'Observator', url: 'https://observatornews.ro', rssUrl: 'https://observatornews.ro/rss', biasScore: -5, biasConfidence: 'medium', factuality: 'mixed', category: 'mainstream' },
  { id: 'antena3', name: 'Antena 3', url: 'https://www.antena3.ro', rssUrl: 'https://www.antena3.ro/rss', biasScore: -25, biasConfidence: 'high', factuality: 'mixed', category: 'mainstream' },
  { id: 'romaniatv', name: 'România TV', url: 'https://www.romaniatv.net', rssUrl: 'https://www.romaniatv.net/feed', biasScore: 80, biasConfidence: 'high', factuality: 'low', category: 'mainstream' },
  { id: 'dcnews', name: 'DCNews', url: 'https://www.dcnews.ro', rssUrl: 'https://www.dcnews.ro/rss/', biasScore: -20, biasConfidence: 'medium', factuality: 'mixed', category: 'mainstream' },
  { id: 'flux24', name: 'Flux24', url: 'https://flux24.ro', rssUrl: 'https://flux24.ro/feed/', biasScore: 65, biasConfidence: 'medium', factuality: 'mixed', category: 'independent' },
  { id: 'activenews', name: 'ActiveNews', url: 'https://www.activenews.ro', rssUrl: 'https://www.activenews.ro/rss', biasScore: 85, biasConfidence: 'high', factuality: 'low', category: 'independent' },
  { id: 'epochtimes', name: 'Epoch Times România', url: 'https://epochtimes-romania.com', rssUrl: 'https://epochtimes-romania.com/feed/', biasScore: 30, biasConfidence: 'medium', factuality: 'mixed', category: 'independent' },
  { id: 'defapt', name: 'Defapt.ro', url: 'https://defapt.ro', rssUrl: 'https://defapt.ro/feed/', biasScore: 25, biasConfidence: 'medium', factuality: 'high', category: 'independent' },
  { id: 'catavencii', name: 'Cațavencii', url: 'https://www.catavencii.ro', rssUrl: 'https://www.catavencii.ro/feed/', biasScore: 0, biasConfidence: 'medium', factuality: 'mixed', category: 'independent' },
  { id: 'academiacatavencu', name: 'Academia Cațavencu', url: 'https://academiacatavencu.com', rssUrl: 'https://academiacatavencu.com/feed/', biasScore: 0, biasConfidence: 'low', factuality: 'mixed', category: 'independent' },
  { id: 'dailybusiness', name: 'Daily Business', url: 'https://www.dailybusiness.ro', rssUrl: 'https://www.dailybusiness.ro/feed/', biasScore: 20, biasConfidence: 'low', factuality: 'high', category: 'mainstream' },
  { id: 'wowbiz', name: 'WOWbiz', url: 'https://www.wowbiz.ro', rssUrl: 'https://www.wowbiz.ro/feed/', biasScore: 0, biasConfidence: 'medium', factuality: 'mixed', category: 'tabloid' },
  { id: 'actualitate', name: 'Actualitate.net', url: 'https://actualitate.net', rssUrl: 'https://actualitate.net/feed/', biasScore: 5, biasConfidence: 'low', factuality: 'mixed', category: 'independent' },
  { id: 'factual', name: 'Factual.ro', url: 'https://www.factual.ro', rssUrl: 'https://www.factual.ro/feed/', biasScore: 0, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'jurnalul', name: 'Jurnalul.ro', url: 'https://jurnalul.ro', rssUrl: 'https://jurnalul.ro/feed/', biasScore: -20, biasConfidence: 'medium', factuality: 'mixed', category: 'mainstream' },
  { id: 'realitatea', name: 'Realitatea Plus', url: 'https://www.realitatea.net', rssUrl: 'https://www.realitatea.net/rss', biasScore: 85, biasConfidence: 'high', factuality: 'low', category: 'mainstream' },
  { id: 'aktual24', name: 'Aktual24', url: 'https://www.aktual24.ro', rssUrl: 'https://www.aktual24.ro/feed/', biasScore: 20, biasConfidence: 'medium', factuality: 'mixed', category: 'independent' },
  { id: 'redactia', name: 'Redacția', url: 'https://redactia.ro', rssUrl: 'https://redactia.ro/feed/', biasScore: 0, biasConfidence: 'low', factuality: 'mixed', category: 'independent' },
  { id: 'b1tv', name: 'B1 TV', url: 'https://www.b1tv.ro', rssUrl: 'https://www.b1tv.ro/feed/', biasScore: 25, biasConfidence: 'medium', factuality: 'mixed', category: 'mainstream' },
  { id: 'cotidianul', name: 'Cotidianul', url: 'https://www.cotidianul.ro', rssUrl: 'https://www.cotidianul.ro/feed/', biasScore: 50, biasConfidence: 'medium', factuality: 'mixed', category: 'mainstream' },
  { id: 'comisarul', name: 'Comisarul.ro', url: 'https://www.comisarul.ro', rssUrl: 'https://www.comisarul.ro/feed/', biasScore: 35, biasConfidence: 'low', factuality: 'mixed', category: 'independent' },
  { id: 'metropolatv', name: 'Metropola TV', url: 'https://www.metropolatv.ro', rssUrl: 'https://www.metropolatv.ro/feed/', biasScore: 45, biasConfidence: 'medium', factuality: 'mixed', category: 'mainstream' },
  { id: 'romaniajournal', name: 'Romania Journal', url: 'https://www.romaniajournal.ro', rssUrl: 'https://www.romaniajournal.ro/feed/', biasScore: 0, biasConfidence: 'medium', factuality: 'high', category: 'independent' },
  { id: 'romaniainsider', name: 'Romania Insider', url: 'https://www.romania-insider.com', rssUrl: 'https://www.romania-insider.com/rss.xml', biasScore: 0, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'economedia', name: 'Economedia', url: 'https://economedia.ro', rssUrl: 'https://economedia.ro/feed', biasScore: 15, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'cursdeguvernare', name: 'Curs de Guvernare', url: 'https://cursdeguvernare.ro', rssUrl: 'https://cursdeguvernare.ro/feed', biasScore: 0, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'edupedu', name: 'Edupedu', url: 'https://www.edupedu.ro', rssUrl: 'https://www.edupedu.ro/feed/', biasScore: -10, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'rfi', name: 'RFI România', url: 'https://www.rfi.fr/ro', rssUrl: 'https://www.rfi.fr/ro/rss', biasScore: 0, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'alephnews', name: 'Aleph News', url: 'https://alephnews.ro', rssUrl: 'https://alephnews.ro/feed', biasScore: 5, biasConfidence: 'medium', factuality: 'high', category: 'mainstream' },
  { id: 'fanatik', name: 'Fanatik', url: 'https://www.fanatik.ro', rssUrl: 'https://www.fanatik.ro/feed', biasScore: 15, biasConfidence: 'medium', factuality: 'mixed', category: 'tabloid' },
  { id: 'cancan', name: 'Cancan', url: 'https://www.cancan.ro', rssUrl: 'https://www.cancan.ro/feed', biasScore: 15, biasConfidence: 'medium', factuality: 'low', category: 'tabloid' },
  { id: 'psnews', name: 'PS News', url: 'https://psnews.ro', rssUrl: 'https://psnews.ro/feed/', biasScore: 25, biasConfidence: 'low', factuality: 'mixed', category: 'independent' },
  { id: 'zdg', name: 'Ziarul de Gardă', url: 'https://www.zdg.md', rssUrl: 'https://www.zdg.md/feed/', biasScore: -15, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'riseproject', name: 'Rise Project', url: 'https://www.riseproject.ro', rssUrl: 'https://www.riseproject.ro/feed/', biasScore: -15, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'buletindebucuresti', name: 'Buletin de București', url: 'https://buletin.de/bucuresti', rssUrl: 'https://buletin.de/bucuresti/feed/', biasScore: -25, biasConfidence: 'medium', factuality: 'high', category: 'independent' },
  { id: 'ziaruldeiasi', name: 'Ziarul de Iași', url: 'https://www.ziaruldeiasi.ro', rssUrl: 'https://www.ziaruldeiasi.ro/rss', biasScore: 0, biasConfidence: 'medium', factuality: 'high', category: 'mainstream' },
  { id: 'kanald', name: 'Kanal D', url: 'https://www.stirilekanald.ro', rssUrl: 'https://www.stirilekanald.ro/feed', biasScore: 5, biasConfidence: 'low', factuality: 'mixed', category: 'mainstream' },
  // ── Adăugat 2026-03-28 ───────────────────────────────────────────────────
  { id: 'iamnews', name: 'IAMnews', url: 'https://iamnews.ro', rssUrl: 'https://iamnews.ro/rss/', biasScore: 10, biasConfidence: 'medium', factuality: 'mixed', category: 'mainstream' },
  { id: 'republica', name: 'Republica.ro', url: 'https://republica.ro', rssUrl: 'https://republica.ro/rss/', biasScore: 10, biasConfidence: 'medium', factuality: 'high', category: 'independent' },
  { id: 'investigatoria', name: 'Investigatoria', url: 'https://investigatoria.ro', rssUrl: 'https://investigatoria.ro/feed/', biasScore: -15, biasConfidence: 'medium', factuality: 'high', category: 'independent' },
  // ── Adăugat 2026-03 ──────────────────────────────────────────────────────
  { id: 'pressone', name: 'PressOne', url: 'https://pressone.ro', rssUrl: 'https://pressone.ro/feed/', biasScore: -30, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'europalibera', name: 'Europa Liberă România', url: 'https://romania.europalibera.org', rssUrl: 'https://romania.europalibera.org/api/zvo_mml-vomx-tpeukvm_', biasScore: -5, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'caleaeuropeana', name: 'Calea Europeană', url: 'https://www.caleaeuropeana.ro', rssUrl: 'https://www.caleaeuropeana.ro/feed/', biasScore: 0, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'juridice', name: 'Juridice.ro', url: 'https://juridice.ro', rssUrl: 'https://juridice.ro/feed/', biasScore: 0, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'dela0', name: 'Dela0', url: 'https://beta.dela0.ro', rssUrl: 'https://beta.dela0.ro/feed/', biasScore: -40, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'context', name: 'Context.ro', url: 'https://context.ro', rssUrl: 'https://context.ro/feed/', biasScore: -15, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'newsro', name: 'News.ro', url: 'https://www.news.ro', rssUrl: 'https://www.news.ro/rss', biasScore: -5, biasConfidence: 'high', factuality: 'high', category: 'mainstream' },
  { id: 'puterea', name: 'Puterea.ro', url: 'https://www.puterea.ro', rssUrl: 'https://www.puterea.ro/feed/', biasScore: 55, biasConfidence: 'medium', factuality: 'mixed', category: 'mainstream' },
  // ── Business/Analiză ────────────────────────────────────────────────────────
  { id: 'forbes', name: 'Forbes România', url: 'https://www.forbes.ro', rssUrl: 'https://www.forbes.ro/feed', biasScore: 25, biasConfidence: 'medium', factuality: 'high', category: 'mainstream' },
  { id: 'wallstreet', name: 'Wall-street.ro', url: 'https://www.wall-street.ro', rssUrl: 'https://www.wall-street.ro/feed', biasScore: 20, biasConfidence: 'medium', factuality: 'high', category: 'mainstream' },
  { id: 'contributors', name: 'Contributors.ro', url: 'https://www.contributors.ro', rssUrl: 'https://www.contributors.ro/feed', biasScore: 5, biasConfidence: 'medium', factuality: 'high', category: 'independent' },
  // ── Regional ────────────────────────────────────────────────────────────────
  { id: 'ziaruldecluj', name: 'Ziarul de Cluj', url: 'https://www.ziaruldecluj.ro', rssUrl: 'https://www.ziaruldecluj.ro/feed/', biasScore: 0, biasConfidence: 'low', factuality: 'high', category: 'mainstream' },
  { id: 'opiniatimisoarei', name: 'Opinia Timișoarei', url: 'https://www.opiniatimisoarei.ro', rssUrl: 'https://www.opiniatimisoarei.ro/feed/', biasScore: 0, biasConfidence: 'low', factuality: 'mixed', category: 'mainstream' },
  { id: 'monitorulsv', name: 'Monitorul de Suceava', url: 'https://www.monitorulsv.ro', rssUrl: 'https://www.monitorulsv.ro/feed/', biasScore: 0, biasConfidence: 'low', factuality: 'mixed', category: 'mainstream' },
  { id: 'cugetliber', name: 'Cuget Liber', url: 'https://www.cugetliber.ro', rssUrl: 'https://www.cugetliber.ro/feed/', biasScore: 0, biasConfidence: 'low', factuality: 'mixed', category: 'mainstream' },
  { id: 'bihoreanul', name: 'Bihoreanul', url: 'https://www.bihoreanul.ro', rssUrl: 'https://www.bihoreanul.ro/feed/', biasScore: 0, biasConfidence: 'low', factuality: 'mixed', category: 'mainstream' },
  { id: 'gds', name: 'Gazeta de Sud', url: 'https://www.gds.ro', rssUrl: 'https://www.gds.ro/feed/', biasScore: 0, biasConfidence: 'low', factuality: 'mixed', category: 'mainstream' },
  { id: 'infosudest', name: 'Info Sud-Est', url: 'https://www.info-sud-est.ro', rssUrl: 'https://www.info-sud-est.ro/feed/', biasScore: -15, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  // ── Analiză, Fact-checking & Presă Publică ─────────────────────────────────
  { id: 'panorama', name: 'Panorama', url: 'https://panorama.ro', rssUrl: 'https://panorama.ro/feed/', biasScore: 0, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'rra', name: 'Radio România Actualități', url: 'https://www.romania-actualitati.ro', rssUrl: 'https://www.romania-actualitati.ro/rss', biasScore: 2, biasConfidence: 'high', factuality: 'high', category: 'public' },
  { id: 'presshub', name: 'PressHub', url: 'https://presshub.ro', rssUrl: 'https://www.presshub.ro/feed/', biasScore: -8, biasConfidence: 'high', factuality: 'high', category: 'independent' },
  { id: 'misreport', name: 'Misreport', url: 'https://misreport.ro', rssUrl: 'https://misreport.substack.com/feed', biasScore: 0, biasConfidence: 'high', factuality: 'high', category: 'independent' },
] as const satisfies readonly NewsSourceDefinition[];

export type SourceId = (typeof NEWS_SOURCE_DEFINITIONS)[number]['id'];

/**
 * Category thresholds (unchanged from the source profiles):
 *   left ≤ -55 < center-left ≤ -20 < center ≤ 19 < center-right ≤ 54 < right
 */
export function scoreToBiasCategory(score: number): SourceBias {
  if (score <= -55) return 'left';
  if (score <= -20) return 'center-left';
  if (score <= 19) return 'center';
  if (score <= 54) return 'center-right';
  return 'right';
}

/** Evidence-based rating when there is evidence, otherwise the hand-set one. */
export function effectiveFactuality(source: Pick<NewsSourceDefinition, 'id' | 'factuality'>): SourceFactuality {
  const rating = getFactuality(source.id).rating;
  return rating === 'insufficient' ? source.factuality : rating;
}

export const NEWS_SOURCES_BASE: readonly BaseNewsSource[] = NEWS_SOURCE_DEFINITIONS.map((source) => ({
  ...source,
  bias: scoreToBiasCategory(source.biasScore),
  factuality: effectiveFactuality(source),
}));

const BIAS_SCORE_BY_ID = new Map<string, number>(NEWS_SOURCE_DEFINITIONS.map((s) => [s.id, s.biasScore]));

/** Score for a source id, or undefined for an id we do not know. */
export function getBiasScore(sourceId: string): number | undefined {
  return BIAS_SCORE_BY_ID.get(sourceId);
}
