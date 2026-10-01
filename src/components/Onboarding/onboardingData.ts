import type { OnboardingAccent } from './onboardingTheme';

export interface OnboardingRichItem {
  id: string;
  title: string;
  summary: string;
  detail: string;
  highlights: string[];
  accent?: OnboardingAccent;
  isNew?: boolean;
  feedsInto?: string;
}

export interface OnboardingPrinciple {
  label: string;
  text: string;
}

export const VAULT_WELCOME = {
  headline: 'Welcome to Vault',
  tagline: 'The desktop research workspace for serious casework',
  description:
    'Vault is a local-first app that keeps extraction, conversion, archives, visual maps, written narratives, and document audits in one connected pipeline — built for investigators, researchers, and professionals who work with evidence every day.',
  principles: [
    {
      label: 'Local-first',
      text: 'Your files stay on your machine. Cases, maps, and novels save to your workspace — not a cloud silo.',
    },
    {
      label: 'Case-centric',
      text: 'Every module reads from the same archive. Pull a PDF from a case, map it, write about it, audit it — without re-importing.',
    },
    {
      label: 'End-to-end',
      text: 'Go from raw document intake to shareable narrative output without switching apps or losing context between steps.',
    },
  ] satisfies OnboardingPrinciple[],
  pipeline: ['Extract', 'Convert', 'Archive', 'Map', 'Novel::', 'Audit'],
  pipelineSteps: [
    { step: 'Extract', detail: 'Rasterize PDF pages at the quality your case requires.' },
    { step: 'Convert', detail: 'Normalize images, documents, and video into usable formats.' },
    { step: 'Archive', detail: 'File everything in case folders — the hub every module reads.' },
    { step: 'Map', detail: 'Lay out dated timelines when chronology is the story.' },
    { step: 'Novel::', detail: 'Draft paginated narratives linked to your archive.' },
    { step: 'Audit', detail: 'Verify redactions and metadata before files leave your desk.' },
  ],
  audiences: [
    { label: 'Investigators', detail: 'Evidence timelines, linked exhibits, audit before release' },
    { label: 'Researchers', detail: 'Corpus extraction, visual maps, exportable narratives' },
    { label: 'Legal teams', detail: 'Matter archives, chronology maps, disclosure checks' },
  ],
};

export const WELCOME_PILLARS: OnboardingRichItem[] = [
  {
    id: 'extract',
    title: 'PDF Extraction',
    summary: 'Rasterize long PDFs into workable page images.',
    detail: 'Batch-extract at custom DPI, then send pages straight into case folders or downstream tools.',
    highlights: ['Custom DPI', 'Batch pages', 'PNG output'],
    accent: 'purple',
  },
  {
    id: 'convert',
    title: 'Conversion Studio',
    summary: 'Transform media formats inside your evidence pipeline.',
    detail: 'Images, PDFs, GIFs, and video routes through Sharp, PDF.js, and FFmpeg — with vault-native intake.',
    highlights: ['FFmpeg video', 'Vault intake', 'Replace originals'],
    accent: 'cyan',
    isNew: true,
  },
  {
    id: 'archive',
    title: 'The Vault',
    summary: 'Your structured case archive and source-of-truth.',
    detail: 'Organize materials in case folders with tags, backgrounds, and fast search across growing libraries.',
    highlights: ['Case folders', 'Category tags', 'Quick search'],
    accent: 'purple',
  },
  {
    id: 'map',
    title: 'Research Maps',
    summary: 'See chronology when folders are not enough.',
    detail: 'Place dated blocks on a canvas, attach source files, and spot gaps in timelines at a glance.',
    highlights: ['Dated blocks', 'Attachments', 'Tier chronology'],
    accent: 'emerald',
  },
  {
    id: 'novel',
    title: 'Novel::',
    summary: 'Write the story your evidence supports.',
    detail: 'Paginated book editor with spreads, system fonts, case-linked images, crop tools, and PDF/HTML export.',
    highlights: ['Book spreads', 'Rich text', 'PDF export'],
    accent: 'amber',
    isNew: true,
  },
  {
    id: 'audit',
    title: 'Security Audit',
    summary: 'Verify documents before you share or file them.',
    detail: 'Scan for hidden metadata, incomplete redactions, embedded objects, and compliance risk indicators.',
    highlights: ['Redaction scan', 'Metadata pull', 'Risk report'],
    accent: 'purple',
  },
];

