/**
 * PROFILURI SURSE DE ȘTIRI ROMÂNEȘTI
 * ====================================
 * Fiecare sursă are documentație detaliată: fondatori, proprietari, conexiuni politice,
 * interese financiare, linie editorială și RAȚIONAMENTUL din spate pentru scorul de bias.
 *
 * Scor bias: -100 (extremă stânga) → 0 (centru) → +100 (extremă dreapta)
 * Categorii derivate din scor:
 *   left:         ≤ -55
 *   center-left:  -54 → -20
 *   center:       -19 → +19
 *   center-right: +20 → +54
 *   right:        ≥ +55
 *
 * SCORUL NUMERIC ȘI ÎNCREDEREA NU MAI STAU AICI: sunt în shared/newsSources.ts (`biasScore`,
 * `biasConfidence`), sursa unică folosită și de server pentru bara de acoperire. Profilurile de
 * mai jos păstrează raționamentul; `SOURCE_PROFILES` le completează cu scorul din shared.
 * Când se adaugă o sursă nouă în shared/newsSources.ts, adaugă aici textul profilului
 * folosind template-ul NEW_SOURCE_TEMPLATE de la sfârșitul fișierului.
 */
import { NEWS_SOURCE_DEFINITIONS, scoreToBiasCategory as sharedScoreToBiasCategory } from '../../shared/newsSources';

export interface SourceProfile {
  id: string;

  // --- Identitate & Istoric ---
  foundedYear?: number;
  founders?: string[];
  currentOwner?: string;
  parentCompany?: string;
  /** Descriere narativă a istoricului proprietății */
  ownershipHistory?: string;

  // --- Context Politic & Financiar ---
  /** Conexiuni cunoscute cu actori politici sau instituții */
  politicalConnections?: string[];
  /** Interese financiare/de business care pot influența editorial */
  knownFinancialInterests?: string[];
  /** Sursele de finanțare ale publicației */
  fundingSources?: string[];

  // --- Analiză Editorială ---
  /** Descriere generală a liniei editoriale */
  editorialLine: string;
  /** RAȚIONAMENTUL principal pentru scorul de bias atribuit */
  biasRationale: string;
  /** Tipare editoriale observabile în acoperirea știrilor */
  notablePatterns?: string[];
  /** Controverse documentate */
  controversies?: string[];
  /** Puncte forte ale publicației */
  strengths?: string[];

  // --- Scor & Metadate ---
  /**
   * Scor numeric de bias: -100 (extremă stânga) → 0 (centru) → +100 (extremă dreapta)
   * Acesta este scorul nuanțat; categoria (left/center-left/etc.) se derivă automat.
   */
  biasScore: number;
  /** Raționament pentru scorul de factualitate */
  factualityRationale?: string;
  /** Cât de siguri suntem de această analiză */
  confidence: 'high' | 'medium' | 'low';
  /** Data ultimei analize/actualizări a profilului */
  lastAnalysed: string;

  // --- Referinte ---
  /** Surse externe folosite pentru analiza acestui profil */
  references?: Array<{ label: string; url: string }>;
}

/** Profile text as written in this file; score and confidence come from shared/newsSources.ts. */
type SourceProfileText = Omit<SourceProfile, 'biasScore' | 'confidence'>;

// ============================================================
//  PROFILURI COMPLETE PENTRU TOATE SURSELE DIN shared/newsSources.ts
// ============================================================

