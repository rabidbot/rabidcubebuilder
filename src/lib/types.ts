export interface ScryfallCard {
  id: string;
  oracle_id: string;
  name: string;
  mana_cost: string;
  cmc: number;
  type_line: string;
  oracle_text: string;
  colors: string[];
  color_identity: string[];
  keywords: string[];
  power: string;
  toughness: string;
  loyalty: string;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  scryfall_uri: string;
  image_uris?: Record<string, string>;
  card_faces?: Array<{
    name: string;
    mana_cost: string;
    type_line: string;
    oracle_text: string;
    image_uris?: Record<string, string>;
  }>;
  prices: Record<string, string>;
  legalities: Record<string, string>;
  produced_mana?: string[];
  released_at: string;
}

export type CubeType = 'powered' | 'unpowered' | 'legacy' | 'modern' | 'peasant' | 'pauper' | 'theme' | 'custom';

export type ArchetypeKey = 'WU' | 'UB' | 'BR' | 'RG' | 'GW' | 'WB' | 'UR' | 'BG' | 'RW' | 'UG';

export type CubeSize = 360 | 450 | 540 | 720;

export type BuildMode = 1 | 2 | 3 | 4;

export interface CubeConfig {
  size: CubeSize;
  cubeType: CubeType;
  powerLevel: number;
  selectedArchetypes: ArchetypeKey[];
  formatRestrictions: string[];
  budgetCeiling: number | null;
  bannedCards: string[];
  bannedSets: string[];
  themeKeywords: string[];
  mode: BuildMode;
}

export interface ArchetypeFit {
  archetype: ArchetypeKey;
  score: number;
  reasons: string[];
}

export interface CubeCard {
  scryfallData: ScryfallCard;
  archetypeFits: ArchetypeFit[];
  powerScore: number;
  curveBucket: CurveBucket;
  colorIdentity: string[];
  isSignpost: boolean;
  primaryArchetype: ArchetypeKey | null;
  effectCategory: string;
  effectScope: string;
  locked: boolean;
}

export type CurveBucket = 'low' | 'mid' | 'high' | 'finisher';

export type ColorSlot = 'W' | 'U' | 'B' | 'R' | 'G' | 'multi' | 'colorless' | 'land';

export interface CubeSlot {
  color: ColorSlot;
  allocated: number;
  filled: number;
  cardIds: string[];
  curveBreakdown: Record<CurveBucket, number>;
}

export interface CurveData {
  low: number;
  mid: number;
  high: number;
  finisher: number;
}

export interface CubeGap {
  archetype: ArchetypeKey;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestedCards: string[];
}

export interface CubeAnalysis {
  colorBalance: Record<string, number>;
  manaCurve: {
    overall: CurveData;
    byColor: Record<string, CurveData>;
  };
  archetypeCoverage: Record<ArchetypeKey, {
    cardCount: number;
    synergyDensity: number;
    payoffs: number;
    enablers: number;
  }>;
  powerDistribution: {
    min: number;
    max: number;
    mean: number;
    median: number;
    histogram: number[];
  };
  fixingLandCount: number;
  gaps: CubeGap[];
  synergyConnections: Array<{ cardA: string; cardB: string; archetype: ArchetypeKey }>;
}

export interface Cube {
  id: string;
  name: string;
  config: CubeConfig;
  cubeCards: CubeCard[];
  slots: CubeSlot[];
  analysis: CubeAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionEntry {
  csvRow: Record<string, string>;
  scryfallData: ScryfallCard;
  quantity: number;
}

export interface ArchetypeDefinition {
  key: ArchetypeKey;
  name: string;
  colors: string[];
  keywords: string[];
  oraclePatterns: RegExp[];
  typePatterns: RegExp[];
  cmcPenalty: boolean;
  signatureCards: string[];
  signpostUncommons: string[];
}

export interface ScryfallFetchResult {
  ok: boolean;
  data?: unknown;
  error?: string;
}

export interface ScryfallSearchResult {
  ok: boolean;
  cards?: ScryfallCard[];
  total?: number;
  error?: string;
}

export interface ScryfallBatchResult {
  ok: boolean;
  cards?: ScryfallCard[];
  error?: string;
}

export interface FileReadResult {
  ok: boolean;
  content?: string;
  error?: string;
}

export interface FileWriteResult {
  ok: boolean;
  error?: string;
}

export interface CubeBuildProgress {
  phase: number;
  message: string;
  percent: number;
}