export const FEATURE_MODULES: OnboardingRichItem[] = [
  {
    id: 'pdf',
    title: 'PDF to PNG',
    summary: 'Break monolithic PDFs into page-level assets.',
    detail: 'Set extraction quality per job, process batches in one run, and land outputs in the case that owns the source file.',
    highlights: ['Page-level PNG', 'Batch jobs', 'DPI control', 'Case handoff'],
    accent: 'purple',
    feedsInto: 'Archive · Convert',
  },
  {
    id: 'converter',
    title: 'Conversion Studio',
    summary: 'One studio for images, documents, and video.',
    detail: 'Drop files from vault cases or external paths. Replace originals in-place or assign converted outputs back to a case.',
    highlights: ['PNG · JPEG · WebP', 'PDF rasterize', 'MP4 · WebM', 'Reference sync'],
    accent: 'cyan',
    isNew: true,
    feedsInto: 'Archive · Audit',
  },
  {
    id: 'vault',
    title: 'The Vault',
    summary: 'Central archive for every case you run.',
    detail: 'Cases hold folders, files, cover art, and metadata. Search scales as libraries grow — maps and novels link back here.',
    highlights: ['Case management', 'Folder taxonomy', 'Cover images', 'Cross-module links'],
    accent: 'purple',
    feedsInto: 'Map · Novel:: · Audit',
  },
  {
    id: 'map',
    title: 'Map',
    summary: 'Canvas timelines tied to real case material.',
    detail: 'Blocks carry dates, notes, and file attachments. Saves live beside archive records so chronology never drifts from sources.',
    highlights: ['Timeline canvas', 'Evidence links', 'Tier layout', 'Case-linked save'],
    accent: 'emerald',
    feedsInto: 'Novel:: · Archive',
  },
  {
    id: 'novel',
    title: 'Novel::',
    summary: 'Turn findings into a publishable case narrative.',
    detail: 'Edit in paginated spreads with rich text, pull images from cases, pick system fonts, crop assets, and export finished books.',
    highlights: ['Spread editor', 'Image layers', 'Font picker', 'HTML · PDF'],
    accent: 'amber',
    isNew: true,
    feedsInto: 'Export · Archive',
  },
  {
    id: 'audit',
    title: 'PDF Audit',
    summary: 'Security and integrity checks on sensitive PDFs.',
    detail: 'Surface redaction gaps, hidden layers, author metadata, and document risk before materials leave your desk.',
    highlights: ['Layer analysis', 'Redaction gaps', 'XMP metadata', 'Compliance flags'],
    accent: 'purple',
    feedsInto: 'Share · Archive',
  },
];

export const FEATURES_PAGE = {
  headline: 'Six modules, one archive',
  tagline: 'Each tool owns a stage — none duplicate files or break case context',
  description:
    'Vault modules are not separate apps bolted together. PDF extraction, Conversion Studio, the archive, maps, Novel::, and audit all read and write through the same case folders so your work compounds instead of fragmenting.',
  connections: [
    {
      label: 'Single source of truth',
      text: 'Extract once, reference everywhere — maps, novels, and audits pull from the same files.',
    },
    {
      label: 'No re-importing',
      text: 'Convert a file in-studio and assign it back to the case; every module sees the update.',
    },
    {
      label: 'Parallel workflows',
      text: 'Detach Conversion Studio or Novel:: into their own window while you keep the archive open.',
    },
  ],
  infraTitle: 'Workspace infrastructure',
};

export const FEATURE_INFRA = [
  {
    id: 'search',
    title: 'Deep Search',
    summary: 'Query across cases and file libraries',
    detail: 'Find assets fast as archives scale — without leaving the workspace.',
  },
  {
    id: 'detach',
    title: 'Detachable Modules',
    summary: 'Pop tools into their own window',
    detail: 'Run Conversion Studio or Novel:: beside your main layout, then reattach when done.',
  },
  {
    id: 'themes',
    title: 'Adaptive Themes',
    summary: 'Brideware Purple or Pastel',
    detail: 'Tune the interface for long night sessions or bright daytime review blocks.',
  },
  {
    id: 'pipeline',
    title: 'Shared Context',
    summary: 'Modules reference the same cases',
    detail: 'No duplicate imports — every tool reads the archive you already built.',
  },
];