const PROFILE_TEXTS: Record<string, SourceProfileText> = {

  // ===================== CENTRU / AGENȚII =====================

  agerpres: {
    id: 'agerpres',
    foundedYear: 1949,
    founders: ['Statul Român'],
    currentOwner: 'Statul Român',
    parentCompany: 'Agenția Națională de Presă Agerpres',
    ownershipHistory:
      'Fondată în 1949 ca agenție națională de presă. Funcționează în baza Legii nr. 19/2003. Finanțată integral de la bugetul de stat.',
    politicalConnections: [
      'Finanțare bugetară → vulnerabilitate indirectă față de guvernul în funcție',
      'Conducere numită politic',
    ],
    fundingSources: ['Buget de stat', 'Vânzare flux de știri (B2B)'],
    editorialLine:
      'Agenție de presă cu rol de serviciu public. Știri factuale în format telegrafic, fără linie editorială explicită. Acoperire națională și internațională cuprinzătoare.',
    biasRationale:
      'Ca agenție de stat, Agerpres menține o relativă neutralitate editorială — nu are proprietari privați cu interese politice directe. Riscul principal este influența indirectă a guvernului prin finanțare și numiri în conducere, dar în practică conținutul este predominant factual și echilibrat. Ușoară tendință pro-instituțională derivată din natura sa de stat.',
    notablePatterns: [
      'Știri în format telegrafic, fără editorial',
      'Acoperire prioritară a instituțiilor statului',
      'Sursă primară citată de alte publicații',
    ],
    strengths: ['Factualitate ridicată', 'Acoperire comprehensivă', 'Credibilitate instituțională'],
    factualityRationale: 'Agenție cu standarde jurnalistice ridicate și verificare riguroasă a faptelor.',
    lastAnalysed: '2026-02-26',
  },

  mediafax: {
    id: 'mediafax',
    foundedYear: 1991,
    currentOwner: 'Titluri Quality SRL (Radu Budeanu) — din ianuarie 2025',
    parentCompany: 'Titluri Quality (include Gândul, Cancan, ProSport, G4Media)',
    ownershipHistory:
      'Una dintre primele agenții de presă private din România post-comunistă, fondată în 1991 de Adrian Sârbu. După insolvență și administrarea prin Mediamex Investment (Dan Șucu / Adrian Sârbu), brandul Mediafax, site-ul și fluxul de știri au fost achiziționate în ianuarie 2025 de Titluri Quality SRL (deținută de Radu Budeanu).',
    fundingSources: ['Abonamente B2B', 'Publicitate'],
    editorialLine:
      'Agenție de presă privată cu focus pe știri politice, economice și generale. Format predominant factual orientat spre clienți media și corporate.',
    biasRationale:
      'Ca agenție de presă cu model B2B, fluxul de știri rămâne în mare parte factual și centrist. Preluarea din ianuarie 2025 de către Titluri Quality (Radu Budeanu, proprietarul Gândul și Cancan) justifică monitorizarea și un ușor scor pozitiv în zona de centru (+10), fără a indica un partizanat editorial explicit pe fluxul de agenție.',
    strengths: ['Viteza știrilor', 'Acoperire economică', 'Format factual'],
    factualityRationale: 'Agenție cu tradiție și standarde profesionale ridicate.',
    lastAnalysed: '2026-11-26',
  },

  bursa: {
    id: 'bursa',
    foundedYear: 1990,
    currentOwner: 'Grupul de Presă Bursa (Meta Ring SRL)',
    ownershipHistory:
      'Una dintre cele mai vechi publicații economice private din România, fondată în 1990 și editată prin Grupul de Presă Bursa (Meta Ring SRL).',
    fundingSources: ['Publicitate', 'Abonamente'],
    editorialLine:
      'Publicație economică axată pe piețe financiare, bursă, economie macro și micro.',
    biasRationale:
      'Publicație economică fără afiliere de partid evidentă. Acoperirea orientată spre piața de capital și mediul de afaceri implică o ușoară tendință pro-piață liberă (+10), rămânând în zona de centru.',
    strengths: ['Specialitate financiară', 'Tradiție îndelungată', 'Date de piață'],
    factualityRationale: 'Factualitate ridicată în domeniul financiar.',
    lastAnalysed: '2026-11-26',
  },

  biziday: {
    id: 'biziday',
    foundedYear: 2016,
    founders: ['Moise Guran'],
    currentOwner: 'Moise Guran (independent)',
    ownershipHistory:
      'Lansat în 2016 ca aplicație și platformă de agregare/curatorie de știri de către jurnalistul Moise Guran, după o carieră îndelungată în televiziune și radio (TVR, Digi24, Europa FM).',
    fundingSources: ['Publicitate', 'Proiecte editoriale'],
    editorialLine:
      'Platformă și aplicație de știri scurte, verificate și agregate zilnic, cu accent pe actualitate internă, economie și externe.',
    biasRationale:
      'Biziday funcționează ca o redacție de sinteză și curatorie rapidă, fără agendă de partid. Titlurile și selecția editorială sunt orientate spre claritate și informație factuală, plasând publicația în centrul spectrului (0).',
    strengths: ['Independență editorială', 'Sinteză rapidă', 'Standarde bune de verificare'],
    factualityRationale: 'Factualitate bună prin selecția și verificarea surselor primare.',
    lastAnalysed: '2026-11-26',
  },

  // ===================== TV & RADIO MAINSTREAM =====================

  protv: {
    id: 'protv',
    foundedYear: 1995,
    founders: ['Adrian Sârbu', 'Mark Grabowski', 'CME (Central European Media Enterprises)'],
    currentOwner: 'PPF Group (Republica Cehă)',
    parentCompany: 'PPF Media / CME',
    ownershipHistory:
      'Fondat în 1995 ca parte a CME (Central European Media Enterprises). Cel mai urmărit post TV din România. PPF Group, fondat de miliardarul ceh Petr Kellner (decedat 2021), a achiziționat CME în 2020.',
    politicalConnections: [
      'PPF Group — grup ceh, fără afiliații politice românești directe',
    ],
    fundingSources: ['Publicitate', 'Abonamente cablu/satelit'],
    editorialLine:
      'Televiziune comercială mainstream. Jurnalism profesionist, standarde ridicate de producție. Acoperire echilibrată, orientată spre audiență largă.',
    biasRationale:
      'ProTV beneficiază de proprietar străin (PPF Group ceh), ceea ce reduce semnificativ riscul de influență politică locală. Prezintă jurnalism relativ echilibrat, orientat spre profesionalism și rating. Nu există afilieri politice românești evidente. Ușoară tendință centrist-progresistă specifică televiziunilor comerciale cu audiență largă.',
    notablePatterns: [
      'Format occidental de știri',
      'Producție de înaltă calitate',
      'Echilibru în acoperirea politicii',
    ],
    strengths: ['Profesionalism', 'Resurse de producție', 'Credibilitate publică'],
    factualityRationale: 'Standarde jurnalistice profesioniste. Factualitate ridicată.',
    lastAnalysed: '2026-02-26',
  },

  tvr: {
    id: 'tvr',
    foundedYear: 1956,
    founders: ['Statul Român'],
    currentOwner: 'Societatea Română de Televiziune (SRTV)',
    ownershipHistory:
      'Televiziune publică înființată în 1956. Funcționează în baza Legii SRTV. Finanțată din taxa audiovizuală și buget de stat.',
    politicalConnections: [
      'Consiliu de Administrație numit de Parlament → expusă presiunilor majorității parlamentare',
      'Finanțare parțial bugetară',
    ],
    fundingSources: ['Taxa audiovizuală', 'Buget de stat', 'Publicitate (limitată)'],
    editorialLine:
      'Televiziune publică cu misiune de serviciu public. Teoretic neutră și echilibrată, cu mandat de informare obiectivă.',
    biasRationale:
      'TVR este formal neutră, dar cronic vulnerabilă la influența politică prin modul de numire a conducerii (Parlament). De-a lungul timpului linia editorială a reflectat culoarea politică a majorității parlamentare. Riscul de bias depinde de perioadă și de conducerea în funcție.',
    controversies: [
      'Numiri politizate ale conducerii în diverse perioade',
      'Acuzații de partinitate în funcție de guvernul în funcție',
      'Subfinanțare cronică',
    ],
    notablePatterns: [
      'Acoperire extinsă de protocol a evenimentelor oficiale',
      'Spațiu redus pentru investigații',
    ],
    factualityRationale: 'Factualitate relativ bună, constrânsă uneori de influența politică.',
    lastAnalysed: '2026-02-26',
  },

  europafm: {
    id: 'europafm',
    foundedYear: 1990,
    currentOwner: 'Czech Media Invest (controlat de Daniel Křetínský)',
    parentCompany: 'Czech Media Invest (CMI)',
    ownershipHistory:
      'Post de radio comercial cu acoperire națională. A fost deținut de grupul francez Lagardère Active. În 2018, operațiunile radio din România (Europa FM, Virgin Radio, Vibe FM) au fost vândute către Czech Media Invest (CMI), unul dintre cei mai mari operatori media din Cehia, controlat de omul de afaceri Daniel Křetínský.',
    politicalConnections: [
      'Daniel Křetínský — grup media ceh, fără afilieri politice românești directe',
      'Structura de proprietate documentată în presa economică și media de specialitate',
    ],
    fundingSources: ['Publicitate', 'Sponsorizări'],
    editorialLine:
      'Post de radio comercial cu muzică, știri și talk-show-uri politice. Emisiuni precum „România în direct" și „Piața Victoriei" pun accent pe dezbatere și opinii ale moderatorilor și invitaților. Prezentatori cu opinii puternice, mai ales în segmentele de dezbatere.',
    biasRationale:
      'În analiza noastră, Europa FM tinde spre o orientare centru-dreapta, vizibilă în modul în care sunt abordate temele politice în talk-show-uri: pro-economie de piață, pro-UE, accent pe responsabilitate individuală și critică la adresa politicilor etatiste sau populiste. Conținutul de știri este, în general, mai echilibrat decât segmentele de opinie. Această încadrare este o estimare editorială proprie și nu reflectă o declarație oficială a postului. Nu există o clasificare MBFC sau similară disponibilă.',
    notablePatterns: [
      'Emisiuni de dezbatere cu opinii puternice ale moderatorilor',
      'Combinație de muzică, infotainment și știri',
      'Cel mai ascultat radio privat din România',
    ],
    strengths: ['Audiență mare', 'Jurnaliști profesioniști', 'Proprietar internațional fără influență politică locală'],
    factualityRationale: 'Factualitate relativ ridicată pentru conținutul de știri. Nu sunt cazuri notorii de fake news. Segmentele de opinie conțin interpretări subiective — normal pentru formatul talk-show.',
    lastAnalysed: '2026-02-27',
    references: [
      { label: 'Europa FM – Site oficial / Grila de programe', url: 'https://www.europafm.ro/live/' },
      { label: 'Europa FM – Emisiunea „România în direct"', url: 'https://www.europafm.ro/category/programe/romania-in-direct/' },
      { label: 'Ziarul Financiar – Vânzarea Europa FM către Czech Media Invest', url: 'https://www.zf.ro/eveniment/postul-de-radio-europa-fm-va-avea-un-nou-proprietar-gigantul-media-francez-lagardere-vinde-radio-urile-detinute-in-europa-de-est-inclusiv-din-romania-catre-czech-media-invest-17133379' },
      { label: 'Czech Media Invest – Comunicat oficial achiziție Lagardère', url: 'https://www.czechmediainvest.cz/en/press-releases/cmi-has-completed-the-acquisition-of-lagardere-radios/' },
      { label: 'G4Media – Profil investitori CMI / Daniel Křetínský', url: 'https://www.g4media.ro/cine-sunt-investitorii-care-cumpara-posturile-europa-fm-virgin-radio-si-vibe-fm.html' },
      { label: 'Pagina de Media – Acționari posturi radio România', url: 'https://www.paginademedia.ro/stiri-media/actionari-posturi-radio-romania-20895178' },
      { label: 'Wikipedia – Europa FM (Romania)', url: 'https://en.wikipedia.org/wiki/Europa_FM_(Romania)' },
    ],
  },

  // ===================== MAINSTREAM, INVESTIGAȚII & CENTRU-STÂNGA =====================

  digi24: {
    id: 'digi24',
    foundedYear: 2012,
    founders: ['RCS&RDS (acum Digi Communications N.V.)'],
    currentOwner: 'Zoltán Teszári (indirect, prin grupul Digi Communications N.V. / Campus Media TV SRL)',
    parentCompany: 'Digi Communications N.V. / Campus Media TV SRL',
    ownershipHistory:
      'Lansat la 1 martie 2012 ca parte a grupului RCS&RDS, principal operator de telecomunicații din România, controlat de Zoltán Teszári. În 2019, proprietatea Digi24 a fost transferată către Campus Media TV SRL, pentru a permite distribuția și la alți operatori, nu doar în rețeaua Digi. Controlul rămâne legat de grupul Digi și de Teszári.',
    politicalConnections: [
      'Zoltán Teszári — nu are afiliere publică declarată la un partid politic, dar interesele sale de business în telecom intersectează agenda politică (reglementare ANCOM, legislație telecom)',
      'Ca televiziune comercială, Digi24 a vândut spații de publicitate și către partide politice, similar altor televiziuni de știri',
      'Amendamente PSD din 2022 au vizat forțarea separării Digi24 de RCS&RDS',
    ],
    fundingSources: ['Publicitate (inclusiv publicitate politică de campanie)', 'Distribuție în pachetele Digi', 'Proiecte speciale'],
    editorialLine:
      'Canal de știri TV 24/7, cu acoperire națională și focus pe actualitate politică, economică și internațională. Include jurnale de știri, talk-show-uri, analize și relatări live, cu un profil mainstream pro-european și instituțional.',
    biasRationale:
      'Digi24 este evaluat de Media Bias/Fact Check ca „Least Biased” (centru) cu factualitate ridicată. În peisajul românesc, postul menține o linie mainstream pro-europeană, pro-business și instituțională, fiind criticat periodic din opoziție pentru o atitudine relativ acomodantă față de coalițiile de guvernare (în special zona PNL/establishment). Clasificarea anterioară de centru-stânga nu era susținută de conținut: scorul de +5 reflectă o poziționare de centru.',
    notablePatterns: [
      'Acoperire extinsă a UE și politicii externe, inclusiv dezbateri pe teme europene',
      'Dezbateri cu invitați din mai multe zone politice, cu ton mainstream și instituțional',
      'Format de știri 24/7 cu accent pe breaking news și declarații oficiale',
    ],
    controversies: [
      'Amendamente PSD (2022) vizând forțarea vânzării Digi24 de către RCS&RDS',
      'Acuzații periodice de apropiere de pozițiile guvernării în funcție și de publicitate politică netransparentă',
      'Interesele Digi în telecom pot influența acoperirea subiectelor legate de reglementare',
    ],
    strengths: [
      'Profesionalism editorial și producție TV bine standardizată',
      'Acoperire cuprinzătoare a politicii interne și externe, inclusiv live-uri extinse',
      'Percepție relativ bună de echilibru comparativ cu alte posturi de știri românești',
    ],
    factualityRationale: 'Factualitate ridicată: acoperire live extinsă, utilizează agenții de presă și corespondenți, nu este cunoscut pentru dezinformare sistematică. Evaluări independente (MBFC, Reuters Institute) îl menționează ca brand relativ de încredere.',
    lastAnalysed: '2026-11-26',
    references: [
      { label: 'Wikipedia – Digi24', url: 'https://en.wikipedia.org/wiki/Digi24' },
      { label: 'Eurotopics – Fișă Digi24 (proprietate, Campus Media TV SRL)', url: 'https://www.eurotopics.net/en/163061/digi-24' },
      { label: 'MediaBiasFactCheck – Digi24 (least biased, high factuality)', url: 'https://mediabiasfactcheck.com/digi24-bias/' },
      { label: 'Economedia – PSD vizează ruperea Digi24 de RCS&RDS', url: 'https://economedia.ro/psd-vizeaza-ruperea-digi24-de-rcsrds-un-amendament-depus-de-ministrul-lucian-romascanu-ar-forta-compania-condusa-de-zoltan-teszari-sa-vanda-televiziunea-digi24-cablistii-cu-pozitie-dominanta-pe-pi.html' },
      { label: 'CMPF/EUI – Media Freedom in Romania (context publicitate politică)', url: 'https://cmpf.eui.eu/local-media-for-democracy-research-results/local-media-for-democracy-country-focus-romania/' },
      { label: 'Digi Communications – Despre noi', url: 'https://www.digi-communications.ro/ro/despre-noi' },
    ],
  },

  hotnews: {
    id: 'hotnews',
    foundedYear: 1999,
    founders: ['Ionel Mărgărit Timbolschi', 'Manuela Preoteasa'],
    currentOwner: 'ZYX Publishing Group (Dragoș Vîlcu 66%, Pluralis B.V. / MDIF 17%, Răzvan Ionescu 15%)',
    parentCompany: 'ZYX Publishing Group / Media Bit Software SRL',
    ownershipHistory:
      'Unul dintre primele portaluri de știri online din România (fondat în 1999, operat istoric prin Media Bit Software SRL). În septembrie 2022 a fost achiziționat integral de grupul controlat de Dragoș Vîlcu (Multimedia Est / ZYX Publishing Group). În 2026, fondul olandez Pluralis B.V. (administrat de MDIF pentru susținerea presei independente) a intrat în acționariat cu 17%. HotNews nu a aparținut niciodată trustului Ringier.',
    politicalConnections: [
      'Acționariat privat românesc și fond internațional de investiții media (Pluralis / MDIF), fără afiliere la un partid politic',
    ],
    fundingSources: ['Publicitate', 'Investiții de capital (ZYX / Pluralis)', 'Contribuții cititori'],
    editorialLine:
      'Site de știri online de referință. Acoperire extinsă a politicii, economiei, societății și investigațiilor de interes public, cu ton pro-european și civic.',
    biasRationale:
      'Media Bias/Fact Check încadrează HotNews.ro la „Left-Center” (centru-stânga) cu factualitate ridicată, iar euro|topics îl descrie ca independent și formal neutru. Tendința ușoară de centru-stânga (-20, exact la limita cu centrul) se manifestă prin selecția subiectelor civice, sociale și anti-corupție, cu un editorial echilibrat în știrile curente.',
    strengths: ['Experiență îndelungată', 'Jurnaliști de calitate', 'Acoperire comprehensivă și investigații'],
    factualityRationale: 'Factualitate ridicată (confirmată de Media Bias/Fact Check). Standarde profesioniste.',
    lastAnalysed: '2026-11-26',
  },

  recorder: {
    id: 'recorder',
    foundedYear: 2017,
    founders: ['Cristian Delcea', 'Mihai Voinea', 'Răzvan Ionescu', 'Iulian Andrei Crăciun'],
    currentOwner: 'Asociația Recorder Community (ONG de presă independentă)',
    ownershipHistory:
      'Fondat în 2017 de jurnaliștii Cristian Delcea, Mihai Voinea, Răzvan Ionescu și Iulian Andrei Crăciun. Proiectul a funcționat inițial prin firma Harfa Online Publishing SRL, unde aproape jumătate din acțiuni erau deținute de Dragoș Vîlcu Management SRL, restul de jurnaliștii fondatori. Modelul actual de funcționare este centrat pe Asociația Recorder Community, ONG care derulează activitatea editorială și colectează donațiile.',
    politicalConnections: ['Fără afiliații politice directe cunoscute'],
    fundingSources: [
      'Donații și contribuții recurente de la public (~90% din venituri)',
      'Granturi pentru jurnalism de investigație (naționale și internaționale)',
      'Advertising limitat (online), fără publicitate politică',
    ],
    editorialLine:
      'Proiect de jurnalism de investigație și documentar independent, cu focus pe subiecte de interes public: corupție, administrație, justiție, sănătate, educație, infrastructură. Conținutul principal este video (documentare, reportaje), completat de texte explicative și materiale de context.',
    biasRationale:
      'Recorder este o redacție de investigație transpartinică ce vizează abuzurile instituționale și corupția indiferent de partidul aflat la putere (PSD, PNL, USR, instituții publice sau BOR). Jurnalismul anticorupție nu este în sine „de stânga”; accentul pe responsabilitate publică și servicii publice funcționale justifică cel mult o ușoară înclinație civic-reformistă în interiorul zonei de centru (-15), fără partizanat ideologic.',
    notablePatterns: [
      'Investigații profunde, bazate pe documente și surse primare',
      'Documentare video de impact social, cu audiențe mari și efecte în agenda publică',
      'Acoperire transpartinică a unor dosare și teme sistemice (infrastructură, justiție, administrație)',
    ],
    strengths: [
      'Independență editorială susținută de un model de finanțare centrat pe donații',
      'Calitate investigativă ridicată și capacitate de a produce documentare complexe',
      'Transparență financiară, cu rapoarte anuale detaliate puse la dispoziția publicului',
    ],
    factualityRationale: 'Factualitate foarte ridicată, bazată pe documentare riguroasă: utilizarea surselor primare (documente, baze de date, interviuri), verificarea afirmațiilor și prezentarea dovezilor în materiale video și texte. Recorder publică periodic rapoarte către cititori despre activitatea sa.',
    lastAnalysed: '2026-11-26',
    references: [
      { label: 'Recorder – Raport anual „Opt ani de Recorder" (finanțare, structură)', url: 'https://recorder.ro/opt-ani-de-recorder-raport-in-fata-cititorilor/' },
      { label: 'Recorder – Raport anual „7 ani de Recorder"', url: 'https://recorder.ro/7-ani-de-recorder-raport-in-fata-cititorilor/' },
      { label: 'Recorder – Pagina de susținere / donații', url: 'https://recorder.ro/sustine/' },
      { label: 'GIJN – Profil Recorder (model de jurnalism independent)', url: 'https://gijn.org/resource/recorder-romania/' },
      { label: 'IPI – Studiu de caz Recorder (finanțare din donații)', url: 'https://ipi.media/recorder-romania/' },
      { label: 'HotNews – Despre finanțarea și impactul Recorder', url: 'https://hotnews.ro/recorder-finantare-donatii-model-jurnalism' },
    ],
  },

  libertatea: {
    id: 'libertatea',
    foundedYear: 1989,
    currentOwner: 'Ringier Romania',
    parentCompany: 'Ringier AG (Elveția)',
    ownershipHistory:
      'Fondat pe 22 decembrie 1989, imediat după Revoluție, și deținut de grupul elvețian Ringier din 1994. Între 2018 și 2023 a trecut printr-o perioadă de investigații puternice sub coordonarea lui Cătălin Tolontan; după plecarea echipei de investigații (sfârșitul lui 2023 – 2024), publicația a revenit spre un format mainstream generalist și comercial.',
    politicalConnections: ['Ringier AG — grup media elvețian fără afilieri politice românești'],
    fundingSources: ['Publicitate', 'Conținut sponsorizat', 'Abonamente'],
    editorialLine:
      'Publicație mainstream generalistă care combină știri de interes general, subiecte sociale, lifestyle și anchete ocazionale, cu ton accesibil publicului larg.',
    biasRationale:
      'euro|topics descrie Libertatea ca fiind politic independentă, găzduind opinii variate de la liberalism economic la social-democrație. După plecarea echipei de investigații (care a fondat Snoop.ro), orientarea este mai aproape de centrul mainstream (-15), păstrând o sensibilitate moderată față de subiectele sociale.',
    factualityRationale: 'Factualitate mixtă — solidă pentru știri serioase, variabilă pentru conținut comercial/tabloid.',
    lastAnalysed: '2026-11-26',
  },

  adevarul: {
    id: 'adevarul',
    foundedYear: 1888,
    currentOwner: 'Adevărul Holding (Cristian Burci)',
    ownershipHistory:
      'Unul dintre cele mai vechi ziare din România (fondat în secolul al XIX-lea, relansat în decembrie 1989). A trecut prin mai mulți proprietari (inclusiv Dinu Patriciu), fiind preluat ulterior de omul de afaceri Cristian Burci prin Adevărul Holding.',
    politicalConnections: [
      'Istoric al unor controverse privind conexiunile politice și de business ale proprietarilor în diverse perioade',
    ],
    fundingSources: ['Publicitate', 'Distribuție', 'Abonamente online'],
    editorialLine:
      'Ziar național generalist cu flux intens de știri politice, economice, internaționale și o platformă amplă de bloguri și opinii.',
    biasRationale:
      'euro|topics încadrează Adevărul în zona centru-dreapta / liberal-conservatoare. În fluxul zilnic de știri, abordarea este predominant generalist-mainstream, cu o ușoară înclinație liberal-conservatoare și pro-europeană (+10, centru), departe de clasificarea anterioară de centru-stânga.',
    controversies: [
      'Controverse istorice privind conexiunile politice ale proprietarilor și insolvența trustului',
    ],
    lastAnalysed: '2026-11-26',
  },

  newsweek: {
    id: 'newsweek',
    foundedYear: 2018,
    founders: ['Sabin Orcan'],
    currentOwner: 'Newsweek România (Sabin Orcan, franciză Newsweek International)',
    ownershipHistory:
      'Ediția românească a revistei Newsweek a fost lansată în 2018 de jurnalistul Sabin Orcan, împreună cu o parte din echipa demisionară de la România Liberă, în sistem de franciză.',
    politicalConnections: [
      'Fără afiliere formală de partid, dar cu linie editorială constantă anti-PSD și anti-suveranistă',
    ],
    fundingSources: ['Publicitate', 'Abonamente', 'Evenimente'],
    editorialLine:
      'Publicație de investigații, politică, economie și analiză, cu profil ferm pro-occidental, pro-NATO, pro-piață liberă și critic față de PSD și curentul suveranist.',
    biasRationale:
      'Spre deosebire de percepția asupra brandului american, Newsweek România (fondat de Sabin Orcan și foști jurnaliști ai României Libere) are o linie editorială clară de centru-dreapta liberal-conservatoare (+25): pro-economie de piață, pro-parteneriat strategic cu SUA și UE, consecvent critică la adresa PSD, a populismului și a extremismului naționalist.',
    strengths: ['Investigații privind averile și legăturile politicienilor', 'Acoperire euroatlantică'],
    factualityRationale: 'Factualitate bună în anchete, combinată cu editoriale cu ton puternic polemic.',
    lastAnalysed: '2026-11-26',
  },

  snoop: {
    id: 'snoop',
    foundedYear: 2024,
    founders: ['Cătălin Tolontan', 'Iulia Roșu', 'Răzvan Luțac', 'Mirela Neag', 'Dan Duca'],
    currentOwner: 'Asociația Snoop (ONG de jurnalism de investigație independent)',
    ownershipHistory:
      'Lansat în 2024 de foști jurnaliști de investigație de la Libertatea și Gazeta Sporturilor (Cătălin Tolontan, Iulia Roșu, Răzvan Luțac, Mirela Neag ș.a.), ca redacție non-profit de interes public.',
    politicalConnections: ['Fără afiliații politice cunoscute'],
    fundingSources: ['Donații ale cititorilor', 'Granturi pentru jurnalism independent', 'Fără publicitate politică'],
    editorialLine:
      'Redacție independentă de investigații și reportaje pe teme sociale, abuzuri de putere, sănătate, educație, drepturile omului și extremism.',
    biasRationale:
      'Snoop.ro practică jurnalism de investigație riguros, axat pe abuzuri sistemice, protecția categoriilor vulnerabile, sănătate publică și monitorizarea extremismului. Prin temele sociale și perspectiva civic-progresistă asumată, se situează moderat în zona centru-stânga (-25), fără partizanat de partid.',
    strengths: ['Echipă de investigație cu experiență vastă', 'Independență editorială (model ONG)', 'Documentare riguroasă'],
    factualityRationale: 'Factualitate ridicată, bazată pe documente oficiale, surse primare și verificare editorială.',
    lastAnalysed: '2026-11-26',
  },

  spotmedia: {
    id: 'spotmedia',
    foundedYear: 2020,
    founders: ['Emilian Isailă', 'Nicoleta Gruia', 'Ioana Ene Dogioiu', 'Magda Grădinaru'],
    currentOwner: 'Independent (echipa editorială)',
    ownershipHistory:
      'Lansat în iunie 2020 de o echipă de jurnaliști care au părăsit redacția Ziare.com în urma unor divergențe editoriale cu patronatul.',
    fundingSources: ['Publicitate', 'Contribuții cititori'],
    editorialLine:
      'Site de știri și analize politice, economice și sociale, cu accent pe comentarii editoriale, stat de drept și orientare pro-europeană.',
    biasRationale:
      'Spotmedia are o linie pro-europeană, anti-corupție și critică față de PSD și curentul suveranist, combinând perspective liberale/pro-piață cu analize instituționale. Nu are o agendă economică de stânga; se încadrează în zona de centru (+5), cu nuanță liberal-reformistă.',
    strengths: ['Echipă jurnalistică cu experiență', 'Analize politice și economice constante'],
    factualityRationale: 'Factualitate bună; separă relativ clar știrile de rubricile de opinie.',
    lastAnalysed: '2026-11-26',
  },

  paginademedia: {
    id: 'paginademedia',
    foundedYear: 2008,
    founders: ['Petrișor Obae'],
    currentOwner: 'Petrișor Obae (independent)',
    ownershipHistory:
      'Fondată în octombrie 2008 de jurnalistul Petrișor Obae, ca publicație specializată pe industria media, audiențe TV, publicitate și deciziile CNA.',
    editorialLine:
      'Publicație de nișă dedicată monitorizării industriei media românești: audiențe, acționariat, plecări din redacții, sancțiuni CNA și piața de publicitate.',
    biasRationale:
      'Pagina de Media este o publicație de industrie și un watchdog tehnic al pieței media. Relatarea sancțiunilor CNA sau a tranzacțiilor din presă nu reprezintă un bias de stânga; conținutul este factual și neutru politic (0, centru).',
    strengths: [
      'Monitorizare sistematică a industriei media și a deciziilor CNA',
      'Transparență privind proprietatea publicațiilor',
      'Sursă primară pentru datele de audiență din România',
    ],
    factualityRationale: 'Factualitate ridicată în raportarea datelor de audiență, a deciziilor CNA și a mișcărilor din piața media.',
    lastAnalysed: '2026-11-26',
  },

  vice: {
    id: 'vice',
    foundedYear: 2010,
    founders: ['Vice Media Group (brand global fondat în 1994 de Shane Smith, Suroosh Alvi și Gavin McInnes)'],
    currentOwner: 'Vice Media Group (preluat de consorțiu de creditori: Fortress Investment Group, Soros Fund Management etc.) — redacția română închisă în decembrie 2023',
    parentCompany: 'Vice Media Group (în reorganizare post-faliment)',
    ownershipHistory:
      'Vice România a funcționat din 2010 ca ediție locală a Vice Media Group, parte a rețelei internaționale Vice. La nivel global, brandul a fost fondat în 1994 la Montreal de Shane Smith, Suroosh Alvi și Gavin McInnes. Vice Media Group a inițiat procedura de faliment (Chapter 11) în SUA în 2023 și a fost preluat de un consorțiu de creditori. Redacția română și-a închis activitatea în decembrie 2023, pe fondul problemelor financiare ale grupului-mamă.',
    fundingSources: ['Publicitate', 'Conținut de brand (native advertising)', 'Campanii integrate pentru branduri'],
    editorialLine:
      'Ediție românească a brand-ului global Vice, orientată spre public tânăr, cu conținut despre cultură, lifestyle, sexualitate, societate și investigații sociale. Abordare neconvențională, limbaj direct, accent pe teme controversate și pe subiecte marginalizate. Redacția română a fost activă între 2010 și 2023.',
    biasRationale:
      'Vice, la nivel global, promovează constant teme progresiste: drepturi LGBTQ+, drepturile minorităților, critici la adresa autoritarismului, conservatorismului social și abuzurilor de putere. Ediția românească a urmat aceeași linie, atât prin selecția subiectelor, cât și prin tonul editorial, ceea ce justifică încadrarea în zona centru-stânga / progresistă, fără a fi explicit partizană în favoarea unui partid politic românesc.',
    notablePatterns: [
      'Conținut orientat spre Gen Z și public tânăr',
      'Teme progresiste: LGBTQ+, minorități, critici sociale',
      'Stil narativ și subiectiv, diferit de jurnalismul tradițional',
    ],
    controversies: [
      'Falimentul Vice Media Group (Chapter 11, 2023)',
      'Închiderea redacției române în decembrie 2023',
      'Dependență de finanțare externă și datorii mari la nivel global',
    ],
    strengths: ['Acces la public tânăr', 'Subiecte și perspective marginalizate', 'Investigații sociale neconvenționale'],
    factualityRationale: 'Factualitate medie: Vice combină reportaje solide și materiale de investigație cu texte subiective, narative sau foarte personale, ceea ce duce la o factualitate inegală între materiale. Redacția românească a produs și materiale bine documentate despre teme sociale sensibile.',
    lastAnalysed: '2026-02-27',
    references: [
      { label: 'Vice România – „Ce a însemnat Vice România pentru noi" (bilanț)', url: 'https://www.vice.com/ro/article/ce-a-insemnat-vice-romania-pentru-noi/' },
      { label: 'Wikipedia – Vice (revistă)', url: 'https://ro.wikipedia.org/wiki/Vice_(revist%C4%83)' },
      { label: 'HotNews – Vice România se închide', url: 'https://hotnews.ro/vice-romnia-a-anuntat-ca-se-va-nchide-dupa-o-prezenta-de-peste-un-deceniu-pe-piata-25265' },
      { label: 'Știrile ProTV – Vice Media depune cerere de faliment', url: 'https://stirileprotv.ro/stiri/financiar/compania-care-detine-brandul-americano-canadian-vice-a-depus-cerere-pentru-intrarea-in-faliment.html' },
      { label: 'G4Media – Vice România s-a închis', url: 'https://www.g4media.ro/publicatia-vice-romania-s-a-inchis-zece-angajati-au-fost-concediati-compania-mama-are-probleme-la-nivel-global-dupa-ce-a-primit-bani-din-arabia-saudita.html' },
    ],
  },

  scena9: {
    id: 'scena9',
    currentOwner: 'Fundația9 (fondată de BRD – Groupe Société Générale)',
    parentCompany: 'Fundația9 / BRD – Groupe Société Générale',
    ownershipHistory:
      'Scena9 este un program coordonat de Fundația9, fondată de BRD – Groupe Société Générale. Funcționează ca revistă culturală și de analiză socială, cu sprijin instituțional din partea BRD prin programe culturale (inclusiv Rezidența BRD Scena9).',
    fundingSources: ['BRD – Groupe Société Générale (partener fondator)', 'Granturi culturale', 'Donații'],
    editorialLine:
      'Revistă culturală și de analiză socială. Conținut literar, artistic, investigații sociale profunde. Teme recurente: artă, feminism, drepturi civile, societate, cultură urbană.',
    biasRationale:
      'Scena9 are o orientare progresistă clară, reflectată în temele abordate (artă, feminism, drepturi civile, societate). Nu este partizană politic, dar valorile promovate sunt sistematic centru-stânga. Sprijinul instituțional din partea BRD (bancă comercială) nu influențează vizibil linia editorială.',
    notablePatterns: [
      'Conținut cultural și analitic de înaltă calitate',
      'Teme progresiste: feminism, drepturi civile, critică socială',
      'Format de revistă, nu flux de știri la zi',
    ],
    strengths: ['Calitate editorială ridicată', 'Analize profunde', 'Conținut cultural valoros'],
    factualityRationale: 'Factualitate bună pentru conținut analitic și cultural.',
    lastAnalysed: '2026-02-27',
    references: [
      { label: 'Scena9 – Pagina „Despre noi"', url: 'https://www.scena9.ro/despre' },
      { label: 'Eurozine – Profil Scena9', url: 'https://www.eurozine.com/partner-journals/scena9/' },
      { label: 'Journalismfund Europe – Profil Scena9', url: 'https://www.journalismfund.eu/organisation/scena9' },
      { label: 'Project Oasis – Profil Scena9', url: 'https://www.projectoasis.media/publication/scena9/' },
    ],
  },

  // ===================== G4MEDIA & STÂNGA =====================

  g4media: {
    id: 'g4media',
    foundedYear: 2018,
    founders: ['Dan Tăpălagă', 'Cristian Pantazi'],
    currentOwner: 'Titluri Quality SRL (Radu Budeanu) — din august 2025',
    parentCompany: 'Titluri Quality (include și Mediafax, Gândul, Cancan, ProSport, Economedia)',
    ownershipHistory:
      'Fondat pe 18 martie 2018 de jurnaliștii Dan Tăpălagă și Cristian Pantazi (foști editori HotNews), inițial ca organizație non-profit (Asociația Group 4 Media Freedom and Democracy). În august 2025, grupul G4Media (inclusiv Economedia, G4Food, Techrider) a fost achiziționat integral de Titluri Quality SRL, deținută de Radu Budeanu. Fondatorii au semnat un acord de independență editorială și au rămas la conducerea redacției.',
    politicalConnections: [
      'Fără afiliere directă la un partid politic',
      'Proiecte finanțate prin granturi europene pentru combaterea dezinformării',
      'Radu Budeanu (proprietar din august 2025) — om de afaceri în media digitală, patron al Gândul, Mediafax și Cancan',
    ],
    fundingSources: [
      'Publicitate',
      'Abonamente',
      'Donații cititori (perioada non-profit)',
      'Granturi europene (proiecte anti-dezinformare)',
    ],
    editorialLine:
      'Jurnalism politic, economic și de investigație cu orientare ferm pro-europeană, pro-NATO, pro-piață liberă, anti-corupție și critică față de PSD și curentul suveranist/AUR.',
    biasRationale:
      'G4Media nu este o publicație de stânga: economic susține piața liberă, disciplina fiscală, reducerea risipei bugetare și reforma statului, fiind consecvent critică la adresa PSD, a etatismului și a populismului, dar și a suveranismului/AUR. Platforma europeană euro|topics încadrează G4Media ca liberal-conservatoare. Combinația de liberalism economic, profil pro-occidental și apropiere de zona reformistă (PNL reformist / USR) justifică încadrarea la centru-dreapta liberal (+20), chiar la granița cu centrul.',
    notablePatterns: [
      'Susținere constantă a economiei de piață și a disciplinei fiscale',
      'Poziționare fermă pro-UE, pro-NATO și pro-stat de drept',
      'Critici consistente la adresa PSD și a partidelor suveraniste (AUR/SOS)',
      'Investigații și monitorizare a dezinformării',
    ],
    controversies: [
      'Achiziția din august 2025 de către Titluri Quality (Radu Budeanu) — dezbateri intense privind independența editorială pe termen lung',
      'Criticată din zona suveranistă pentru proiectele finanțate din granturi europene',
    ],
    strengths: ['Calitate investigativă și viteză de reacție', 'Standarde ridicate de verificare', 'Influență majoră în agenda publică'],
    factualityRationale: 'Factualitate ridicată; separă editorialele asumate ale fondatorilor de fluxul de știri.',
    lastAnalysed: '2026-11-26',
    references: [
      { label: 'G4Media – Pagina „Despre noi"', url: 'https://www.g4media.ro/despre-noi' },
      { label: 'Eurotopics – Profil G4Media (liberal-conservative)', url: 'https://www.eurotopics.net/en/210366/g4media' },
      { label: 'Wikipedia – G4Media', url: 'https://ro.wikipedia.org/wiki/G4Media' },
      { label: 'Romania Journal – Achiziția G4Media de către Titluri Quality (august 2025)', url: 'https://www.romaniajournal.ro/business/radu-budeanus-titluri-quality-acquires-g4media-group/' },
    ],
  },

  criticatac: {
    id: 'criticatac',
    currentOwner: 'Platformă colectivă de autori (fără proprietar comercial)',
    founders: ['Vasile Ernu', 'Ciprian Șiulea', 'Costi Rogozanu', 'Florin Poenaru'],
    ownershipHistory:
      'Platformă colectivă de critică socială, coordonată de un nucleu editorial de intelectuali și jurnaliști (Vasile Ernu, Ciprian Șiulea, Costi Rogozanu, Florin Poenaru și alții, componență variabilă în timp). Proiectul a beneficiat de sprijin pentru unele conferințe și activități din partea Fundației Friedrich Ebert, dar nu există un trust media comercial sau un partid politic care să dețină formal platforma.',
    politicalConnections: [
      'Fără afiliere la un partid politic — se auto-definește ca grup de critică socială de stânga',
      'Sprijin ocazional din partea Fundației Friedrich Ebert (fundație germană social-democrată)',
      'Parte a rețelei regionale de publicații de stânga (LeftEast, Global Dialogue)',
    ],
    fundingSources: ['Autofinanțare colectiv editorial', 'Donații', 'Sprijin ocazional fundații (Friedrich Ebert)'],
    editorialLine:
      'Platformă intelectuală de stânga, axată pe critică socială, politică și economică, cu eseuri, analize și intervenții teoretice. Nu funcționează ca site de știri la zi, ci ca spațiu de idei și dezbatere ideologică. Teme recurente: inegalitate socială, relația capital–muncă, critica elitelor și a capitalismului.',
    biasRationale:
      'CriticAtac se auto-definește explicit ca grup de critică socială cu orientare de stânga. Textele promovează constant perspective egalitariste, anticapitaliste și critice la adresa capitalismului, liberalismului economic și a elitelor intelectuale mainstream. Manifestele și intervențiile lor publice, inclusiv în rețele regionale de stânga, justifică încadrarea în zona stângii radicale, cu o poziționare sistemic critică față de ordinea capitalistă existentă.',
    notablePatterns: [
      'Conținut preponderent de opinie și teorie, nu flux de știri',
      'Eseuri și manifeste anticapitaliste',
      'Participare la rețele internaționale de stânga (LeftEast, ISA)',
    ],
    controversies: [
      'Percepută de criticii de dreapta ca platformă de propagandă marxistă',
      'Poziții controversate privind evenimentele din Ucraina (perspective critice față de NATO)',
    ],
    strengths: ['Profunzime analitică', 'Originalitate în peisajul media românesc', 'Independență față de trusturi media'],
    factualityRationale: 'Factualitate variabilă — accent pe opinie și teorie, mai puțin pe raportare neutră de știri. Nu este un „fake news site", dar nu poate fi tratat ca sursă neutră de factualitate. Conținutul este preponderent de analiză și eseu.',
    lastAnalysed: '2026-02-27',
    references: [
      { label: 'CriticAtac – Pagina „Despre noi"', url: 'https://www.criticatac.ro/despre-noi/' },
      { label: 'CriticAtac – „Nu mai vreau bogati!" (articol ilustrativ)', url: 'https://www.criticatac.ro/nu-mai-vreau-bogati/' },
      { label: 'CriticAtac – „Viitorul are autor #COLECTIV. Revendicările stângii"', url: 'https://www.criticatac.ro/viitorul-autor-colectiv-revendicrile-stangii/' },
      { label: 'Wikipedia – CriticAtac', url: 'https://ro.wikipedia.org/wiki/CriticAtac' },
      { label: 'Eurotopics – Fișă CriticAtac', url: 'https://www.eurotopics.net/en/148467/criticatac' },
      { label: 'Global Dialogue (ISA) – „CriticAtac: An Anti-Capitalist Manifesto from Romania"', url: 'https://globaldialogue.isa-sociology.org/articles/criticatac-an-anti-capitalist-manifesto-from-romania' },
      { label: 'LeftEast – „Romania\'s Fragile New Left" (interviu Costi Rogozanu)', url: 'https://lefteast.org/romanias-fragile-new-left/' },
      { label: 'HotNews – Publiciștii de stânga din România', url: 'https://hotnews.ro/cum-vad-publicistii-de-stanga-din-romania-evenimentele-din-ucraina-o-paralela-cu-vocea-rusiei-572017' },
      { label: 'Jurnalul – „Intelectualii de stânga, față în față cu România"', url: 'https://jurnalul.ro/cultura/carte/intelectualii-de-stanga-fata-in-fata-cu-romania-574941.html' },
      { label: 'Contributors – Critică libertariană la adresa CriticAtac', url: 'https://www.contributors.ro/acul-libertarian-in-cojocul-criticatac-cat-ne-costa-statul/' },
    ],
  },

  // ===================== CENTRU-DREAPTA =====================

  ziare: {
    id: 'ziare',
    currentOwner: 'New Century Holdings (NCH) / Active Soft',
    parentCompany: 'NCH (fond de investiții american)',
    ownershipHistory:
      'Unul dintre cele mai vechi portaluri de știri online din România, deținut de fondul american de investiții New Century Holdings (NCH) prin Active Soft / iMedia. A trecut prin plecări masive de redacție în 2020 (o parte din echipă fondând Spotmedia.ro).',
    editorialLine:
      'Portal de știri generaliste și agregator cu volum mare de publicare: politică, economie, social, monden.',
    biasRationale:
      'Ziare.com funcționează în principal ca portal generalist comercial și agregator, fără o afiliere partinică rigidă. Se observă o ușoară tendință pro-business și critică moderată în unele materiale politice (+10, centru).',
    lastAnalysed: '2026-11-26',
  },

  gandul: {
    id: 'gandul',
    foundedYear: 2005,
    currentOwner: 'Titluri Quality SRL (Radu Budeanu)',
    parentCompany: 'Gândul Media Network / Titluri Quality',
    ownershipHistory:
      'Fondat în 2005 ca ziar național, trecut ulterior în format exclusiv online și preluat de Radu Budeanu (Titluri Quality SRL, care mai controlează Cancan, ProSport, Mediafax și, din august 2025, G4Media).',
    politicalConnections: [
      'Radu Budeanu — om de afaceri în media, condamnat cu suspendare într-un dosar de corupție (cazul Hidroelectrica / Elena Udrea)',
      'Emisiuni video găzduite de formatori de opinie cu discurs puternic anti-sistem și suveranist (Marius Tucă Show, invitați precum Ion Cristoiu)',
      'Contracte documentate de publicitate politică inclusiv cu formațiuni suveraniste (AUR)',
    ],
    fundingSources: ['Publicitate comercială', 'Publicitate politică', 'Proiecte video / YouTube'],
    editorialLine:
      'Site de știri rapide, infotainment și talk-show-uri video cu orientare tot mai accentuată spre dreapta conservatoare, naționalistă și anti-establishment.',
    biasRationale:
      'Sub patronajul lui Radu Budeanu, Gândul a virat semnificativ spre dreapta în perioada 2024–2026: pe lângă fluxul comercial de știri, platforma video (în special Marius Tucă Show) amplifică constant discursul suveranist, eurosceptic și anti-USR/anti-establishment. Scorul (+50, centru-dreapta spre dreapta) reflectă această reorientare.',
    controversies: [
      'Contracte de publicitate politică și promovare a unor figuri suveraniste',
      'Titluri frecvent senzaționaliste și clickbait',
    ],
    factualityRationale: 'Factualitate mixtă — fluxul de știri curente coexistă cu titluri senzaționaliste și opinii puternic partizane.',
    lastAnalysed: '2026-11-26',
  },

  capital: {
    id: 'capital',
    foundedYear: 1992,
    currentOwner: 'Editura Evenimentul și Capital (Dan Andronic)',
    parentCompany: 'Editura Evenimentul și Capital SRL',
    ownershipHistory:
      'Publicație economică lansată în 1992 (anterior parte a Ringier), editată în prezent de Editura Evenimentul și Capital, unde jurnalistul și consultantul politic Dan Andronic este acționar majoritar (~90%, alături de Evenimentul Zilei).',
    politicalConnections: [
      'Dan Andronic — proprietar și consultant politic cu poziționări frecvent conservatoare/de dreapta și critice față de zona progresistă/USR',
    ],
    editorialLine:
      'Site de știri economice, fiscale, politice și de interes general, cu volum mare de titluri comerciale și comentarii conservatoare.',
    biasRationale:
      'Capital.ro combină un profil pro-business/pro-piață cu poziționări politice conservatoare de dreapta specifice trustului condus de Dan Andronic (+35, centru-dreapta). Factualitatea este afectată de accentul pe titluri clickbait.',
    lastAnalysed: '2026-11-26',
  },

  profit: {
    id: 'profit',
    foundedYear: 2015,
    founders: ['Orlando Nicoară', 'echipă de jurnaliști economici'],
    currentOwner: 'Profit.ro / ecosistem Clever Media (Adrian Tomșa & Orlando Nicoară)',
    ownershipHistory:
      'Lansat în 2015 de o echipă de jurnaliști economici împreună cu managerul media Orlando Nicoară; strâns integrat comercial și editorial cu grupul Clever Media (Adrian Tomșa, Prima TV / Profit News).',
    editorialLine:
      'Site de știri economice, financiare, fiscale și de business, cu focus pe companii, piețe și reglementare.',
    biasRationale:
      'Profit.ro este o publicație economică serioasă cu standarde ridicate de documentare. Orientarea centru-dreapta (+20) derivă natural din perspectiva pro-piață liberă și pro-investiții specifică presei de business, fără partizanat politic agresiv.',
    strengths: ['Specialitate economică', 'Factualitate ridicată', 'Informații financiare și fiscale de calitate'],
    factualityRationale: 'Factualitate ridicată în domeniul economic.',
    lastAnalysed: '2026-11-26',
  },

  zf: {
    id: 'zf',
    foundedYear: 1998,
    currentOwner: 'Mediamex Investment / Mediafax Group (Dan Șucu / Adrian Sârbu)',
    parentCompany: 'Mediafax Group / Mediamex Investment',
    ownershipHistory:
      'Lansat în 1998 în cadrul grupului Mediafax fondat de Adrian Sârbu. După reorganizarea datoriilor grupului, omul de afaceri Dan Șucu (fondatorul Mobexpert) a devenit principalul acționar/creditor care controlează activele Ziarului Financiar.',
    editorialLine:
      'Cel mai important ziar economic din România. Standard ridicat în jurnalismul de afaceri, finanțe, bănci și macro-economie.',
    biasRationale:
      'Ziarul Financiar este orientat centru-dreapta (+25) prin natura sa de publicație economică și prin editorialele consecvent pro-piață liberă, pro-capital privat și critice față de taxarea excesivă sau intervenționismul statal.',
    strengths: ['Standard înalt în jurnalism economic', 'Analize financiare profunde', 'Credibilitate în mediul de afaceri'],
    factualityRationale: 'Factualitate ridicată în domeniul economic.',
    lastAnalysed: '2026-11-26',
  },

  romanialibera: {
    id: 'romanialibera',
    foundedYear: 1877,
    currentOwner: 'Medien Holding (familia Dan Adamescu)',
    parentCompany: 'Medien Holding / The Nova Group Investments',
    ownershipHistory:
      'Ziar cu tradiție îndelungată (1877). După retragerea grupului german WAZ în 2010, a trecut sub controlul integral al familiei omului de afaceri Dan Adamescu prin Medien Holding. În 2018 o parte importantă a redacției a plecat și a lansat Newsweek România.',
    editorialLine:
      'Ziar național cu orientare conservatoare și de centru-dreapta, cu acoperire politică și opinii conservatoare.',
    biasRationale:
      'România Liberă are o tradiție editorială de dreapta / conservatoare (+35). Din cauza problemelor financiare și a schimbărilor de redacție din ultimul deceniu, calitatea și factualitatea au devenit variabile.',
    factualityRationale: 'Factualitate mixtă, variabilă în timp.',
    lastAnalysed: '2026-11-26',
  },

  observator: {
    id: 'observator',
    currentOwner: 'Intact Media Group (Camelia Voiculescu / familia Voiculescu)',
    parentCompany: 'Intact Media Group (Antena 1)',
    ownershipHistory:
      'Observator este redacția de știri a postului generalist Antena 1, parte a trustului Intact Media Group fondat de Dan Voiculescu și condus de fiicele sale (Camelia și Corina Voiculescu).',
    politicalConnections: [
      'Intact Media Group — trust fondat de Dan Voiculescu, asociat istoric cu zona PSD / social-democrată',
    ],
    fundingSources: ['Publicitate comercială'],
    editorialLine:
      'Jurnal de știri de televiziune generalistă (Antena 1), axat pe actualitate socială, evenimente interne, meteo, lifestyle și știri politice prezentate într-o cheie mult mai moderată decât Antena 3.',
    biasRationale:
      'Spre deosebire de Antena 3, Observator (Antena 1) are un format comercial generalist orientat spre subiecte sociale și audiență largă, cu implicare partinică redusă. Clasificarea anterioară de centru-dreapta (+35) era eronată; se încadrează în centrul spectrului (-5), cu o ușoară sensibilitate socială specifică grupului Intact.',
    factualityRationale: 'Factualitate mixtă — predominant factual pe știri curente, cu accent ocazional pe emoție și senzațional social.',
    lastAnalysed: '2026-11-26',
  },

  defapt: {
    id: 'defapt',
    foundedYear: 2022,
    founders: ['Cătălin Prisacariu', 'Mircea Marian', 'Petru Zoltan'],
    currentOwner: 'Independent (echipa fondatoare)',
    ownershipHistory:
      'Lansat în 2022 de jurnaliștii Cătălin Prisacariu, Mircea Marian și Petru Zoltan, foști membri ai redacțiilor Newsweek România și România Liberă.',
    editorialLine:
      'Site independent de știri politice, investigații și opinii incisive, cu poziționare ferm anti-PSD, anti-AUR/suveranistă și pro-occidentală.',
    biasRationale:
      'Defapt.ro nu este o platformă de fact-checking (cum era descris eronat anterior), ci un site de jurnalism politic și investigații al unei echipe cu profil liberal-conservator / centru-dreapta (+25), consecvent critic față de PSD, de populismul economic și de extrema dreaptă suveranistă.',
    strengths: ['Investigații privind cheltuirea banului public', 'Independență față de marile trusturi'],
    factualityRationale: 'Factualitate bună în investigații, combinată cu comentarii politice cu ton polemic.',
    lastAnalysed: '2026-11-26',
  },

  dailybusiness: {
    id: 'dailybusiness',
    currentOwner: 'Proprietate privată',
    editorialLine:
      'Publicație de business și știri economice.',
    biasRationale:
      'Publicație economic-orientată cu tendință centru-dreapta specifică jurnalismului de business. Pro-piață liberă, pro-investiții.',
    lastAnalysed: '2026-02-26',
  },

  // ===================== PRO-PSD / SOCIAL-DEMOCRAT & DREAPTA =====================

  antena3: {
    id: 'antena3',
    foundedYear: 2005,
    founders: ['Dan Voiculescu'],
    currentOwner: 'Intact Media Group (Camelia Voiculescu și Corina Voiculescu)',
    parentCompany: 'Intact Media Group (afiliat CNN din 2022 — Antena 3 CNN)',
    ownershipHistory:
      'Lansat în iunie 2005 de Dan Voiculescu, fondatorul Partidului Conservator (fost PUR) și al trustului Intact. Voiculescu a fost condamnat definitiv în 2014 pentru spălare de bani (dosarul privatizării ICA) și a primit separat decizie definitivă CNSAS de colaborare cu Securitatea. Trustul este deținut și condus de fiicele sale, Camelia și Corina Voiculescu. Din 2022, postul funcționează ca afiliat exclusiv CNN în România (Antena 3 CNN).',
    politicalConnections: [
      'Apropiere istorică de PSD (Partidul Social Democrat) și de zona social-democrată / de guvernare',
      'Dan Voiculescu — fondatorul trustului Intact și al Partidului Conservator',
      'Afiliere CNN (din 2022) — linie ferm pro-NATO, pro-UE și critică față de curentul radical suveranist',
    ],
    fundingSources: ['Publicitate comercială', 'Contracte de publicitate politică', 'Distribuție cablu'],
    editorialLine:
      'Televiziune mainstream de știri 24/7 cu orientare social-democrată / pro-PSD pe teme economice și politice, accente conservatoare pe teme culturale, dar ferm pro-UE, pro-NATO și critică la adresa extremismului suveranist și a lui Călin Georgescu.',
    biasRationale:
      'Media Bias/Fact Check încadrează Antena 3 CNN la „Left-Center” (centru-stânga) cu factualitate „Mixed”. În România, postul este asociat tradițional cu PSD (stânga social-democrată: accent pe pensii, protecție socială, critică la adresa austerității de dreapta și a USR), fiind totodată pro-euroatlantic și opus curentului suveranist/AUR și candidaturii Călin Georgescu. Clasificarea anterioară de „dreapta extremă (+80)” confunda Antena 3 cu Realitatea Plus/România TV și nu corespunde realității actuale (-25, centru-stânga).',
    controversies: [
      'Istoric de sancțiuni CNA în perioada 2011–2022 (85 de amenzi în raportul ActiveWatch), reduse semnificativ în 2025 (2 amenzi CNA)',
      'Campanii partizane intense împotriva adversarilor politici ai PSD și ai lui Dan Voiculescu',
      'Ton adesea emoțional și partizan în emisiunile de dezbatere de seară',
    ],
    notablePatterns: [
      'Acoperire favorabilă PSD și temelor sociale (pensii, salarii, ajutoare de stat)',
      'Linie ferm pro-NATO și pro-UE (consolidată de parteneriatul CNN)',
      'Opoziție clară față de Călin Georgescu și retorica anti-occidentală',
    ],
    factualityRationale: 'Factualitate mixtă (confirmată de MBFC și de cele 2 amenzi CNA din 2025): știri curente bazate pe surse și parteneriatul CNN, combinate cu talk-show-uri partizane.',
    lastAnalysed: '2026-11-26',
    references: [
      { label: 'MediaBiasFactCheck – Antena 3 CNN (Left-Center, Mixed)', url: 'https://mediabiasfactcheck.com/antena-3-cnn-bias-and-credibility/' },
      { label: 'Paginademedia – Raport activitate CNA 2025', url: 'https://www.paginademedia.ro/cna/raport-activitate-cna-2025-top-amenzi-22395349' },
    ],
  },

  romaniatv: {
    id: 'romaniatv',
    foundedYear: 2011,
    founders: ['Sebastian Ghiță'],
    currentOwner: 'Ridzone Computers SRL (structură asociată lui Sebastian Ghiță)',
    ownershipHistory:
      'Lansat în 2011 de Sebastian Ghiță, om de afaceri și fost deputat PSD, inculpat în mai multe dosare de corupție. Ghiță a fugit din România în decembrie 2016 în Serbia, unde a primit azil și unde autoritățile sârbe au refuzat extrădarea sa.',
    politicalConnections: [
      'Sebastian Ghiță — fondator, fugar în Serbia din 2016',
      'Apropiere fluctuantă de zona național-populistă (inclusiv AUR și figuri suveraniste), alternând cu momente de indulgență față de PSD',
      'Poziționare constantă anti-USR, anti-DNA și critică față de instituțiile europene',
    ],
    fundingSources: ['Publicitate', 'Contracte de promovare politică', 'Surse opace'],
    editorialLine:
      'Canal TV de știri cu orientare populist-naționalistă, suveranistă și senzaționalistă. Critică agresivă la adresa USR, a Occidentului și a „statului paralel”, cu promovare intensă a narativelor anti-sistem.',
    biasRationale:
      'Deși pornit din zona PSD, România TV a devenit unul dintre principalii vectori ai populismului național-conservator și suveranist din România (+80, dreapta), oferind vizibilitate masivă curentului AUR/Călin Georgescu și promovând frecvent burtiere alarmiste, conspirații și dezinformare (20 de amenzi CNA în 2025).',
    controversies: [
      'Fondatorul Sebastian Ghiță — fugar în Serbia din 2016',
      '20 de amenzi CNA (300.000 lei) și 19 somații doar în 2025',
      'Dezinformare recurentă și limbaj incendiar în talk-show-uri',
    ],
    factualityRationale: 'Factualitate scăzută (20 de amenzi CNA în 2025; MBFC evaluează site-ul ca Mixed cu probleme frecvente de sursare și senzaționalism).',
    lastAnalysed: '2026-11-26',
  },

  dcnews: {
    id: 'dcnews',
    foundedYear: 2010,
    founders: ['Bogdan Chirieac', 'Răzvan Dumitrescu'],
    currentOwner: 'Bogdan Chirieac (DCNews Media Group / Press Media Electronic SRL)',
    ownershipHistory:
      'Fondat în 2010 de analistul politic Bogdan Chirieac împreună cu jurnalistul Răzvan Dumitrescu. Este publicația principală a grupului DCNews Media (care include DCBusiness, DCMedical, DCNews TV). Nu are legătură cu Dan Andronic (proprietarul EVZ și Capital).',
    politicalConnections: [
      'Bogdan Chirieac — comentator politic frecvent asociat cu zona PSD și cu establishment-ul guvernamental',
      'Apropiere editorială constantă de PSD și critică frecventă la adresa USR și a DNA',
    ],
    fundingSources: ['Publicitate comercială', 'Contracte de publicitate politică și instituțională'],
    editorialLine:
      'Site de știri politice, interviuri și analize cu orientare pro-establishment și social-democrată (apropiată de PSD), cu accente conservatoare moderate și profil pro-NATO/pro-UE.',
    biasRationale:
      'Clasificarea anterioară de dreapta (+65) se baza pe o eroare factuală privind proprietarul (confundat cu Dan Andronic). În realitate, DCNews (Bogdan Chirieac) este o publicație pro-PSD și pro-establishment, susținătoare a cheltuielilor sociale și a guvernărilor cu participare PSD, critică la adresa USR, dar mainstream pe politica externă (-20, centru-stânga social-democrat).',
    factualityRationale: 'Factualitate mixtă — combină flux de știri de agenție și declarații cu editoriale și interviuri favorabile partidelor de guvernare.',
    lastAnalysed: '2026-11-26',
  },

  flux24: {
    id: 'flux24',
    founders: ['Andrei Bădin'],
    currentOwner: 'Andrei Bădin',
    ownershipHistory:
      'Platformă online fondată și coordonată de jurnalistul și realizatorul TV Andrei Bădin (fost moderator B1 TV, Antena 3 și colaborator Realitatea Plus).',
    editorialLine:
      'Site de știri și comentarii cu orientare dreapta-naționalistă, conservatoare și suveranistă, critic la adresa establishment-ului pro-european.',
    biasRationale:
      'Flux24 promovează consecvent o agendă conservatoare, suveranistă și anti-sistem (+65, dreapta), cu titluri polemice și accent pe narativele criticii la adresa Bruxelles-ului și a partidelor pro-europene.',
    factualityRationale: 'Factualitate mixtă — frecvent ton partizan și preluări nefiltrate din zona suveranistă.',
    lastAnalysed: '2026-11-26',
  },

  activenews: {
    id: 'activenews',
    currentOwner: 'Proprietate privată',
    editorialLine:
      'Site de știri și opinii cu orientare puternic naționalistă, ultra-conservatoare, religioasă și anti-globalistă.',
    biasRationale:
      'ActiveNews este una dintre cele mai radicale publicații de dreapta din România (+85): promovează constant ultranaționalism, fundamentalism religios, retorică anti-UE, anti-LGBTQ și teorii ale conspirației (inclusiv dezinformare medicală și geopolitică).',
    controversies: [
      'Promovare sistematică de dezinformare și teorii ale conspirației',
      'Retorică anti-UE, anti-vaccinare și anti-LGBTQ',
    ],
    factualityRationale: 'Factualitate scăzută. Dezinformare frecventă documentată de platforme de fact-checking.',
    lastAnalysed: '2026-11-26',
  },

  epochtimes: {
    id: 'epochtimes',
    founders: ['Epoch Times International'],
    currentOwner: 'Epoch Times România (parte a rețelei internaționale The Epoch Times)',
    parentCompany: 'The Epoch Times (asociată istoric cu practicanți ai mișcării Falun Gong)',
    ownershipHistory:
      'Ediția în limba română a rețelei internaționale The Epoch Times, lansată de practicanți ai mișcării spirituale Falun Gong (persecutată de regimul comunist din China). Spre deosebire de ediția americană — care a virat puternic spre dreapta radicală MAGA — redacția din România a păstrat o linie distinctă, pro-occidentală și anti-autoritară.',
    politicalConnections: [
      'Opoziție declarată față de Partidul Comunist Chinez și față de influența Federației Ruse',
      'Linie editorială în România ferm pro-UE, pro-NATO, critică față de PSD, AUR și Călin Georgescu',
    ],
    fundingSources: [
      'Rețea internațională Epoch Times',
      'Publicitate',
      'Donații și abonamente',
    ],
    editorialLine:
      'Publicație online cu orientare conservator-liberală clasică, pro-occidentală, anti-corupție și puternic critică la adresa regimurilor autoritare (Rusia, China) și a suveranismului radical intern.',
    biasRationale:
      'Clasificarea anterioară (+90, extremă dreapta) copia profilul ediției americane (MAGA/QAnon), ignorând conținutul real al Epoch Times România. Ediția românească este ferm pro-UE, pro-NATO, critică dură a lui Călin Georgescu, AUR și a propagandei ruse, promovând drepturile omului și statul de drept dintr-o perspectivă conservator-liberală (+30, centru-dreapta).',
    controversies: [
      'Asocierea de brand cu ediția americană The Epoch Times, criticată internațional pentru dezinformare și partizanat pro-Trump',
      'Finanțare și structură de grup internațională asociată mișcării Falun Gong',
    ],
    factualityRationale: 'Factualitate mixtă: în România publică frecvent interviuri și analize serioase de geopolitică și justiție, dar poartă riscul editorial al rețelei-mamă internaționale.',
    lastAnalysed: '2026-11-26',
  },

  // ===================== SATIRĂ =====================

  catavencii: {
    id: 'catavencii',
    foundedYear: 2011,
    founders: ['Doru Bușcu', 'Mircea Dinescu', 'Patrick André de Hillerin', 'foști redactori Academia Cațavencu'],
    currentOwner: 'Patetic Media (Doru Bușcu, Mircea Dinescu ș.a.)',
    ownershipHistory:
      'Săptămânal de satiră politică lansat în 2011 de nucleul redacțional desprins din Academia Cațavencu (condus de Doru Bușcu și Mircea Dinescu). A funcționat inițial sub umbrela Adevărul Holding, devenind ulterior independent.',
    editorialLine:
      'Satiră politică, anchete și comentarii ironice care vizează politicieni și instituții din toate zonele spectrului.',
    biasRationale:
      'Publicație de satiră care lovește transpartinic în clasa politică (PSD, PNL, USR, suveraniști). Nu se aliniază unei singure ideologii economice sau politice (0, centru).',
    strengths: ['Calitate literară', 'Satiră transpartinică', 'Tradiție în presa satirică'],
    lastAnalysed: '2026-11-26',
  },

  academiacatavencu: {
    id: 'academiacatavencu',
    foundedYear: 1991,
    founders: ['Mircea Toma', 'Liviu Mihaiu', 'Ioan T. Morar', 'Doru Bușcu', 'echipa Cațavencu'],
    currentOwner: 'Medien Holding (familia Dan Adamescu)',
    ownershipHistory:
      'Una dintre cele mai cunoscute reviste satirice post-decembriste, fondată în 1991. După intrarea în insolvență a vechii societăți în 2011, brandul a fost cumpărat la licitație de Medien Holding (Dan Adamescu), iar vechea redacție a fondat revista Cațavencii.',
    editorialLine:
      'Satiră politică și pamflet la adresa clasei politice românești.',
    biasRationale:
      'Satiră transpartinică fără o agendă ideologică unică (0, centru), cu activitate mult mai redusă față de perioada de vârf a anilor 1990–2000.',
    lastAnalysed: '2026-11-26',
  },

  // ===================== TABLOID & GENERAL =====================

  wowbiz: {
    id: 'wowbiz',
    currentOwner: 'Dogan Media International (Kanal D)',
    parentCompany: 'Dogan Holding (Turcia)',
    ownershipHistory:
      'Portal de știri mondene și divertisment operat sub umbrela trustului Kanal D (Dogan Media International).',
    editorialLine:
      'Tabloid de entertainment, vedete, lifestyle și subiecte virale.',
    biasRationale:
      'Tabloid axat pe divertisment și mondenități, cu bias politic minimal (0, centru). Factualitate mixtă specifică tabloidelor.',
    factualityRationale: 'Factualitate mixtă — tabloid de divertisment.',
    lastAnalysed: '2026-11-26',
  },

  actualitate: {
    id: 'actualitate',
    currentOwner: 'Proprietate privată',
    editorialLine:
      'Site de știri generale. Conținut mixt.',
    biasRationale:
      'Publicație generalistă fără orientare politică clară documentată. Tendință ușor centristă.',
    lastAnalysed: '2026-02-26',
  },

  factual: {
    id: 'factual',
    currentOwner: 'Asociația Funky Citizens (proiect independent de fact-checking)',
    editorialLine:
      'Platformă de fact-checking dedicată verificării declarațiilor publice ale politicienilor din toate partidele.',
    biasRationale:
      'Factual.ro aplică o metodologie transparentă de verificare a declarațiilor politicienilor din tot spectrul (PSD, PNL, USR, AUR). Verificarea faptelor este o practică neutră politic (0, centru).',
    strengths: ['Verificarea informațiilor', 'Metodologie transparentă', 'Independență'],
    factualityRationale: 'Factualitate foarte ridicată prin definiție și metodologie verificabilă.',
    lastAnalysed: '2026-11-26',
  },

  jurnalul: {
    id: 'jurnalul',
    foundedYear: 1993,
    currentOwner: 'Intact Media Group (Camelia și Corina Voiculescu)',
    parentCompany: 'Intact Media Group',
    ownershipHistory:
      'Lansat în 1993 ca Jurnalul Național, parte istorică a trustului Intact Media Group fondat de Dan Voiculescu.',
    politicalConnections: [
      'Intact Media Group — trust asociat istoric cu zona PSD și social-democrată',
    ],
    editorialLine:
      'Cotidian național cu acoperire politică, socială și de actualitate, aliniat în linii mari sensibilității editoriale a trustului Intact.',
    biasRationale:
      'Ca publicație a trustului Intact Media Group, Jurnalul.ro reflectă frecvent o linie apropiată de PSD și de temele sociale/de guvernare, combinată cu accente tradiționaliste moderate (-20, centru-stânga social-democrat).',
    lastAnalysed: '2026-11-26',
  },

  realitatea: {
    id: 'realitatea',
    foundedYear: 2001,
    founders: ['Sorin Ovidiu Vântu'],
    currentOwner: 'Maricel Păcuraru (prin fiica sa, Bertalan Alexandra Beatrice — 99,75% din Geopol International SRL)',
    parentCompany: 'Geopol International SRL',
    ownershipHistory:
      'Fondat în 2001 ca Realitatea TV de Sorin Ovidiu Vântu. Postul a intrat în insolvență (2011) și faliment (2019), fiind continuat de Realitatea Plus din 1 noiembrie 2019 (licența Geopol International SRL). Din 2021, Bertalan Alexandra Beatrice (fiica lui Maricel Păcuraru) deține 99,75% din Geopol International.',
    politicalConnections: [
      'Maricel Păcuraru — om de afaceri, controlează postul prin familia sa',
      'Contracte documentate de promovare politică cu AUR și aliniere editorială puternică cu curentul suveranist și cu Călin Georgescu',
      'Poziționare vehement anti-USR, anti-UE (Bruxelles) și anti-establishment pro-occidental',
    ],
    fundingSources: ['Publicitate comercială', 'Publicitate politică (inclusiv AUR)', 'Cablu/satelit'],
    editorialLine:
      'Canal TV de știri cu orientare puternic suveranistă, ultranaționalistă și anti-sistem. Principala platformă TV a discursului pro-Călin Georgescu și pro-AUR în perioada 2024–2026.',
    biasRationale:
      'Sub controlul familiei Păcuraru și prin emisiuni precum „Culisele Statului Paralel”, Realitatea Plus a devenit cel mai radical canal TV suveranist-naționalist din România (+85, dreapta). Este totodată televiziunea cea mai sancționată de CNA în 2025 (29 de amenzi în valoare de 1,15 milioane lei și 31 de somații), din cauza dezinformării recurente și a lipsei de echilibru.',
    controversies: [
      '29 de amenzi CNA (1.150.000 lei) și 31 de somații doar în 2025 — locul 1 în România',
      'Promovare intensă și dezechilibrată a lui Călin Georgescu și a agendei AUR',
      'Contracte politice și insolvență/faliment istoric ale vechii structuri Realitatea TV',
    ],
    notablePatterns: [
      'Talk-show-uri militant suveraniste și conspiraționiste',
      'Critică virulentă la adresa UE, a justiției și a partidelor pro-europene',
      'Sancțiuni CNA repetate pentru dezinformare și încălcarea imparțialității',
    ],
    strengths: ['Acoperire live extinsă'],
    factualityRationale: 'Factualitate scăzută (29 de amenzi CNA în 2025; evaluat Mixed de MBFC pentru site-ul realitatea.net).',
    lastAnalysed: '2026-11-26',
  },

  b1tv: {
    id: 'b1tv',
    foundedYear: 2001,
    founders: ['Bobby Păunescu'],
    currentOwner: 'Sorin Oancea (50%), George Constantin Păunescu (40%), Luminița Elena Oancea (10%)',
    parentCompany: 'B1 TV Channel SRL',
    ownershipHistory:
      'Lansat în 2001 ca post generalist, transformat în canal de știri 24/7 în 2011. În februarie 2025, CNA a aprobat noua structură de acționariat: Sorin Oancea 50%, George Constantin Păunescu 40%, Luminița Elena Oancea 10%, pe fondul unui conflict de durată între familiile Păunescu și Oancea.',
    politicalConnections: [
      'Istoric apropiat de zona de centru-dreapta democratică (PNL / USR / pro-occidentală)',
      'Tensiuni interne în 2025–2026 privind direcția editorială și presiunile financiare ale pieței TV',
    ],
    fundingSources: ['Publicitate', 'Cablu/satelit'],
    editorialLine:
      'Canal de știri cu orientare centru-dreapta liberală și pro-europeană, cu dezbateri politice și critici frecvente la adresa PSD și a curentului suveranist.',
    biasRationale:
      'B1 TV rămâne structural un post de centru-dreapta pro-occidental (+25), mult mai apropiat de electoratul liberal/PNL/USR decât de retorica suveranistă a României TV sau Realitatea Plus, în ciuda tensiunilor editoriale și financiare din 2025–2026.',
    controversies: [
      'Conflict de proprietate între familia Păunescu și Sorin Oancea (din 2022)',
      'Plecări de moderatori și dezbateri privind încercări de repoziționare editorială (2025)',
    ],
    notablePatterns: [
      'Dezbateri cu invitați din zona PNL/USR și analiști pro-europeni',
      'Critică constantă a PSD și a populismului',
    ],
    strengths: ['Acoperire 24/7', 'Zero amenzi CNA în 2025 (5 somații)', 'Dezbateri politice'],
    factualityRationale: 'Factualitate mixtă — solidă în știrile curente, cu ton polemic în talk-show-uri.',
    lastAnalysed: '2026-11-26',
  },

  aktual24: {
    id: 'aktual24',
    founders: ['Ovidiu Albu'],
    currentOwner: 'Independent (Ovidiu Albu)',
    ownershipHistory: 'Site independent de știri și comentarii politice fondat și condus de jurnalistul Ovidiu Albu.',
    editorialLine: 'Site de știri cu focus pe politică internă, justiție și actualitate, cu poziționare ferm anti-PSD, anti-AUR/suveranistă și pro-UE/pro-USR.',
    biasRationale: 'Aktual24 are o linie clară anti-PSD, anti-suveranistă și pro-reformistă/liberală, similară zonei USR și centrului-dreapta urban (+20, centru-dreapta). Tonul titlurilor este frecvent polemic și militant.',
    lastAnalysed: '2026-11-26',
  },

  redactia: {
    id: 'redactia',
    currentOwner: 'Proprietate privată',
    ownershipHistory: 'Site de știri online generalist, cu focus pe actualitate și trafic de tip agregator.',
    editorialLine: 'Știri generale, tabloid și actualitate rapidă. Focus pe trafic și audiență social media.',
    biasRationale: 'Conținut generalist / agregator fără o linie editorială politică asumată (0, centru). Factualitatea variază în funcție de preluări.',
    lastAnalysed: '2026-03-19',
  },

  cotidianul: {
    id: 'cotidianul',
    foundedYear: 1991,
    founders: ['Ion Rațiu'],
    currentOwner: 'Cornel Nistorescu',
    ownershipHistory: 'Fondat în 1991 de Ion Rațiu cu orientare țărănistă/de dreapta. După moartea sa a trecut prin mai multe patronate, fiind condus în prezent de jurnalistul Cornel Nistorescu.',
    editorialLine: 'Publicație zilnică online de știri, analize și editoriale, cu ton puternic dictat de pozițiile lui Cornel Nistorescu.',
    biasRationale: 'Sub conducerea actuală, Cotidianul promovează frecvent editoriale conservatoare, anti-USR, anti-DNA și simpatice față de critica suveranistă a instituțiilor europene (+50, centru-dreapta spre dreapta).',
    lastAnalysed: '2026-11-26',
  },

  comisarul: {
    id: 'comisarul',
    currentOwner: 'Proprietate privată',
    ownershipHistory: 'Site online de știri, preluări și comentarii politice cu ton senzaționalist și anti-sistem.',
    editorialLine: 'Abordare agresivă de tip tabloid politic, limbaj colorat și critică dură la adresa clasei politice (PSD, PNL, USR, în funcție de conjunctură).',
    biasRationale: 'Site-ul practică un jurnalism militant și senzaționalist, cu accente populiste și conservator-naționaliste (+35, centru-dreapta), dar fără o disciplină ideologică unitară.',
    lastAnalysed: '2026-11-26',
  },

  metropolatv: {
    id: 'metropolatv',
    foundedYear: 2020,
    currentOwner: 'Consiliul Local Voluntari (Florentin Pandele)',
    ownershipHistory: 'Canal TV lansat în 2020 de televiziunea Consiliului Local Voluntari (primar Florentin Pandele, soțul liderului PSD Gabriela Firea).',
    editorialLine: 'Canal de știri, divertisment și talk-show-uri politice care combină finanțarea publică locală cu emisiuni ale unor realizatori conservatori/suveraniști.',
    biasRationale: 'Metropola TV prezintă un profil hibrid: finanțare controlată de primăria lui Florentin Pandele (legături cu PSD) combinată cu talk-show-uri de orientare conservator-populistă și anti-USR (+45, centru-dreapta).',
    lastAnalysed: '2026-11-26',
  },

  romaniajournal: {
    id: 'romaniajournal',
    foundedYear: 2014,
    currentOwner: 'Independent',
    ownershipHistory: 'Publicație independentă în limba engleză dedicată știrilor din România pentru expații și cititorii străini.',
    editorialLine: 'Ziar de știri online în limba engleză (politică, economie, societate). Stil și rapoarte bazate adesea pe agregarea agențiilor.',
    biasRationale: 'Acoperirea are un ton neutru, instituțional, specific publicațiilor destinate străinilor. Nu manifestă parti-pris politic vizibil.',
    lastAnalysed: '2026-03-19',
  },

  romaniainsider: {
    id: 'romaniainsider',
    foundedYear: 2010,
    currentOwner: 'City Compass Media',
    ownershipHistory: 'Cea mai citită publicație exclusiv în limba engleză din România, fondată de Corina Chirileasa și Volker Moser.',
    editorialLine: 'Platformă de știri business, politică și lifestyle în engleză. Calitate editorială ridicată.',
    biasRationale: 'Fiind dedicată mediului corporate expat și antreprenorilor străini, abordează piața cu un ton economic pro-occidental, centrist, foarte echilibrat politic.',
    lastAnalysed: '2026-03-19',
  },
  economedia: { id: 'economedia', currentOwner: 'Titluri Quality SRL (Radu Budeanu) — din august 2025 (grupul G4Media)', parentCompany: 'Titluri Quality', editorialLine: 'Știri și analize economice, business, fiscalitate și politică macroeconomică, parte din grupul fondat de echipa G4Media.', biasRationale: 'Abordare economică factuală, pro-piață liberă, pro-mediu privat și pro-reformă europeană (+15, centru cu ușoară înclinație liberal-economică). Preluată în august 2025 de Titluri Quality sub același acord de independență editorială ca G4Media.', lastAnalysed: '2026-11-26', factualityRationale: 'Jurnalism solid axat pe date, statistici oficiale și fapte.' },
  cursdeguvernare: { id: 'cursdeguvernare', currentOwner: 'Curs De Guvernare SRL', editorialLine: 'Analize aprofundate de politici publice, macroeconomie și strategie națională.', biasRationale: 'Publicație centristă specializată, care echilibrează analizele stânga-dreapta printr-o raportare riguroasă și orientată tehnic spre politici publice europene.', lastAnalysed: '2026-03-21', factualityRationale: 'Specializată în analize ample și documentate.' },
  edupedu: { id: 'edupedu', foundedYear: 2018, founders: ['Raluca Pantazi', 'Mihai Peticilă', 'Mădălina Belu'], currentOwner: 'Independent (echipa fondatoare)', editorialLine: 'Publicație dedicată politicilor educaționale, învățământului și cercetării.', biasRationale: 'Factualitate foarte mare. Tonul este pro-reformă și pro-transparență în educație, cu o ușoară sensibilitate civică (-10, centru), fără partizanat politic.', lastAnalysed: '2026-11-26', factualityRationale: 'Sursă de referință independentă pentru sistemul educațional din România.' },
  rfi: { id: 'rfi', currentOwner: 'France Médias Monde', parentCompany: 'Guvernul Francez', editorialLine: 'Jurnalism radio low-bias, axat pe evenimente franțuzești, internaționale și românești majore.', biasRationale: 'Parte a rețelei Radio France Internationale. Menține o obiectivitate inaltă, promovând democrația, drepturile omului și valorile europene (centru).', lastAnalysed: '2026-03-21', factualityRationale: 'Standarde riguroase impuse de grupul public francez.' },
  alephnews: { id: 'alephnews', founders: ['Adrian Sârbu'], currentOwner: 'Aleph Media (Adrian Sârbu)', editorialLine: 'Canal TV de știri cu un format neconvențional "social television".', biasRationale: 'Linie editorială asumată drept smart-news. Poate manifesta uneori tușe personale legate de opiniile fondatorului Adrian Sârbu pe zona de business și economie, rămânând totuși global centristă.', lastAnalysed: '2026-03-21', factualityRationale: 'Focus pe visual și sinteză, ocazional infotainment.' },
  fanatik: { id: 'fanatik', currentOwner: 'Horia Ivanovici', editorialLine: 'Site hibrid de sport, cancan, lifestyle și știri politice/sociale generaliste.', biasRationale: 'Format tabloid cu titluri clickbait. Linia pe politică tinde uneori spre senzaționalism și populism moderat (+15, centru). Se bazează masiv pe trafic și emoție.', lastAnalysed: '2026-11-26', factualityRationale: 'Publicație de tip tabloid; factualitatea variază masiv între segmente.' },
  cancan: { id: 'cancan', currentOwner: 'Titluri Quality SRL (Radu Budeanu)', parentCompany: 'Titluri Quality', editorialLine: 'Tabloid orientat preponderent spre showbiz, scandaluri, mondenități și subiecte virale.', biasRationale: 'Publicație comercială de divertisment și scandal; conținutul politic este secundar și ocazional populist (+15, centru). Nu are o linie ideologică politică structurată.', lastAnalysed: '2026-11-26', factualityRationale: 'Factualitate scăzută pe teme serioase, prioritatea fiind traficul și mondenitățile.' },
  psnews: { id: 'psnews', currentOwner: 'Independent/Privat', editorialLine: 'Știri politice românești scurte, breaking news-uri rapide.', biasRationale: 'A avut istoric perioade în care a fost criticată pentru afilieri netransparente cu zona de dreapta/centru-dreapta a politicii românești (în special PNL).', lastAnalysed: '2026-03-21', factualityRationale: 'Mix de știri factuale de agenție și conținut partizan.' },
  zdg: { id: 'zdg', currentOwner: 'Asociația Ziarul de Gardă', editorialLine: 'Publicație de investigații din Republica Moldova, axată pe corupție, oligarhie și stat de drept.', biasRationale: 'Publicație independentă anti-corupție și pro-europeană de la Chișinău. Investigațiile de interes public și monitorizarea corupției sunt transpartinice (-15, centru cu ușoară înclinație civică).', lastAnalysed: '2026-11-26', factualityRationale: 'Jurnalism de investigație la standarde internaționale, premiat constant.' },
  riseproject: { id: 'riseproject', founders: ['Paul Radu', 'Mihai Munteanu'], currentOwner: 'Asociația RISE Project', editorialLine: 'Dedicat exclusiv jurnalismului de investigație pe format cross-border (în parteneriat cu OCCRP).', biasRationale: 'Nu are filiații politice. Urmărește crima organizată și corupția la nivel înalt. Valorile anti-corupție și pro-transparență o plasează în zona de centru cu ușoară înclinație civică (-15).', lastAnalysed: '2026-11-26', factualityRationale: 'Sursă primară pentru investigații documentate minuțios din registre oficiale.' },
  buletindebucuresti: { id: 'buletindebucuresti', currentOwner: 'Asociația Funky Citizens', editorialLine: 'Publicație bazată pe jurnalism comunitar, investigații și administrație locală în București + Ilfov.', biasRationale: 'Susținută de Funky Citizens, promovează anticorupția, transparența administrativă, mobilitatea urbană și libertățile civice (-25, centru-stânga civic).', lastAnalysed: '2026-03-21', factualityRationale: 'Nivel ridicat de dovedire a faptelor prin hotărâri CGMB și documente de achiziții publice.' },
  ziaruldeiasi: { id: 'ziaruldeiasi', currentOwner: 'Privat', editorialLine: 'Cel mai important ziar local/regional din nord-estul țării.', biasRationale: 'Ziar quality regional, abordează nuanțat teme politice, cu ușoară tradiție academic/culturală datorată specificului universitar al Iașului.', lastAnalysed: '2026-03-21', factualityRationale: 'Echilibrat și bine documentat.' },
  kanald: { id: 'kanald', currentOwner: 'Dogan Media International', parentCompany: 'Dogan Holding (Turcia)', editorialLine: 'Televiziune generalistă (divertisment majoritar), plus un jurnal de știri cu audiență masivă la nivel național.', biasRationale: 'Canal de TV cu acționariat turc care preferă să stea departe de conflictele politice majore. Oferă știri neutre pe partea politică, preferând subiecte sociale, accidente și drame.', lastAnalysed: '2026-03-21', factualityRationale: 'Tabloidizare/emoționalizare în segmentul social, factual pe evenimente majore.' },
  
  // --- Adăugate 2026-03 ---
  pressone: {
    id: 'pressone',
    foundedYear: 2015,
    founders: ['Don Lothrop'],
    currentOwner: 'Don Lothrop',
    editorialLine: 'Jurnalism independent de lung format („slow journalism”), axat pe reportaje de profunzime și analize de impact social.',
    biasRationale: 'Promovează valorile democratice, statul de drept, drepturile civile și protecția mediului. Are o linie editorială moderat progresistă (-30, centru-stânga).',
    lastAnalysed: '2026-03-22',
    factualityRationale: 'Jurnalism documentat masiv, premiat pentru acuratețe.'
  },
  europalibera: {
    id: 'europalibera',
    currentOwner: 'US Congress / USAGM',
    parentCompany: 'Radio Free Europe / Radio Liberty',
    editorialLine: 'Serviciu public internațional cu focus pe democrație, drepturile omului, investigații și monitorizarea puterii politice.',
    biasRationale: 'Finanțată de Congresul SUA (echivalentul american al RFI ca serviciu public internațional), Europa Liberă promovează valorile euroatlantice și jurnalismul factual transpartinic, investigând toate partidele. Se încadrează în centrul spectrului (-5), nu în centru-stânga.',
    lastAnalysed: '2026-11-26',
    factualityRationale: 'Standarde internaționale riguroase de verificare.'
  },
  caleaeuropeana: {
    id: 'caleaeuropeana',
    founders: ['Dan Cărbunaru'],
    currentOwner: 'Dan Cărbunaru',
    editorialLine: 'Publicație specializată în afaceri europene, diplomație și politici comunitare.',
    biasRationale: 'Axată pe integrare europeană și cooperare internațională. Tonul este instituțional și factual, fără o coloratură politică internă dominantă, încadrându-se în centru.',
    lastAnalysed: '2026-03-22',
    factualityRationale: 'Focus pe documente oficiale și declarații diplomatice.'
  },
  juridice: {
    id: 'juridice',
    founders: ['Andrei Săvescu'],
    currentOwner: 'Societatea de Științe Juridice',
    editorialLine: 'Portal juridic specializat, oferind noutăți legislative și analize de drept.',
    biasRationale: 'Sursă tehnică și profesională. Se limitează la interpretări juridice și știri legislative fără a lua poziții partizane, fiind o sursă de referință centristă prin obiectivitate tehnică.',
    lastAnalysed: '2026-03-22',
    factualityRationale: 'Bazat pe texte de lege și practică judiciară.'
  },
  dela0: {
    id: 'dela0',
    founders: ['Iulian Andrei', 'Diana Oncioiu', 'Vlad Stoicescu'],
    currentOwner: 'Independent (Asociația Dela0)',
    editorialLine: 'Investigații sociale și reportaje despre categoriile vulnerabile și reformele instituționale.',
    biasRationale: 'Pune mare accent pe dreptate socială și critica modului în care statul gestionează problemele cetățenilor. Se poziționează în zona centru-stânga (-40) prin valorile progresiste și activismul civic prin jurnalism.',
    lastAnalysed: '2026-03-22',
    factualityRationale: 'Investigații cu documentare primară solidă.'
  },
  context: {
    id: 'context',
    founders: ['Attila Biro', 'Ana Poenariu'],
    currentOwner: 'Asociația Context',
    editorialLine: 'Unitate de investigații transfrontaliere, parte din rețeaua OCCRP.',
    biasRationale: 'Redacție independentă de investigații axată pe crimă organizată, dezinformare și corupție la nivel înalt, similară cu Rise Project. Investigațiile transpartinice o plasează în zona de centru cu ușoară înclinație civică (-15).',
    lastAnalysed: '2026-11-26',
    factualityRationale: 'Standarde OCCRP de verificare și fact-checking.'
  },
  newsro: {
    id: 'newsro',
    founders: ['Foști jurnaliști Mediafax'],
    currentOwner: 'News.ro (Orlando Nicoară)',
    editorialLine: 'Agenție de presă cu flux de știri generalist (politic, economic, social).',
    biasRationale: 'Funcționează ca agenție de furnizare de conținut B2B. Menține un ton factual și echilibrat pentru a satisface o clientelă diversă, fiind o sursă de centru.',
    lastAnalysed: '2026-03-22',
    factualityRationale: 'Sursă primară de știri de agenție.'
  },
  republica: {
    id: 'republica',
    foundedYear: 2015,
    founders: ['Claudiu Pândaru', 'Cristian Tudor Popescu', 'Florin Negruțiu', 'Alex Livadaru'],
    currentOwner: 'Republica Media (independent)',
    editorialLine: 'Platformă de opinii, analize și comentarii pe teme politice, economice, educație și societate.',
    biasRationale: 'Republica.ro reunește editorialiști, antreprenori și economiști cu o linie dominant pro-europeană, liberală și favorabilă economiei de piață și reformei statului. Clasificarea anterioară de centru-stânga (-35) era eronată; profilul este de centru cu ușoară înclinație liberal-economică (+10).',
    lastAnalysed: '2026-11-26',
    factualityRationale: 'Platformă predominant de opinie și analiză, cu autori asumați și standarde editoriale bune.'
  },
  investigatoria: {
    id: 'investigatoria',
    foundedYear: 2020,
    founders: ['Carmen Dumitrescu'],
    currentOwner: 'Independent (Carmen Dumitrescu)',
    editorialLine: 'Publicație independentă de investigații axată pe corupție, administrație și justiție.',
    biasRationale: 'Redacție independentă de anchete transpartinice asupra abuzurilor din administrație și politică. Fără agendă ideologică de stânga, se plasează în zona de centru cu ușoară înclinație civică (-15).',
    lastAnalysed: '2026-11-26',
    factualityRationale: 'Investigații documentate pe bază de documente oficiale și surse primare.'
  },
  iamnews: {
    id: 'iamnews',
    foundedYear: 2024,
    founders: ['Victor Vrînceanu', 'Simion Apreutese'],
    currentOwner: 'International Alexander Media SRL (International Alexander Holding 80%, Victor Vrînceanu 20%)',
    parentCompany: 'I AM MEDIA',
    editorialLine: 'Site comercial de știri generaliste (politică, social, actualitate), parte din grupul I AM MEDIA (alături de iAMsport și iAMicon).',
    biasRationale: 'Platformă generalistă cu profil comercial și orientare ușor pro-business/mainstream (+10, centru), fără o linie politică militantă.',
    lastAnalysed: '2026-11-26',
    factualityRationale: 'Factualitate mixtă — combinație de știri rapide și subiecte comerciale.'
  },
  forbes: {
    id: 'forbes',
    foundedYear: 2009,
    currentOwner: 'BP Publishing Tour (Raluca Michailov)',
    parentCompany: 'Franciză Forbes Media',
    editorialLine: 'Revistă și portal de business, antreprenoriat, investiții și leadership.',
    biasRationale: 'Publicație dedicată mediului de afaceri și antreprenoriatului, cu o orientare naturală pro-piață liberă și pro-capital privat (+25, centru-dreapta economic).',
    lastAnalysed: '2026-11-26',
    factualityRationale: 'Factualitate ridicată în zona de business, cu prezență semnificativă de conținut comercial/advertoriale marcate.'
  },
  wallstreet: {
    id: 'wallstreet',
    foundedYear: 2005,
    currentOwner: 'InternetCorp',
    parentCompany: 'InternetCorp',
    editorialLine: 'Portal online de știri economice, piețe financiare, tech, imobiliare și business.',
    biasRationale: 'Publicație de business orientată spre economie de piață, investiții și antreprenoriat (+20, centru-dreapta economic), fără partizanat politic direct.',
    lastAnalysed: '2026-11-26',
    factualityRationale: 'Factualitate bună în știri economice și de companii.'
  },
  contributors: {
    id: 'contributors',
    foundedYear: 2010,
    founders: ['Foști editori HotNews / Asociația Societatea Online'],
    currentOwner: 'Asociația Societatea Online (asociată istoric cu ecosistemul HotNews / ZYX)',
    editorialLine: 'Platformă de eseuri, dezbateri intelectuale și analize scrise de profesori, economiști, diplomați și experți.',
    biasRationale: 'Găzduiește autori din întregul spectru democratic (de la economiști liberali/libertarieni la analiști moderați de centru-stânga), cu o pondere ușor mai mare a vocilor pro-europene și liberale (+5, centru).',
    lastAnalysed: '2026-11-26',
    factualityRationale: 'Platformă de opinie și analiză academică/expertă.'
  },
  puterea: {
    id: 'puterea',
    currentOwner: 'Saray Paper SRL (Mădălin Marian Stan)',
    editorialLine: 'Cotidian online de știri politice, economice și comentarii cu ton frecvent polemic și anti-sistem.',
    biasRationale: 'Publicația adoptă un framing frecvent critic la adresa taberei pro-europene/USR și a instituțiilor occidentale, cu accente conservator-naționaliste și populiste (+55, dreapta).',
    lastAnalysed: '2026-11-26',
    factualityRationale: 'Factualitate mixtă — combină preluări de știri cu materiale polemice și neechilibrate.'
  },
  panorama: {
    id: 'panorama',
    foundedYear: 2021,
    founders: ['Andrei Crăciun', 'Elena Deacu', 'Echipa Panorama'],
    currentOwner: 'Fundația Romanian Business Leaders / Proiect editorial independent',
    editorialLine: 'Jurnalism explicativ, grafice de date, analize macroeconomice, sociale și de mediu.',
    biasRationale: 'Orientare centristă axată pe date concrete, statistici Eurostat/INS și opinii ale experților independenți. Menține un limbaj echilibrat și factologie de înaltă precizie.',
    lastAnalysed: '2026-08-22',
    factualityRationale: 'Jurnalism bazat pe date și verificare riguroasă.'
  },
  rra: {
    id: 'rra',
    foundedYear: 1928,
    founders: ['Societatea Română de Radiodifuziune (SRR)'],
    currentOwner: 'Statul Român (Serviciu Public de Radio)',
    editorialLine: 'Post public național de știri cu transmisie 24/24 și rețea de corespondenți în toată țara.',
    biasRationale: 'Fiind serviciu public finanțat de la buget, respectă normele deontologice de echilibru și pluralism, având o linie editorială strict factuală de centru.',
    lastAnalysed: '2026-08-22',
    factualityRationale: 'Serviciu public național de radiodifuziune.'
  },
  presshub: {
    id: 'presshub',
    foundedYear: 2018,
    founders: ['Freedom House România', 'Rețeaua Presei Locale Independente'],
    currentOwner: 'Asociația Ziariștilor Independenți din România',
    editorialLine: 'Rețea de presă independentă ce reunește ziare locale și investigații din toate județele.',
    biasRationale: 'Accent pe transparență instituțională, anticorupție și drepturile cetățenilor. Deși investigațiile vizează decidenții locali din toate partidele, tonul general este pro-reformist și centrist.',
    lastAnalysed: '2026-08-22',
    factualityRationale: 'Investigații documentate și premiate.'
  },
  infosudest: {
    id: 'infosudest',
    foundedYear: 2012,
    founders: ['Cristian Andrei Leonte', 'Andreea Pavel'],
    currentOwner: 'Asociația Info Sud-Est',
    editorialLine: 'Jurnalism de investigație axat pe regiunea Dobrogea, patrimoniu istoric și administrație locală.',
    biasRationale: 'Publicație independentă membră a rețelelor de investigații din România. Ton critic la adresa abuzurilor de putere, cu o orientare moderat de centru-stânga spre societate civilă.',
    lastAnalysed: '2026-08-22',
    factualityRationale: 'Jurnalism premiat Superscrieri.'
  },
  misreport: {
    id: 'misreport',
    foundedYear: 2022,
    founders: ['Ovidiu Vanghele', 'Centrul de Investigații Media'],
    currentOwner: 'Proiect independent de fact-checking',
    editorialLine: 'Newsletter și publicație de fact-checking specializată pe demontarea dezinformării și fake news.',
    biasRationale: 'Proiect strict dedicat verificării factualității declarațiilor publice și a campaniilor de manipulare. Clasificat drept centru pur cu facticitate maximă.',
    lastAnalysed: '2026-08-22',
    factualityRationale: 'Fact-checking certificat și metodologie riguroasă.'
  },
};

