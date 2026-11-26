import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpenText,
  Building2,
  ChevronLeft,
  CircleAlert,
  FileSearch,
  Filter,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SourceFavicon } from '@/components/SourceFavicon';
import { SOURCE_CATALOG } from '@/data/sourceCatalog';
import { getMissingProfileIds, scoreToBiasCategory } from '@/data/sourceProfiles';
import type { NewsSource } from '@/types/news';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type BiasFilter = 'all' | 'left' | 'center-left' | 'center' | 'center-right' | 'right';

type FilterOption = {
  value: BiasFilter;
  label: string;
  shortLabel?: string;
};

const BIAS_FILTERS: FilterOption[] = [
  { value: 'all', label: 'Toate', shortLabel: 'Toate' },
  { value: 'left', label: 'Stânga', shortLabel: 'S' },
  { value: 'center-left', label: 'Centru-Stânga', shortLabel: 'CS' },
  { value: 'center', label: 'Centru', shortLabel: 'C' },
  { value: 'center-right', label: 'Centru-Dreapta', shortLabel: 'CD' },
  { value: 'right', label: 'Dreapta', shortLabel: 'D' },
];

const biasLabelMap: Record<Exclude<BiasFilter, 'all'>, string> = {
  left: 'Stânga',
  'center-left': 'Centru-Stânga',
  center: 'Centru',
  'center-right': 'Centru-Dreapta',
  right: 'Dreapta',
};

const biasClassMap: Record<Exclude<BiasFilter, 'all'>, string> = {
  left: 'bg-blue-100 text-blue-700 border-blue-200',
  'center-left': 'bg-sky-100 text-sky-700 border-sky-200',
  center: 'bg-slate-100 text-slate-700 border-slate-200',
  'center-right': 'bg-orange-100 text-orange-700 border-orange-200',
  right: 'bg-red-100 text-red-700 border-red-200',
};

const SOURCE_CATEGORY_LABELS: Record<NewsSource['category'], string> = {
  mainstream: 'Mainstream',
  independent: 'Independentă',
  tabloid: 'Tabloid',
  public: 'Publică',
};

const factualityLabelMap: Record<NewsSource['factuality'], string> = {
  high: 'Factualitate ridicată',
  mixed: 'Factualitate mixtă',
  low: 'Factualitate scăzută',
  insufficient: 'Date insuficiente',
};

const factualityClassMap: Record<NewsSource['factuality'], string> = {
  high: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  mixed: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-rose-100 text-rose-700 border-rose-200',
  insufficient: 'bg-slate-100 text-slate-600 border-slate-200',
};

const confidenceLabelMap = {
  high: 'ridicată',
  medium: 'medie',
  low: 'scăzută',
} as const;

const BIAS_GUIDE = [
  {
    key: 'left',
    label: 'Stânga',
    range: '≤ -55',
    description: 'Orientare asumată de stânga, anticapitalistă sau puternic progresistă.',
  },
  {
    key: 'center-left',
    label: 'Centru-Stânga',
    range: '-54 → -20',
    description: 'Linie moderat progresistă, civic-socială sau apropiată de zona social-democrată.',
  },
  {
    key: 'center',
    label: 'Centru',
    range: '-19 → +19',
    description: 'Acoperire factuală, agenții de presă sau investigații fără agendă de partid.',
  },
  {
    key: 'center-right',
    label: 'Centru-Dreapta',
    range: '+20 → +54',
    description: 'Perspectivă liberală, pro-piață, pro-business sau moderat conservatoare.',
  },
  {
    key: 'right',
    label: 'Dreapta',
    range: '≥ +55',
    description: 'Orientare conservatoare dură, naționalistă, suveranistă sau anti-establishment.',
  },
] as const;

const CRITERIA_CARDS = [
  {
    icon: BookOpenText,
    title: 'Linia editorială',
    description: 'Analizăm tonul predominant, selecția subiectelor și modul de încadrare pe termen lung.',
  },
  {
    icon: Building2,
    title: 'Structura de proprietate',
    description: 'Documentăm proprietarii, finanțarea și conexiunile care pot influența linia editorială.',
  },
  {
    icon: ShieldCheck,
    title: 'Validare externă',
    description: 'Corelăm observațiile noastre cu rapoarte, arhive și evaluări externe de factualitate.',
  },
] as const;