export const MAP_CONTENT = {
  headline: 'Maps Belong in Vault',
  tagline: 'Visual chronology tied to your case archive',
  lead: 'Maps are not a separate app inside Vault. They are how you see relationships, sequence, and gaps across the same case files you already extracted, converted, and archived.',
  description:
    'When a case spans months of correspondence, dozens of exhibits, and conflicting accounts, a folder tree cannot show overlap, contradiction, or missing dates. Research maps give you a canvas where time, evidence, and notes live together — always linked back to the archive.',
  whyMaps: [
    {
      label: 'Chronology at a glance',
      text: 'See whether events align, overlap, or leave suspicious gaps without opening every file in sequence.',
    },
    {
      label: 'Evidence stays attached',
      text: 'Blocks point to real vault files — exhibits, transcripts, and images stay one click from the event they support.',
    },
    {
      label: 'Not a side project',
      text: 'Maps save inside the same case folders as your archive. Open a matter and the timeline is right there beside the source material.',
    },
  ],
  folderVsMap: [
    {
      label: 'Use folders when',
      text: 'Material is static, categorical, or does not depend on sequence — reference docs, templates, background reading.',
    },
    {
      label: 'Use a map when',
      text: 'Order, overlap, and relationships matter — investigations, witness timelines, multi-phase projects, argument structure.',
    },
  ],
  integrations: [
    {
      id: 'cases',
      title: 'Lives in your cases',
      summary: 'Saved beside the archive — not in a loose project file.',
      detail: 'Open a map from the case it belongs to. Sources and timeline blocks stay co-located with the rest of the material.',
      highlights: ['Case-linked saves', 'Same folder tree'],
    },
    {
      id: 'attach',
      title: 'Attach your sources',
      summary: 'Blocks hold pointers to real vault files.',
      detail: 'Link exhibits, transcripts, and images directly to the event they support — no copy-paste of paths or broken references.',
      highlights: ['Evidence pointers', 'Live file links'],
    },
    {
      id: 'chrono',
      title: 'Build chronology fast',
      summary: 'Drag, tier, and cluster when time is the story.',
      detail: 'Lay out parallel tracks, milestone clusters, and relationship lines when linear folders fail to show how events connect.',
      highlights: ['Multi-tier layout', 'Milestone clusters'],
    },
  ],
  capabilities: [
    {
      id: 'dated-blocks',
      title: 'Dated Event Blocks',
      summary: 'Anchor every node to a date or date range.',
      detail: 'Place blocks on the canvas with explicit timestamps so chronology is inspectable and sortable — not buried in filenames.',
      highlights: ['Date ranges', 'Sortable timeline', 'Event labels'],
      feedsInto: 'Chronology review',
    },
    {
      id: 'attachments',
      title: 'Block Attachments',
      summary: 'Hang exhibits directly on timeline events.',
      detail: 'Attach PDFs, images, and notes from your case archive to the block they explain. References stay live when files move within the vault.',
      highlights: ['Vault file links', 'Inline previews', 'Multi-attach'],
      feedsInto: 'Evidence trail',
    },
    {
      id: 'notes',
      title: 'Inline Research Notes',
      summary: 'Capture analysis without leaving the canvas.',
      detail: 'Add observations, hypotheses, and open questions on blocks or tiers — your working theory stays visible next to the dates and files.',
      highlights: ['Block notes', 'Tier annotations', 'Working theory'],
      feedsInto: 'Novel:: drafts',
    },
    {
      id: 'tiers',
      title: 'Multi-Tier Layout',
      summary: 'Parallel tracks for actors, themes, or phases.',
      detail: 'Stack tiers vertically when one timeline is not enough — witnesses, locations, and workstreams each get a row while sharing the same date axis.',
      highlights: ['Parallel tracks', 'Actor rows', 'Phase lanes'],
      feedsInto: 'Complex cases',
    },
    {
      id: 'gaps',
      title: 'Gap & Cluster Spotting',
      summary: 'See what is missing, not just what you have.',
      detail: 'Visual layout makes silent periods, duplicate dates, and isolated clusters obvious — the kinds of patterns folders hide.',
      highlights: ['Empty periods', 'Duplicate dates', 'Outliers'],
      feedsInto: 'Investigation leads',
    },
    {
      id: 'saves',
      title: 'Case-Linked Saves',
      summary: 'Maps persist with the matter they describe.',
      detail: 'Every save writes back to the owning case. Teammates opening the archive see the same map version — no orphaned project files.',
      highlights: ['Case persistence', 'Version in vault', 'Team handoff'],
      feedsInto: 'Archive · Novel::',
    },
  ],
  workflow: ['Extract', 'Convert', 'Archive', 'Map', 'Novel::', 'Audit'],
  integrationsTitle: 'How maps connect to Vault',
  capabilitiesTitle: 'Map canvas capabilities',
};

