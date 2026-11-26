import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useAggregatedNews } from "@/hooks/useNews";
import { 
  Copy, Check, RefreshCw, ArrowLeft, Layers, Sparkles, 
  Eye, BarChart3, MessageSquare, ChevronRight, Share2, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { getThumbnailUrl } from "@/utils/imageOptimizer";

type SlideType = 1 | 2 | 3 | 4 | 5;

export default function InstagramStudio() {
  const { data: stories, isLoading, refetch, isFetching } = useAggregatedNews("full");
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [activeSlide, setActiveSlide] = useState<SlideType>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const featuredStory = useMemo(() => {
    if (!stories || stories.length === 0) return null;
    return stories[selectedStoryIndex] || stories[0];
  }, [stories, selectedStoryIndex]);

  const left = Math.round(featuredStory?.bias?.left || 0);
  const center = Math.round(featuredStory?.bias?.center || 0);
  const right = Math.round(featuredStory?.bias?.right || 0);
  const totalSources = featuredStory?.sourcesCount || featuredStory?.sources?.length || 0;
  const blindspot = featuredStory?.blindspot;

  const leftSources = useMemo(() => (featuredStory?.sources || []).filter(s => {
    const b = (s.source?.bias || '').toLowerCase();
    return b.includes('left');
  }), [featuredStory]);

  const centerSources = useMemo(() => (featuredStory?.sources || []).filter(s => {
    const b = (s.source?.bias || '').toLowerCase();
    return b === 'center' || b === '' || (!b.includes('left') && !b.includes('right'));
  }), [featuredStory]);

  const rightSources = useMemo(() => (featuredStory?.sources || []).filter(s => {
    const b = (s.source?.bias || '').toLowerCase();
    return b.includes('right');
  }), [featuredStory]);

  const sampleLeft = leftSources[0] || { 
    source: { name: 'HotNews / PressOne', url: 'https://hotnews.ro', bias: 'center-left' }, 
    title: featuredStory?.title || 'Perspectiva orientată pe impact social și instituțional'
  };
  const sampleCenter = centerSources[0] || { 
    source: { name: 'ProTV / Digi24', url: 'https://digi24.ro', bias: 'center' }, 
    title: featuredStory?.title || 'Faptele prezentate echilibrat și declarațiile oficiale'
  };
  const sampleRight = rightSources[0] || { 
    source: { name: 'Realitatea Plus / România TV', url: 'https://realitatea.net', bias: 'right' }, 
    title: featuredStory?.title || 'Accent pe critica establishment-ului și discurs conservator'
  };

  const getDominantBadge = (story: any) => {
    if (!story) return 'Preluat de Centru';
    const l = Math.round(story.bias?.left || 0);
    const c = Math.round(story.bias?.center || 0);
    const r = Math.round(story.bias?.right || 0);
    const b = story.blindspot;

    if (b === 'left') return 'Punct Orb Stânga';
    if (b === 'right') return 'Punct Orb Dreapta';
    if (l > c && l > r) return 'Preluat de Stânga';
    if (r > c && r > l) return 'Preluat de Dreapta';
    return 'Preluat de Centru';
  };

  const copyCaption = (storyTitle: string, id: string) => {
    const caption = `thesite.ro ${storyTitle}. Vezi știrea din toate perspectivele pe thesite.ro.

📊 ${totalSources} publicații au acoperit subiectul:
• Stânga: ${left}%${blindspot === 'left' ? ' (Punct orb)' : ''}
• Centru: ${center}%
• Dreapta: ${right}%${blindspot === 'right' ? ' (Punct orb)' : ''}

👉 Glisează pentru a vedea cum diferă titlurile fiecărei publicații!

#stiri #romania #actualitate #groundnews #media #bias #presaromana #thesite`;
    navigator.clipboard.writeText(caption);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-[#f0f2f5] flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      <Helmet>
        <title>Instagram Carousel Studio & Design Lab | thesite.ro</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {/* Top Bar */}
      <header className="border-b border-white/10 bg-[#0d0f12]/90 backdrop-blur-xl sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
              src="/hero-illustration-headphones.webp" 
              alt="thesite.ro" 
              className="w-8 h-8 object-contain"
            />
            <span className="font-serif italic font-bold text-2xl text-white tracking-tight">thesite.ro</span>
            <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400 text-black px-2.5 py-0.5 font-mono">
              STUDIO CAROUSEL
            </span>
          </Link>
          <span className="hidden md:inline-block text-xs text-neutral-400 font-medium">
            | Previzualizare Carusel Instagram 1080×1350 (4:5)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="border-white/20 bg-white/5 hover:bg-white/10 text-white text-xs rounded-none font-bold gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Reîmprospătează Știrile
          </Button>
          <Link 
            to="/" 
            className="text-xs font-bold text-neutral-400 hover:text-white flex items-center gap-1 ml-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Înapoi pe Site
          </Link>
        </div>
      </header>

      <div className="max-w-[1600px] w-full mx-auto p-6 lg:p-10 space-y-16">

        {/* SECTION 1: INTERACTIVE CAROUSEL VIEWER */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_560px] gap-12 items-start border-b border-white/10 pb-16">
          
          {/* Left Column: Carousel Controls & Explanations */}
          <div className="space-y-8 pt-2">
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest border border-amber-400/40 bg-amber-400/10 text-amber-300 px-3 py-1 font-mono">
                LABORATOR DE DESIGN CAROUSEL
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/5 text-neutral-300 px-3 py-1 font-mono">
                FORMAT 4:5 PORTRAIT
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Design & Structură Carusele
              </h1>
              <p className="text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed">
                Aici poți previzualiza și testa toate slide-urile generate pentru postările automate pe Instagram. Alege un slide mai jos pentru a-i vedea compoziția grafică detaliată.
              </p>
            </div>

            {/* Slide Tabs Navigation */}
            <div className="space-y-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                Alege slide-ul din carusel:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { num: 1, label: "Copertă (Hero)", icon: Eye, desc: "Imagine, titlu & bară bias" },
                  { num: 2, label: "Titluri (Frame)", icon: Layers, desc: "Comparație Stânga/Centru/Dreapta" },
                  { num: 3, label: "Punctul Orb", icon: Compass, desc: "Unghiul ignorat & analiză" },
                  { num: 4, label: "Harta Surse", icon: BarChart3, desc: "Publicațiile implicate" },
                  { num: 5, label: "CTA / Final", icon: MessageSquare, desc: "Întrebare dezbatere & bio" },
                ].map(({ num, label, icon: Icon, desc }) => (
                  <button
                    key={num}
                    onClick={() => setActiveSlide(num as SlideType)}
                    className={`p-3.5 text-left flex flex-col justify-between border transition-all ${
                      activeSlide === num 
                        ? "border-amber-400 bg-amber-400/15 text-white shadow-lg shadow-amber-400/10" 
                        : "border-white/10 bg-white/[0.03] text-neutral-400 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-[10px] font-mono font-black uppercase text-amber-400">SLIDE {num}</span>
                      <Icon className="w-3.5 h-3.5 opacity-80" />
                    </div>
                    <span className="text-xs font-bold text-white block mb-0.5">{label}</span>
                    <span className="text-[10px] text-neutral-400 line-clamp-1 leading-tight">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Slide Information & Design Rationale */}
            <div className="p-5 border border-white/10 bg-white/[0.02] rounded-none space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono uppercase">
                <Sparkles className="w-4 h-4" />
                <span>Explicație Design • Slide {activeSlide}</span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                {activeSlide === 1 && "Slide 1 este primul contact vizual: imagine de impact, titlul mare lizibil la scroll rapid, sursele totale și distribuția politică pe cele 3 culori oficiale (Albastru, Alb, Roșu)."}
                {activeSlide === 2 && "Slide 2 aduce valoarea principală: pune față în față titlurile reale din presă cu favicon-urile publicațiilor (G4Media vs HotNews vs Antena3), demonstrând diferențele de încadrare."}
                {activeSlide === 3 && "Slide 3 evidențiază «Punctul Orb» (Blindspot): arată clar care spectru a ignorat subiectul sau distribuția procentuală detaliată a acoperirii mediatice."}
                {activeSlide === 4 && "Slide 4 arată ecosistemul complet al presei: lista tuturor ziarelor care au scris despre subiect, împărțite pe coloane de orientare politică."}
                {activeSlide === 5 && "Slide 5 stimulează engagement-ul: adresează o întrebare deschisă pentru secțiunea de comentarii («Tu pe cine crezi?») și invită utilizatorul să intre pe thesite.ro."}
              </p>

              {featuredStory && (
                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-neutral-400 truncate max-w-sm">
                    Știre selectată: <strong className="text-white">{featuredStory.title}</strong>
                  </span>
                  <button
                    onClick={() => copyCaption(featuredStory.title, featuredStory.id)}
                    className="bg-white text-black hover:bg-neutral-200 font-bold text-xs px-3 py-1.5 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedId === featuredStory.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === featuredStory.id ? "Copiat!" : "Copiază Caption"}
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Live 4:5 Phone / Instagram Canvas Container */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                CANVAS PREVIEW • SLIDE {activeSlide}/5
              </span>
              <span className="border border-white/20 bg-white/5 px-2 py-0.5 text-white">1080 × 1350 (4:5)</span>
            </div>

            {featuredStory && (
              <div className="w-full aspect-[4/5] bg-[#090a0f] rounded-none shadow-2xl overflow-hidden flex flex-col justify-between relative select-none border border-white/20">
                
                {/* ─── SLIDE 1: COPERTĂ CLASICĂ (HERO) ─── */}
                {activeSlide === 1 && (
                  <div className="w-full h-full flex flex-col justify-between relative bg-black">
                    <div className="relative flex-1 w-full overflow-hidden flex flex-col justify-between p-6">
                      <img 
                        src={getThumbnailUrl(featuredStory.image) || PLACEHOLDER_IMAGE} 
                        alt={featuredStory.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      
                      {/* Top Badges */}
                      <div className="relative z-20 flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#132238] text-white text-[11px] font-black uppercase tracking-wider px-3 py-1.5">
                            {totalSources} SURSE
                          </span>
                          <span className="bg-[#132238]/90 text-white text-[11px] font-bold px-3 py-1.5 backdrop-blur-sm">
                            {featuredStory.timeAgo || "acum 20 min"}
                          </span>
                        </div>

                        <span className="bg-white text-black text-[11px] font-bold px-3.5 py-1.5 shadow">
                          {getDominantBadge(featuredStory)}
                        </span>
                      </div>

                      {/* Title & Watermark */}
                      <div className="relative z-20 space-y-3 pt-12">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug tracking-tight drop-shadow-md">
                          {featuredStory.title}
                        </h2>
                        
                        <div className="inline-flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1 border border-white/20">
                          <img 
                            src="/hero-illustration-headphones.webp" 
                            alt="thesite.ro logo" 
                            className="w-4 h-4 object-contain"
                          />
                          <span className="text-xs font-bold text-white tracking-wide">
                            thesite.ro
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Proportional 3-Column Solid Bias Bar */}
                    <div className="flex w-full h-[95px] shrink-0 border-t border-black/30">
                      <div style={{ flexGrow: left || 1, minWidth: '15%' }} className="bg-[#28508a] text-white flex flex-col items-center justify-center p-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-90">STÂNGA</span>
                        <span className="text-2xl font-black">{left}%</span>
                      </div>
                      <div style={{ flexGrow: center || 1, minWidth: '15%' }} className="bg-white text-[#1f2937] flex flex-col items-center justify-center p-1.5 border-x border-black/10">
                        <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-80">CENTRU</span>
                        <span className="text-2xl font-black">{center}%</span>
                      </div>
                      <div style={{ flexGrow: right || 1, minWidth: '15%' }} className="bg-[#822727] text-white flex flex-col items-center justify-center p-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5 opacity-90">DREAPTA</span>
                        <span className="text-2xl font-black">{right}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── SLIDE 2: COMPARAȚIE TITLURI (HEAD-TO-HEAD) ─── */}
                {activeSlide === 2 && (
                  <div className="w-full h-full flex flex-col justify-between p-6 bg-[#fafafc] text-slate-900" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.11) 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }}>
                    <div className="flex items-center justify-between border-b border-black/10 pb-3">
                      <div className="flex items-center gap-2">
                        <img src="/hero-illustration-headphones.webp" alt="logo" className="w-6 h-6 object-contain" />
                        <span className="font-serif italic font-extrabold text-lg text-black">thesite.ro</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        PERSPECTIVE MEDIA • <span className="text-blue-600">02 / 03</span>
                      </span>
                    </div>

                    <div className="space-y-1 my-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-600 tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        COMPARAȚIE TITLURI
                      </div>
                      <h3 className="text-xl font-serif font-extrabold text-black leading-tight">
                        Același eveniment,<br/>
                        <span className="text-blue-600 italic">3 unghiuri diferite</span>
                      </h3>
                    </div>

                    {/* 3 Outlet Headline Cards */}
                    <div className="space-y-2.5 my-auto">
                      {/* Stânga */}
                      <div className="p-3.5 bg-white border border-black/10 rounded-xl relative overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between text-[11px] mb-2 relative z-10">
                          <span className="font-bold text-black flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-sky-900 text-sky-200 font-black flex items-center justify-center text-[10px]">G4</span>
                            {sampleLeft.source?.name || "Presa de Stânga"}
                          </span>
                          <span className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span> STÂNGA
                          </span>
                        </div>
                        <div className="flex gap-2.5 items-stretch relative z-10">
                          <div className="w-1 bg-blue-600 rounded-full shrink-0"></div>
                          <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                            „{sampleLeft.title}”
                          </p>
                        </div>
                      </div>

                      {/* Centru */}
                      <div className="p-3.5 bg-white border border-black/10 rounded-xl relative overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between text-[11px] mb-2 relative z-10">
                          <span className="font-bold text-black flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-rose-600 text-white font-black flex items-center justify-center text-[10px]">G</span>
                            {sampleCenter.source?.name || "Gazeta de Sud"}
                          </span>
                          <span className="text-[10px] font-black uppercase text-black flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-black"></span> CENTRU
                          </span>
                        </div>
                        <div className="flex gap-2.5 items-stretch relative z-10">
                          <div className="w-1 bg-black rounded-full shrink-0"></div>
                          <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                            „{sampleCenter.title}”
                          </p>
                        </div>
                      </div>

                      {/* Dreapta */}
                      <div className="p-3.5 bg-white border border-black/10 rounded-xl relative overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between text-[11px] mb-2 relative z-10">
                          <span className="font-bold text-black flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-black text-amber-400 font-black flex items-center justify-center text-[10px]">PS</span>
                            {sampleRight.source?.name || "PS News"}
                          </span>
                          <span className="text-[10px] font-black uppercase text-rose-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> DREAPTA
                          </span>
                        </div>
                        <div className="flex gap-2.5 items-stretch relative z-10">
                          <div className="w-1 bg-rose-600 rounded-full shrink-0"></div>
                          <p className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                            „{sampleRight.title}”
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-black/10 pt-3 flex items-center justify-between text-[11px] font-medium">
                      <span className="text-blue-600 underline">Vezi cum limbajul schimbă nuanța</span>
                      <span className="text-black font-bold flex items-center gap-1">Glisează ➔</span>
                    </div>
                  </div>
                )}

                {/* ─── SLIDE 3: PUNCTUL ORB / CTA ─── */}
                {activeSlide === 3 && (
                  <div className="w-full h-full flex flex-col justify-between p-6 bg-[#fafafc] text-slate-900 text-center" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.11) 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }}>
                    <div className="flex items-center justify-between border-b border-black/10 pb-3">
                      <div className="flex items-center gap-2">
                        <img src="/hero-illustration-headphones.webp" alt="logo" className="w-6 h-6 object-contain" />
                        <span className="font-serif italic font-extrabold text-lg text-black">thesite.ro</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        HARTA PRESEI • <span className="text-blue-600">03 / 03</span>
                      </span>
                    </div>

                    <div className="my-auto space-y-4">
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        DECIDE TU CE SĂ CREZI
                      </div>

                      <h3 className="text-2xl font-serif font-extrabold text-black leading-tight">
                        Ieși din bula <span className="text-blue-600 italic">de știri.</span>
                      </h3>

                      <p className="text-xs text-slate-600 max-w-[280px] mx-auto leading-relaxed">
                        Pe <strong>thesite.ro</strong> grupăm știrile pe subiecte, măsurăm distribuția politică și îți arătăm ce omit publicațiile tale preferate.
                      </p>

                      {/* 3 Solid Color Bars */}
                      <div className="flex w-full h-9 rounded-lg overflow-hidden shadow-sm border border-black/10">
                        <div className="bg-blue-600 text-white flex-1 flex items-center justify-center text-[10px] font-black tracking-wider">STÂNGA</div>
                        <div className="bg-black text-white flex-1 flex items-center justify-center text-[10px] font-black tracking-wider">CENTRU</div>
                        <div className="bg-rose-600 text-white flex-1 flex items-center justify-center text-[10px] font-black tracking-wider">DREAPTA</div>
                      </div>

                      <div className="bg-black text-white font-black text-xs py-3 px-6 rounded-xl inline-flex items-center gap-2 shadow-md">
                        <span>🔗 Link în bio: thesite.ro</span>
                      </div>
                    </div>

                    <div className="border-t border-black/10 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                      <span>© thesite.ro</span>
                      <span>@thesite.ro</span>
                    </div>
                  </div>
                )}

                {/* ─── SLIDE 4: HARTA ECOSISTEMULUI DE SURSE ─── */}
                {activeSlide === 4 && (
                  <div className="w-full h-full flex flex-col justify-between p-6 bg-[#090b0e]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-[11px] font-mono font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1">
                        HARTA SURSELOR
                      </span>
                      <span className="font-serif italic font-bold text-lg text-white">thesite.ro</span>
                    </div>

                    <div className="space-y-1 my-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-widest">TRANSPARENȚĂ TOTALĂ</span>
                      <h3 className="text-xl font-black text-white">Publicațiile care au relatat evenimentul:</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 my-auto">
                      {/* Stânga */}
                      <div className="space-y-2 p-3 bg-sky-950/20 border border-sky-500/30">
                        <span className="text-[10px] font-mono font-bold text-sky-300 uppercase block border-b border-sky-500/20 pb-1">STÂNGA</span>
                        <div className="space-y-1">
                          {leftSources.slice(0, 4).map((s, idx) => (
                            <div key={idx} className="text-[11px] text-neutral-300 font-medium truncate">
                              • {s.source?.name || "G4Media"}
                            </div>
                          ))}
                          {leftSources.length === 0 && <span className="text-[10px] text-neutral-500 italic">Fără acoperire</span>}
                        </div>
                      </div>

                      {/* Centru */}
                      <div className="space-y-2 p-3 bg-slate-900/40 border border-white/20">
                        <span className="text-[10px] font-mono font-bold text-slate-200 uppercase block border-b border-white/10 pb-1">CENTRU</span>
                        <div className="space-y-1">
                          {centerSources.slice(0, 4).map((s, idx) => (
                            <div key={idx} className="text-[11px] text-neutral-300 font-medium truncate">
                              • {s.source?.name || "HotNews"}
                            </div>
                          ))}
                          {centerSources.length === 0 && <span className="text-[10px] text-neutral-500 italic">Fără acoperire</span>}
                        </div>
                      </div>

                      {/* Dreapta */}
                      <div className="space-y-2 p-3 bg-rose-950/20 border border-rose-500/30">
                        <span className="text-[10px] font-mono font-bold text-rose-300 uppercase block border-b border-rose-500/20 pb-1">DREAPTA</span>
                        <div className="space-y-1">
                          {rightSources.slice(0, 4).map((s, idx) => (
                            <div key={idx} className="text-[11px] text-neutral-300 font-medium truncate">
                              • {s.source?.name || "Antena 3"}
                            </div>
                          ))}
                          {rightSources.length === 0 && <span className="text-[10px] text-neutral-500 italic">Fără acoperire</span>}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[11px] text-neutral-400 font-medium">
                      <span>Nicio știre nu e citită dintr-o singură sursă</span>
                      <span className="text-amber-400 font-bold">Concluzie ➔</span>
                    </div>
                  </div>
                )}

                {/* ─── SLIDE 5: CALL TO ACTION (CTA & DEZBATERE) ─── */}
                {activeSlide === 5 && (
                  <div className="w-full h-full flex flex-col justify-between p-6 bg-gradient-to-b from-[#111318] to-[#07080a] text-center">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 text-left">
                      <span className="font-serif italic font-bold text-xl text-white">thesite.ro</span>
                      <span className="text-[10px] font-mono font-bold uppercase bg-white/10 text-neutral-300 px-2.5 py-1">
                        AGREGATOR DE PERSPECTIVE
                      </span>
                    </div>

                    <div className="my-auto space-y-5 px-3">
                      <img 
                        src="/hero-illustration-headphones.webp" 
                        alt="thesite.ro icon" 
                        className="w-16 h-16 object-contain mx-auto drop-shadow-xl"
                      />

                      <div className="space-y-2">
                        <span className="text-[11px] font-mono font-black uppercase text-amber-400 tracking-widest">
                          TU DIN CE UNGHI VEZI LUCRURILE?
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                          Ieși din bula ta de informație.
                        </h3>
                      </div>

                      <p className="text-xs text-neutral-300 max-w-xs mx-auto leading-relaxed">
                        Pe <strong>thesite.ro</strong> compari știrile din România în câteva secunde, fără filtre politice ascunse.
                      </p>

                      <div className="inline-block bg-white text-black font-black text-xs px-6 py-3 shadow-xl">
                        🔗 LINK ÎN BIO: thesite.ro
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[11px] text-neutral-400 font-medium">
                      <span>Urmărește @thesite.ro</span>
                      <span className="text-white font-bold">Scrie-ți părerea 👇</span>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </section>


        {/* SECTION 2: SELECTEAZĂ O ALTĂ ȘTIRE DIN FEED PENTRU TESTARE */}
        <section className="space-y-6 border-b border-white/10 pb-16">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                PROBEAZĂ CU ORICE ȘTIRE
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Alege altă știre din feed-ul live
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase border border-white/20 bg-white/5 px-2.5 py-1 text-neutral-300">
              {stories?.length || 0} ȘTIRI DISPONIBILE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stories?.slice(0, 8).map((story, i) => {
              const isSelected = selectedStoryIndex === i;
              const l = Math.round(story.bias?.left || 0);
              const c = Math.round(story.bias?.center || 0);
              const r = Math.round(story.bias?.right || 0);

              return (
                <div 
                  key={story.id || i}
                  onClick={() => setSelectedStoryIndex(i)}
                  className={`w-full aspect-[4/5] bg-black rounded-none shadow-xl overflow-hidden flex flex-col justify-between relative cursor-pointer group transition-all border ${
                    isSelected ? "ring-2 ring-amber-400 border-amber-400" : "border-white/10 hover:border-white/40"
                  }`}
                >
                  <div className="relative flex-1 w-full overflow-hidden flex flex-col justify-between p-5">
                    <img 
                      src={getThumbnailUrl(story.image) || PLACEHOLDER_IMAGE} 
                      alt={story.title} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    
                    <div className="relative z-20 flex justify-between">
                      <span className="bg-[#132238] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1">
                        {story.mainCategory || "ACTUALITATE"}
                      </span>
                      <span className="bg-white text-black text-[9px] font-bold px-2.5 py-1">
                        {story.sourcesCount || 0} SURSE
                      </span>
                    </div>

                    <div className="relative z-20 space-y-1">
                      <h3 className="text-sm font-bold text-white line-clamp-3 leading-snug">
                        {story.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex w-full h-[65px] shrink-0 border-t border-black/20">
                    <div style={{ flexGrow: l || 1 }} className="bg-[#28508a] text-white flex flex-col items-center justify-center p-1">
                      <span className="text-[8px] font-bold uppercase">STÂNGA</span>
                      <span className="text-sm font-black">{l}%</span>
                    </div>
                    <div style={{ flexGrow: c || 1 }} className="bg-white text-[#1f2937] flex flex-col items-center justify-center p-1 border-x border-black/10">
                      <span className="text-[8px] font-bold uppercase">CENTRU</span>
                      <span className="text-sm font-black">{c}%</span>
                    </div>
                    <div style={{ flexGrow: r || 1 }} className="bg-[#822727] text-white flex flex-col items-center justify-center p-1">
                      <span className="text-[8px] font-bold uppercase">DREAPTA</span>
                      <span className="text-sm font-black">{r}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}