/**
 * Profiles with their score and confidence filled in from shared/newsSources.ts, the single
 * source of truth for ratings (the server computes coverage bars from the same numbers).
 */
export const SOURCE_PROFILES: Record<string, SourceProfile> = Object.fromEntries(
  NEWS_SOURCE_DEFINITIONS.flatMap((source) => {
    const text = PROFILE_TEXTS[source.id];
    return text ? [[source.id, { ...text, biasScore: source.biasScore, confidence: source.biasConfidence }]] : [];
  }),
);

// ============================================================
//  UTILITARE
// ============================================================

/** Returnează profilul unei surse după ID, sau undefined dacă nu există. */
export function getSourceProfile(sourceId: string): SourceProfile | undefined {
  return SOURCE_PROFILES[sourceId];
}

/** Convertește un scor numeric în categorie de bias (pragurile din shared/newsSources.ts). */
export const scoreToBiasCategory = sharedScoreToBiasCategory;

/** Etichetă în română pentru nivelul de încredere al analizei. */
export function getConfidenceLabel(confidence: 'high' | 'medium' | 'low'): string {
  const labels = { high: 'Ridicată', medium: 'Medie', low: 'Scăzută' };
  return labels[confidence];
}

/** Returnează toate sursele sortate după biasScore (stânga → dreapta). */
export function getProfilesSortedByBias(): SourceProfile[] {
  return Object.values(SOURCE_PROFILES).sort((a, b) => a.biasScore - b.biasScore);
}