export const USE_CASES_PAGE = {
  headline: 'One Pipeline, Many Workflows',
  tagline: 'How different disciplines run the same Vault tools',
  description:
    'Investigators, researchers, archivists, and teams all work from the same case archive — but they stress different steps. Vault does not force one rigid workflow; it gives you a connected toolkit where extract, convert, map, write, and audit compose into the path your matter requires.',
  adaptPrinciples: [
    {
      label: 'Shared archive',
      text: 'Every discipline files into case folders. Maps, novels, and audits read the same evidence — no duplicate imports per tool.',
    },
    {
      label: 'Flexible emphasis',
      text: 'Academic work may lean on extract and Novel::; legal matters may prioritize convert, map, and audit. Skip steps that do not apply.',
    },
    {
      label: 'Composable handoffs',
      text: 'When a case passes to a teammate or outside reviewer, folder layout, linked maps, and written narratives carry context forward.',
    },
  ],
  disciplineSpotlights: [
    {
      id: 'investigator',
      title: 'Investigators & counsel',
      summary: 'Evidence-first when chronology must hold up.',
      detail:
        'Convert discovery media, file by matter, map witness and event timelines, audit PDFs before anything leaves your desk.',
      highlights: ['Convert', 'Map', 'Audit'],
    },
    {
      id: 'researcher',
      title: 'Researchers & academics',
      summary: 'Corpus-heavy work with argument over time.',
      detail:
        'Extract journal PDFs at citation-grade DPI, archive by chapter, map how claims evolve, draft narratives in Novel::.',
      highlights: ['Extract', 'Map', 'Novel::'],
    },
    {
      id: 'archivist',
      title: 'Archivists & librarians',
      summary: 'Collections that grow faster than folders scale.',
      detail:
        'Batch-convert donor scans, tag by accession, search the full corpus, audit metadata before volumes enter the catalog.',
      highlights: ['Convert', 'Search', 'Audit'],
    },
  ],
  workflowProfiles: [
    {
      label: 'Research-first',
      text: 'Extract corpora → Map argument timelines → Draft in Novel:: → Audit before publication.',
    },
    {
      label: 'Evidence-first',
      text: 'Convert discovery media → Archive by matter → Map chronology → Audit before disclosure.',
    },
    {
      label: 'Collection-first',
      text: 'Batch-convert incoming scans → Tag by collection → Search across volumes → Audit donor metadata.',
    },
  ],
  audiences: [
    { label: 'Investigators', detail: 'Matter archives, chronology maps, pre-release audit' },
    { label: 'Researchers', detail: 'Corpus extraction, argument timelines, publishable narratives' },
    { label: 'Legal teams', detail: 'Discovery conversion, witness maps, disclosure checks' },
    { label: 'Archivists', detail: 'Batch intake, collection search, donor metadata audit' },
  ],
  pipeline: ['Extract', 'Convert', 'Archive', 'Map', 'Novel::', 'Audit'],
  spotlightsTitle: 'Three common starting points',
  useCasesTitle: 'Disciplines & scenarios',
};