function formatDateLabel(value?: string) {
  if (!value) return 'Dată necunoscută';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function summarize(text: string | undefined, maxLength: number) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export default function Sources() {
  const [search, setSearch] = useState('');
  const [biasFilter, setBiasFilter] = useState<BiasFilter>('all');

  const sourcesWithProfiles = useMemo(
    () =>
      SOURCE_CATALOG
        .filter((source) => source.profile)
        .sort((a, b) => (a.profile!.biasScore - b.profile!.biasScore)),
    [],
  );

  const missingProfileIds = useMemo(
    () => getMissingProfileIds(SOURCE_CATALOG.map((source) => source.id)),
    [],
  );

  const biasCounts = useMemo(
    () =>
      sourcesWithProfiles.reduce(
        (acc, source) => {
          const category = scoreToBiasCategory(source.profile!.biasScore);
          acc[category] += 1;
          return acc;
        },
        {
          left: 0,
          'center-left': 0,
          center: 0,
          'center-right': 0,
          right: 0,
        } satisfies Record<Exclude<BiasFilter, 'all'>, number>,
      ),
    [sourcesWithProfiles],
  );

  const filteredSources = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sourcesWithProfiles.filter((source) => {
      const profile = source.profile!;
      const profileBias = scoreToBiasCategory(profile.biasScore);

      if (biasFilter !== 'all' && profileBias !== biasFilter) {
        return false;
      }

      if (!query) return true;

      return [
        source.name,
        source.id,
        source.url,
        SOURCE_CATEGORY_LABELS[source.category],
        factualityLabelMap[source.factuality],
        profile.currentOwner,
        profile.parentCompany,
        profile.editorialLine,
        profile.biasRationale,
        profile.lastAnalysed,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [biasFilter, search, sourcesWithProfiles]);

  const activeFilterMeta = BIAS_FILTERS.find((filter) => filter.value === biasFilter);
  const hasActiveFilters = search.trim().length > 0 || biasFilter !== 'all';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto w-full max-w-[1240px] px-4 py-6 md:px-6 md:py-10">
        <div className="space-y-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Înapoi la știri
          </Link>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <div className="space-y-5">
              <Badge variant="outline" className="gap-2 border-border/60 bg-background px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <FileSearch className="h-3.5 w-3.5" />
                Audit editorial
              </Badge>

              <div className="space-y-4">
                <h1 className="max-w-3xl font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                  Surse și raționamente de bias, într-un format mai ușor de citit.
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                  Aici vezi cine deține o publicație, ce linie editorială are și de ce îi atribuim un anumit scor de bias.
                  Ideea nu este să etichetăm agresiv sursele, ci să îți oferim context înainte să le compari.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="rounded-full px-5">
                  <a href="#catalog">Vezi catalogul surselor</a>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-5">
                  <a href="#metodologie">Cum citim scorurile</a>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="surface-subtle rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Profiluri</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{sourcesWithProfiles.length}</p>
                  <p className="mt-1 text-sm text-muted-foreground">surse documentate complet</p>
                </div>
                <div className="surface-subtle rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Bias track</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">{BIAS_GUIDE.length}</p>
                  <p className="mt-1 text-sm text-muted-foreground">zone de clasificare editorială</p>
                </div>
                <div className="surface-subtle rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Ritm review</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">Trim.</p>
                  <p className="mt-1 text-sm text-muted-foreground">revizuire periodică a profilurilor</p>
                </div>
              </div>
            </div>

            <Card className="overflow-hidden bg-card/95">
              <CardContent className="p-5">
                <div className="space-y-5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Panou rapid</p>
                    <h2 className="text-lg font-semibold text-foreground">Distribuția surselor documentate</h2>
                  </div>

                  <div className="space-y-3">
                    {BIAS_FILTERS.filter((filter) => filter.value !== 'all').map((filter) => {
                      const value = biasCounts[filter.value as Exclude<BiasFilter, 'all'>];
                      const total = sourcesWithProfiles.length || 1;
                      return (
                        <div key={filter.value} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-foreground">{filter.label}</span>
                            <span className="text-muted-foreground">
                              {value} / {sourcesWithProfiles.length}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                filter.value === 'left' && 'bg-blue-500',
                                filter.value === 'center-left' && 'bg-sky-500',
                                filter.value === 'center' && 'bg-slate-500',
                                filter.value === 'center-right' && 'bg-orange-500',
                                filter.value === 'right' && 'bg-red-500',
                              )}
                              style={{ width: `${(value / total) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="surface-tint-amber rounded-2xl p-4 text-sm text-amber-900">
                    <div className="flex items-start gap-3">
                      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium">Cum să citești pagina</p>
                        <p className="text-amber-800/90">
                          Începe cu catalogul, apoi deschide profilul complet doar pentru sursele pe care vrei să le verifici în detaliu.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {missingProfileIds.length > 0 && (
            <section className="surface-tint-amber rounded-2xl p-4 md:p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-900">Mai există surse fără profil complet</p>
                  <p className="text-sm text-amber-800/90">
                    Completează `NEW_SOURCE_TEMPLATE` înainte să le tratezi drept surse documentate în interfață.
                  </p>
                </div>
                <p className="text-xs text-amber-800/80 md:max-w-[40ch]">{missingProfileIds.join(', ')}</p>
              </div>
            </section>
          )}

          <section
            id="catalog"
            className="surface-panel scroll-mt-24 rounded-[28px] bg-card/95 p-5 md:p-6"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Catalog</p>
                  <h2 className="font-serif text-3xl font-bold text-foreground">Găsește rapid sursa pe care vrei s-o verifici</h2>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Filtrează după orientare, caută după proprietar sau URL și intră în profil doar când ai nevoie de tot contextul.
                  </p>
                </div>

                <div className="surface-subtle rounded-2xl px-4 py-3 text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Rezultate curente</p>
                  <p className="mt-1 font-medium text-foreground">
                    {filteredSources.length} surse pentru{' '}
                    <span className="text-muted-foreground">
                      {biasFilter === 'all' ? 'toate orientările' : activeFilterMeta?.label.toLowerCase()}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Caută după sursă, proprietar, URL sau raționament"
                    placeholder="Caută după sursă, proprietar, URL sau raționament"
                    className="surface-subtle h-12 rounded-full border-0 pl-11 pr-12 text-sm shadow-none placeholder:text-muted-foreground/60 md:text-base"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label="Șterge căutarea"
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="justify-start rounded-full px-4 xl:justify-center"
                    onClick={() => {
                      setSearch('');
                      setBiasFilter('all');
                    }}
                  >
                    Resetează filtrele
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Filtre de bias">
                {BIAS_FILTERS.map((filter) => {
                  const count =
                    filter.value === 'all'
                      ? sourcesWithProfiles.length
                      : biasCounts[filter.value as Exclude<BiasFilter, 'all'>];

                  return (
                    <button
                      key={filter.value}
                      type="button"
                      aria-pressed={biasFilter === filter.value}
                      onClick={() => setBiasFilter(filter.value)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-colors',
                        biasFilter === filter.value
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-transparent bg-background/65 text-muted-foreground hover:bg-background/90 hover:text-foreground',
                      )}
                    >
                      <span>{filter.label}</span>
                      <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] leading-none text-inherit">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredSources.length === 0 ? (
                <div className="surface-ghost rounded-3xl px-6 py-16 text-center">
                  <p className="text-lg font-medium text-foreground">Nicio sursă nu corespunde filtrelor curente.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Încearcă alt termen de căutare sau revino la filtrul „Toate”.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredSources.map((source) => {
                    const profile = source.profile!;
                    const biasCategory = scoreToBiasCategory(profile.biasScore);
                    const owner = profile.currentOwner || profile.parentCompany || 'Proprietar nedocumentat';
                    const summary = summarize(profile.editorialLine, 160);
                    const rationale = summarize(profile.biasRationale, 140);

                    return (
                      <Link
                        key={source.id}
                        to={`/surse/${source.id}`}
                        className="group surface-panel flex h-full flex-col rounded-[24px] bg-background/70 p-5 transition-all hover:-translate-y-1 hover:bg-background/95"
                      >
                        <div className="flex items-start gap-4">
                          <SourceFavicon source={{ name: source.name, url: source.url, bias: source.bias }} size="lg" />

                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-start gap-2">
                              <h3 className="min-w-0 flex-1 text-lg font-semibold leading-tight text-foreground">
                                {source.name}
                              </h3>
                              <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]', biasClassMap[biasCategory])}>
                                {biasLabelMap[biasCategory]}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <span className="surface-subtle rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                                {SOURCE_CATEGORY_LABELS[source.category]}
                              </span>
                              <span className={cn('rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em]', factualityClassMap[source.factuality])}>
                                {factualityLabelMap[source.factuality]}
                              </span>
                              <span className="surface-subtle rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                                Încredere {confidenceLabelMap[profile.confidence]}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                          <div className="surface-subtle rounded-2xl p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Proprietar</p>
                            <p className="mt-2 leading-relaxed text-foreground">{owner}</p>
                          </div>
                          <div className="surface-subtle rounded-2xl p-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Ultima analiză</p>
                            <p className="mt-2 leading-relaxed text-foreground">{formatDateLabel(profile.lastAnalysed)}</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          <div className="surface-subtle rounded-2xl p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Linie editorială</p>
                            <p className="mt-2 text-sm leading-relaxed text-foreground">{summary}</p>
                          </div>
                          <div className="surface-subtle rounded-2xl p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">De ce primește acest scor</p>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{rationale}</p>
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between border-t border-border/35 pt-4">
                          <span className="min-w-0 truncate pr-4 text-xs text-muted-foreground">
                            {source.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-foreground">
                            Vezi profilul
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section
            id="metodologie"
            className="surface-panel scroll-mt-24 rounded-[28px] bg-card/95 p-5 md:p-6"
          >
            <div className="space-y-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Metodologie</p>
                  <h2 className="font-serif text-3xl font-bold text-foreground">Cum clasificăm bias-ul editorial</h2>
                  <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    Scorul reflectă profilul editorial al publicației, nu verdictul nostru despre calitatea jurnalistică.
                    Folosește-l ca instrument de orientare atunci când compari mai multe surse pe aceeași știre.
                  </p>
                </div>

                <Badge variant="outline" className="w-fit gap-2 border-border/60 bg-background px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  Actualizare periodică
                </Badge>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <Card className="shadow-none">
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-foreground">Scala de clasificare</h3>
                        <p className="text-sm text-muted-foreground">
                          Cele 5 zone de bias provin din scorul numeric dintre -100 și +100.
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        {BIAS_GUIDE.map((item) => (
                          <div
                            key={item.key}
                            className={cn(
                              'surface-subtle rounded-2xl p-4',
                              biasClassMap[item.key],
                            )}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em]">{item.range}</p>
                            <p className="mt-2 text-sm font-semibold">{item.label}</p>
                            <p className="mt-2 text-xs leading-relaxed">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-none">
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-foreground">Ce intră în scor</h3>
                        <p className="text-sm text-muted-foreground">
                          Nu luăm decizia după un singur articol, ci după contextul editorial al sursei.
                        </p>
                      </div>

                      <div className="space-y-3">
                        {CRITERIA_CARDS.map((item) => (
                          <div key={item.title} className="surface-subtle rounded-2xl p-4">
                            <div className="flex items-start gap-3">
                              <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <div>
                                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Accordion type="multiple" className="surface-subtle rounded-[24px] bg-background/70 px-5">
                <AccordionItem value="weights" className="border-border/60">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex items-center gap-3">
                      <SlidersHorizontal className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Cum traducem bias-ul într-o distribuție pe știre</p>
                        <p className="text-xs font-normal text-muted-foreground">Ponderăm fiecare sursă în axele Stânga · Centru · Dreapta</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="surface-subtle rounded-2xl p-4">
                        <p className="font-medium text-foreground">Exemplu de mapare</p>
                        <ul className="mt-3 space-y-2">
                          <li>Stânga → 100% Stânga</li>
                          <li>Centru-Stânga → 60% Stânga, 40% Centru</li>
                          <li>Centru → 100% Centru</li>
                          <li>Centru-Dreapta → 40% Centru, 60% Dreapta</li>
                          <li>Dreapta → 100% Dreapta</li>
                        </ul>
                      </div>
                      <div className="surface-subtle rounded-2xl p-4">
                        <p className="font-medium text-foreground">Cum citești rezultatul</p>
                        <p className="mt-3 leading-relaxed">
                          Dacă o știre are 40% Stânga, 27% Centru și 33% Dreapta, înseamnă că sursele care au acoperit-o
                          se distribuie relativ echilibrat, dar cu o ușoară greutate spre zona progresistă.
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="updates" className="border-border/60">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Filter className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Ce revizuim periodic</p>
                        <p className="text-xs font-normal text-muted-foreground">Scorul poate evolua dacă se schimbă proprietatea sau tonul editorial</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    <div className="surface-subtle rounded-2xl p-4 leading-relaxed">
                      Reevaluăm periodic proprietatea, sursele de finanțare, conexiunile politice și tiparele editoriale.
                      Dacă o publicație își schimbă direcția sau conducerea, profilul ei trebuie actualizat — scorul nu este permanent.
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="disclaimer" className="border-0">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <div className="flex items-center gap-3">
                      <CircleAlert className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Ce nu înseamnă „bias”</p>
                        <p className="text-xs font-normal text-muted-foreground">Nu confundăm orientarea editorială cu lipsa de calitate jurnalistică</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    <div className="surface-subtle rounded-2xl p-4 leading-relaxed">
                      O sursă clasificată la „stânga” sau „dreapta” poate publica jurnalism foarte bun. Scopul acestei pagini este
                      să îți dea context despre poziționarea sursei, nu să o excludă automat din analiză.
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