/** Returnează ID-urile de surse care NU au profil documentat. */
export function getMissingProfileIds(sourceIds: string[]): string[] {
  return sourceIds.filter((id) => !SOURCE_PROFILES[id]);
}

// ============================================================
//  TEMPLATE PENTRU SURSE NOI
//  Când adaugi o sursă nouă în shared/newsSources.ts (cu biasScore și
//  biasConfidence acolo), completează acest template fără cele două
//  câmpuri și adaug-o în PROFILE_TEXTS de mai sus.
// ============================================================

/**
 * PAȘI PENTRU ANALIZA UNEI SURSE NOI:
 * 1. Identifică proprietarul și istoricul de ownership (Wikipedia, ANAF, registrul comerțului)
 * 2. Caută conexiunile politice ale proprietarului (dosare penale, afiliații de partid)
 * 3. Verifică sursele de finanțare (publicitate politică, granturi, abonamente)
 * 4. Analizează 20-30 de articole recente pentru a identifica tipare editoriale
 * 5. Caută sancțiuni CNA sau alte controverse documentate
 * 6. Compară cu alte publicații din aceeași categorie pentru a calibra scorul
 * 7. Setează confidence: 'low' inițial și crește pe măsură ce aduni mai multe date
 */
export const NEW_SOURCE_TEMPLATE: Omit<SourceProfile, 'id'> = {
  foundedYear: undefined,
  founders: [],
  currentOwner: 'Necunoscut — necesită cercetare',
  parentCompany: undefined,
  ownershipHistory: 'TODO: Descrie istoricul proprietății',
  politicalConnections: ['TODO: Identifică conexiunile politice'],
  knownFinancialInterests: ['TODO: Identifică interesele financiare'],
  fundingSources: ['TODO: Identifică sursele de finanțare'],
  editorialLine: 'TODO: Descrie linia editorială',
  biasRationale:
    'TODO: Explică raționamentul din spatele scorului de bias. Bazează-te pe: ' +
    '(1) proprietar/fondator și conexiunile sale, ' +
    '(2) sursele de finanțare, ' +
    '(3) tipare observate în acoperirea știrilor, ' +
    '(4) controverse documentate.',
  notablePatterns: ['TODO: Listează tipare editoriale observabile'],
  controversies: [],
  strengths: [],
  biasScore: 0, // TODO: Ajustează după analiză
  factualityRationale: 'TODO: Explică ratingul de factualitate',
  confidence: 'low', // Începe cu low, crește pe măsură ce strângi date
  lastAnalysed: new Date().toISOString().split('T')[0],
};