export const USE_CASES: (OnboardingRichItem & { tools: string[] })[] = [
  {
    id: 'academic',
    title: 'Academic Research',
    summary: 'Thesis work with hundreds of primary sources.',
    detail:
      'Extract journal PDFs at the DPI your citations require, archive by chapter or argument thread, map how claims evolve over time, and draft lit-review narratives in Novel:: with sources still linked.',
    highlights: ['Citation trails', 'Chapter folders', 'Timeline of claims'],
    tools: ['PDF Extract', 'Archive', 'Map', 'Novel::'],
    feedsInto: 'Thesis · publication',
    accent: 'purple',
  },
  {
    id: 'legal',
    title: 'Legal & Investigation',
    summary: 'Evidence packages that must hold up under scrutiny.',
    detail:
      'Convert discovery media into reviewable formats, organize by matter and witness, map event and testimony chronology, and audit PDFs for redaction gaps before anything leaves your desk.',
    highlights: ['Matter folders', 'Event chronology', 'Pre-filing audit'],
    tools: ['Convert', 'Archive', 'Map', 'Audit'],
    feedsInto: 'Disclosure · review',
    accent: 'cyan',
  },
  {
    id: 'analysis',
    title: 'Document Analysis',
    summary: 'Deep reads on lengthy or scanned PDF corpora.',
    detail:
      'Rasterize at high DPI, normalize exhibit formats in Conversion Studio, flag redaction and metadata risks with Audit, then attach findings to map blocks or Novel:: sections.',
    highlights: ['High-DPI extract', 'Format normalize', 'Risk scan'],
    tools: ['PDF Extract', 'Convert', 'Audit'],
    feedsInto: 'Analysis notes · map blocks',
    accent: 'purple',
  },
  {
    id: 'team',
    title: 'Team Handoffs',
    summary: 'Structured cases teammates can pick up cold.',
    detail:
      'Standard case layout, linked maps, and written narratives mean the next reviewer opens one folder and sees chronology, exhibits, and working theory — not scattered exports or mystery attachments.',
    highlights: ['Standard case layout', 'Narrative export', 'Linked maps'],
    tools: ['Archive', 'Map', 'Novel::'],
    feedsInto: 'Next reviewer · audit',
    accent: 'emerald',
  },
  {
    id: 'library',
    title: 'Digital Libraries',
    summary: 'Catalog collections that keep growing.',
    detail:
      'Batch-convert incoming donor scans, tag volumes by collection or accession, search across the full corpus from one workspace, and audit PDFs for hidden metadata before they enter the catalog.',
    highlights: ['Batch convert', 'Collection tags', 'Metadata audit'],
    tools: ['Convert', 'Archive', 'Search', 'Audit'],
    feedsInto: 'Catalog · discovery',
    accent: 'amber',
  },
  {
    id: 'project',
    title: 'Long-running Projects',
    summary: 'Multi-month work with shifting source types.',
    detail:
      'Start with PDF intake, add video conversion mid-stream as new media arrives, map emerging patterns on a living timeline, and publish interim findings in Novel:: without rebuilding the archive.',
    highlights: ['Mixed media', 'Evolving timeline', 'Interim reports'],
    tools: ['Extract', 'Convert', 'Map', 'Novel::'],
    feedsInto: 'Interim report · Novel::',
    accent: 'purple',
  },
];

export const GETTING_STARTED_PAGE = {
  headline: 'Your First Session in Vault',
  tagline: 'Six ordered steps from first PDF to share-ready output',
  description:
    'You do not need every module on day one — but following the pipeline in order means each step produces something concrete the next step can use. No dead-end exports, no re-importing the same PDF twice.',
  principles: [
    {
      label: 'Ordered steps',
      text: 'Extract before you archive; archive before you map. Each step assumes the output of the one before it.',
    },
    {
      label: 'Concrete outputs',
      text: 'Every step leaves you with something real — page images, normalized files, a case folder, a timeline, a draft, or an audit report.',
    },
    {
      label: 'Skip what you do not need',
      text: 'Not writing a narrative yet? Stop after Map. Only need disclosure checks? Jump to Audit once files are in the archive.',
    },
  ],
  sessionTips: [
    {
      label: 'Start with one PDF',
      text: 'Pick a single source document, extract a few pages, and file them before scaling to the full corpus.',
    },
    {
      label: 'Name the case early',
      text: 'Create the archive shell before maps and novels — every later module reads from that folder tree.',
    },
    {
      label: 'Audit last',
      text: 'Run security analysis on the exact files you plan to share, not on every working draft in the case.',
    },
  ],
  pipeline: ['Extract', 'Convert', 'Archive', 'Map', 'Novel::', 'Audit'],
  principlesTitle: 'Why order matters',
  tipsTitle: 'Session tips',
  stepperTitle: 'The six-step path',
};

export const GETTING_STARTED_STEPS: (OnboardingRichItem & { outcome: string })[] = [
  {
    id: 'step-extract',
    title: 'Extract PDF Pages',
    summary: 'Import your first source document.',
    detail:
      'Open PDF Extract, choose DPI and page range, run extraction, and review PNG output. Confirm quality before filing pages into a case.',
    highlights: ['Pick DPI', 'Page range', 'Review output'],
    outcome: 'Workable page images ready to file or convert.',
    feedsInto: 'Conversion Studio',
    accent: 'purple',
  },
  {
    id: 'step-convert',
    title: 'Run Conversion Studio',
    summary: 'Normalize formats your case requires.',
    detail:
      'Send images, GIFs, or video through the format matrix — from vault intake or an external drop zone. Assign outputs directly to a case folder.',
    highlights: ['Multi-format', 'Vault assign', 'Batch runs'],
    outcome: 'Exhibits in the formats your workflow expects.',
    feedsInto: 'Case archive',
    accent: 'cyan',
  },
  {
    id: 'step-archive',
    title: 'Create a Case Archive',
    summary: 'Establish the home for all case material.',
    detail:
      'Name the case, plan folders and tags, set a cover image. This folder tree becomes the hub every other module reads — maps, novels, and audits included.',
    highlights: ['Case shell', 'Folder plan', 'Tags'],
    outcome: 'A single source-of-truth folder tree.',
    feedsInto: 'Map workspace',
    accent: 'purple',
  },
  {
    id: 'step-map',
    title: 'Build Your First Map',
    summary: 'Lay out the timeline visually.',
    detail:
      'Add dated blocks, attach key files from the archive, and note gaps or contradictions on the canvas. Chronology stays linked to real exhibits.',
    highlights: ['Dated blocks', 'Attach exhibits', 'Inline notes'],
    outcome: 'A visual chronology linked to real files.',
    feedsInto: 'Novel::',
    accent: 'emerald',
  },
  {
    id: 'step-novel',
    title: 'Draft in Novel::',
    summary: 'Write the narrative your evidence supports.',
    detail:
      'Open spreads, insert case images from the archive, apply fonts and layout, and structure the story for export when you are ready to share findings.',
    highlights: ['Spread layout', 'Case images', 'Rich text'],
    outcome: 'A paginated narrative tied to your archive.',
    feedsInto: 'Audit',
    accent: 'amber',
  },
  {
    id: 'step-audit',
    title: 'Audit Before Sharing',
    summary: 'Verify PDFs are safe to release.',
    detail:
      'Run security analysis on outgoing documents — catch metadata leaks, hidden layers, and incomplete redactions before files leave your desk.',
    highlights: ['Redaction check', 'Metadata review', 'Risk flags'],
    outcome: 'Confidence before files leave your desk.',
    feedsInto: 'Share · disclose · publish',
    accent: 'purple',
  },
];

export const THEME_PAGE = {
  headline: 'Choose Your Workspace Look',
  tagline: 'Themes tuned for long research sessions',
  description:
    'Vault is built for hours of extraction, mapping, and writing — not quick pop-ins. Your theme controls contrast, surface depth, and accent intensity across every module. Pick what matches when and how you work; you can switch later in settings.',
  principles: [
    {
      label: 'Session length',
      text: 'Dark themes reduce glare during night review marathons. Light themes keep dense text readable under daylight or office lighting.',
    },
    {
      label: 'Change anytime',
      text: 'Your cases, maps, and novels are unchanged when you switch themes — only the interface chrome updates.',
    },
    {
      label: 'Same tools everywhere',
      text: 'Extract, Convert, Archive, Map, Novel::, and Audit all inherit the theme you choose here.',
    },
  ],
  guidance: [
    {
      label: 'Pick Brideware Purple when',
      text: 'You work in low light, review evidence for long stretches, or prefer high-contrast purple and cyan accents on deep surfaces.',
    },
    {
      label: 'Pick Pastel when',
      text: 'You write during the day, sit near bright windows, or want soft backgrounds that stay calm next to printed reference material.',
    },
  ],
  principlesTitle: 'Why theme choice matters',
  guidanceTitle: 'Which to choose',
  selectorTitle: 'Select a theme',
  readyMessage: 'Theme selected — Vault is ready when you are',
  dontShowLabel: "Don't show this onboarding again",
  options: [
    {
      id: 'brideware-purple',
      name: 'Brideware Purple',
      summary: 'Cinematic dark workspace with vivid accents.',
      detail:
        'Deep surfaces, purple-to-cyan gradients, and glass panels designed for focused night sessions and evidence review under low light.',
      bestFor: 'Low-light review marathons and focused night work',
      traits: ['High-contrast accents', 'Reduced eye strain', 'Cinematic depth'],
      highlights: ['Dark glass UI', 'Neon accents', 'Night-friendly'],
      chooseWhen: 'Evening sessions · evidence review',
    },
    {
      id: 'pastel',
      name: 'Pastel',
      summary: 'Soft light workspace for daytime density.',
      detail:
        'Bright surfaces, gentle purple tones, and calm reading density — ideal when you are writing, annotating, or working next to printed exhibits.',
      bestFor: 'Daytime writing, printing adjacency, and bright environments',
      traits: ['Soft surfaces', 'Light backgrounds', 'Calm reading density'],
      highlights: ['Light glass UI', 'Soft contrast', 'Day-friendly'],
      chooseWhen: 'Daytime writing · bright rooms',
    },
  ],
};

/** @deprecated Use THEME_PAGE — kept for any external references */
export const THEME_CONTENT = THEME_PAGE;
