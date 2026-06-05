import type {
  ScryfallCard, CubeConfig, CubeCard, CubeSlot, Cube, CubeAnalysis,
  CubeGap, ArchetypeKey, CurveBucket, ColorSlot, CurveData,
} from './types';
import { computeAllFits, getPrimaryArchetype, extractEffectTaxonomy, ARCHETYPE_DEFINITIONS } from './archetype-matcher';
import { KNOWN_CUBE_STAPLES, SIGNPOST_UNCOMMONS, FIXING_LAND_TIERS } from './cube-seeds';
import { getOracleText, getTypeLine, getColorIdentity, getCurveBucket, isLandCard } from './card-utils';
import { searchCards } from './scryfall';

export interface BuildCallbacks {
  onProgress: (phase: number, message: string, percent: number) => void;
  cancelled: () => boolean;
}

const MAX_CANDIDATES = 2000;

function neutralConfig(): CubeConfig {
  return {
    size: 360,
    cubeType: 'modern',
    powerLevel: 5,
    selectedArchetypes: ['WU', 'UB', 'BR', 'RG', 'GW', 'WB', 'UR', 'BG', 'RW', 'UG'],
    formatRestrictions: [],
    budgetCeiling: null,
    bannedCards: [],
    bannedSets: [],
    themeKeywords: [],
    mode: 4,
  };
}

function archKeyToPair(key: ArchetypeKey): string[] {
  return key === 'WU' ? ['W','U'] : key === 'UB' ? ['U','B'] : key === 'BR' ? ['B','R']
    : key === 'RG' ? ['R','G'] : key === 'GW' ? ['G','W'] : key === 'WB' ? ['W','B']
    : key === 'UR' ? ['U','R'] : key === 'BG' ? ['B','G'] : key === 'RW' ? ['R','W']
    : ['U','G'];
}

export async function buildCube(
  config: CubeConfig,
  cardPool: ScryfallCard[],
  callbacks: BuildCallbacks,
): Promise<Cube> {
  const cfg = { ...neutralConfig(), ...config };

  callbacks.onProgress(1, 'Enriching cards...', 5);
  if (callbacks.cancelled()) throw new Error('Build cancelled');

  let candidates: CubeCard[] = cardPool.map((scryfallData) => ({
    scryfallData,
    archetypeFits: [],
    powerScore: 0,
    curveBucket: getCurveBucket(scryfallData.cmc || 0),
    colorIdentity: getColorIdentity(scryfallData),
    isSignpost: false,
    primaryArchetype: null,
    effectCategory: '',
    effectScope: '',
    locked: false,
  }));

  callbacks.onProgress(2, 'Scoring archetype fits...', 10);
  for (let i = 0; i < candidates.length; i++) {
    const card = candidates[i];
    card.archetypeFits = computeAllFits(card.scryfallData);
    card.primaryArchetype = getPrimaryArchetype(card.archetypeFits);
    const tax = extractEffectTaxonomy(card.scryfallData);
    card.effectCategory = tax.category;
    card.effectScope = tax.scope;
    if (i > 0 && (i % 200 === 0 || i === candidates.length - 1)) {
      await new Promise((r) => setTimeout(r, 0));
      if (callbacks.cancelled()) throw new Error('Build cancelled');
    }
  }

  callbacks.onProgress(3, 'Calculating power scores...', 20);
  for (const card of candidates) {
    card.powerScore = computePowerScore(card.scryfallData, cfg);
    card.isSignpost = isSignpostCard(card.scryfallData.name);
  }

  callbacks.onProgress(4, 'Applying filters...', 25);
  candidates = filterCandidates(candidates, cfg);
  if (candidates.length > MAX_CANDIDATES) {
    candidates.sort((a, b) => b.powerScore - a.powerScore);
    candidates = candidates.slice(0, MAX_CANDIDATES);
  }
  if (callbacks.cancelled()) throw new Error('Build cancelled');

  callbacks.onProgress(5, 'Allocating color slots...', 30);
  const slots = allocateSlots(cfg);
  const selectedArches = cfg.selectedArchetypes.length > 0
    ? cfg.selectedArchetypes
    : ['WU','UB','BR','RG','GW','WB','UR','BG','RW','UG'];

  callbacks.onProgress(6, 'Selecting cards...', 35);
  const { selectedIds } = greedySlotSelection(candidates, slots, cfg, selectedArches, callbacks);
  if (callbacks.cancelled()) throw new Error('Build cancelled');

  callbacks.onProgress(7, 'Selecting fixing lands...', 65);
  const landIds = selectFixingLands(cfg, selectedArches, candidates);
  for (const id of landIds) {
    if (!selectedIds.has(id)) {
      selectedIds.add(id);
      const slot = slots.find((s) => s.color === 'land');
      if (slot) {
        slot.filled++;
        slot.cardIds.push(id);
        const card = candidates.find((c) => c.scryfallData.id === id);
        if (card) slot.curveBreakdown[card.curveBucket]++;
      }
    }
  }

  callbacks.onProgress(8, 'Injecting signpost uncommons...', 75);
  injectSignposts(candidates, slots, selectedIds, selectedArches);

  callbacks.onProgress(9, 'Validating synergy density...', 85);
  const selectedCards = candidates.filter((c) => selectedIds.has(c.scryfallData.id));
  const analysis = analyzeCube(selectedCards, slots, cfg, selectedArches);

  if (callbacks.cancelled()) throw new Error('Build cancelled');

  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: `Cube ${now.slice(0, 10)}`,
    config: cfg,
    cubeCards: selectedCards,
    slots,
    analysis,
    createdAt: now,
    updatedAt: now,
  };
}

export function findCandidateCards(
  config: CubeConfig,
  callbacks: BuildCallbacks,
): Promise<ScryfallCard[]> {
  return findCardsForCube(config, callbacks);
}

export async function findCardsForCube(
  config: CubeConfig,
  callbacks: BuildCallbacks,
): Promise<ScryfallCard[]> {
  const queries: string[] = [];

  for (const kw of config.themeKeywords) {
    queries.push(`(o:"${kw}" OR t:"${kw}")`);
  }

  const formatQuery = config.formatRestrictions
    .map((f) => `f:${f}`)
    .join(' ');

  const cubeTypeQuery = buildCubeTypeQuery(config.cubeType);

  const parts = [cubeTypeQuery];
  if (formatQuery) parts.push(`(${formatQuery})`);
  if (queries.length > 0) parts.push(`(${queries.join(' OR ')})`);

  const query = parts.join(' ');

  if (!query.trim()) {
    const broadQueries = ['f:modern', 'f:legacy', 'f:vintage'];
    for (const q of broadQueries) {
      const result = await searchCards(q, 3);
      if (result.cards.length > 0) return result.cards;
    }
    return [];
  }

  callbacks.onProgress(0, `Searching Scryfall: ${query}`, 2);
  const result = await searchCards(query, 8);
  return result.cards;
}

function buildCubeTypeQuery(cubeType: string): string {
  switch (cubeType) {
    case 'powered': return 'f:vintage';
    case 'unpowered': return 'f:vintage';
    case 'legacy': return 'f:legacy';
    case 'modern': return 'f:modern';
    case 'peasant': return 'r<=uncommon';
    case 'pauper': return 'r:common';
    case 'theme': return '';
    case 'custom': return '';
    default: return 'f:modern';
  }
}

function computePowerScore(card: ScryfallCard, config: CubeConfig): number {
  const nameLower = (card.name || '').toLowerCase();

  const staple = KNOWN_CUBE_STAPLES.find(
    (s) => s.name.toLowerCase() === nameLower,
  );
  if (staple) return staple.powerScore;

  let score = 0.3;
  const oracle = getOracleText(card).toLowerCase().replace(/\n/g, ' ');
  const typeLine = getTypeLine(card).toLowerCase();

  switch (card.rarity) {
    case 'common': score += 0.05; break;
    case 'uncommon': score += 0.15; break;
    case 'rare': score += 0.25; break;
    case 'mythic': score += 0.35; break;
  }

  if (/search your library for (a|any) (card|permanent)/i.test(oracle)) score += 0.15;
  if (/draw (three|four|\d+) cards/i.test(oracle)) score += 0.12;
  if (/exile all (nonland )?permanents/i.test(oracle)) score += 0.2;
  if (/(destroy|exile) all creatures/i.test(oracle)) score += 0.1;
  if (/extra turn/i.test(oracle)) score += 0.18;
  if (/you win the game/i.test(oracle)) score += 0.2;

  const cmc = card.cmc || 0;
  if (typeLine.includes('creature') && card.power && card.toughness) {
    const pow = parseFloat(card.power) || 0;
    const tough = parseFloat(card.toughness) || 0;
    const rate = (pow + tough) / Math.max(1, cmc);
    if (rate >= 3) score += 0.15;
    else if (rate >= 2) score += 0.08;
  }

  if (cmc <= 1 && !typeLine.includes('land')) score += 0.05;
  if (cmc >= 8 && typeLine.includes('creature') && (parseInt(card.power) || 0) >= 6) score += 0.1;

  if (config.cubeType === 'pauper') score = Math.min(0.6, score);
  if (config.cubeType === 'peasant') score = Math.min(0.75, score);

  return Math.max(0, Math.min(1, score));
}

function isSignpostCard(name: string): boolean {
  return SIGNPOST_UNCOMMONS.some((s) => s.name.toLowerCase() === name.toLowerCase());
}

function filterCandidates(cards: CubeCard[], config: CubeConfig): CubeCard[] {
  return cards.filter((card) => {
    const nameLower = card.scryfallData.name.toLowerCase();
    if (config.bannedCards.some((b) => b.toLowerCase() === nameLower)) return false;
    if (config.bannedSets.length > 0 && card.scryfallData.set) {
      if (config.bannedSets.some((s) => s.toLowerCase() === card.scryfallData.set.toLowerCase())) return false;
    }
    if (isBasicLandCard(card.scryfallData)) return false;
    if (config.budgetCeiling !== null) {
      const price = parseFloat(card.scryfallData.prices?.usd || '0') || 0;
      if (price > config.budgetCeiling) return false;
    }
    if (config.formatRestrictions.length > 0) {
      const legalities = card.scryfallData.legalities || {};
      const allLegal = config.formatRestrictions.every((f) => {
        const status = (legalities[f] || '').toLowerCase();
        return status === 'legal';
      });
      if (!allLegal) return false;
    }
    const powerCeiling = config.powerLevel / 10;
    if (card.powerScore > powerCeiling + 0.2) return false;
    const hasArchetypeFit = card.archetypeFits.some((f) => f.score >= 0.1);
    if (!hasArchetypeFit && !isLandCard(card.scryfallData)) return false;
    return true;
  });
}

export function isBasicLandCard(card: ScryfallCard): boolean {
  return /basic land/i.test(getTypeLine(card));
}

function allocateSlots(config: CubeConfig): CubeSlot[] {
  const size = config.size;
  const scale = size / 360;

  const slots: CubeSlot[] = [
    { color: 'W', allocated: Math.round(54 * scale), filled: 0, cardIds: [], curveBreakdown: { low: 0, mid: 0, high: 0, finisher: 0 } },
    { color: 'U', allocated: Math.round(54 * scale), filled: 0, cardIds: [], curveBreakdown: { low: 0, mid: 0, high: 0, finisher: 0 } },
    { color: 'B', allocated: Math.round(54 * scale), filled: 0, cardIds: [], curveBreakdown: { low: 0, mid: 0, high: 0, finisher: 0 } },
    { color: 'R', allocated: Math.round(54 * scale), filled: 0, cardIds: [], curveBreakdown: { low: 0, mid: 0, high: 0, finisher: 0 } },
    { color: 'G', allocated: Math.round(54 * scale), filled: 0, cardIds: [], curveBreakdown: { low: 0, mid: 0, high: 0, finisher: 0 } },
    { color: 'multi', allocated: Math.round(60 * scale), filled: 0, cardIds: [], curveBreakdown: { low: 0, mid: 0, high: 0, finisher: 0 } },
    { color: 'colorless', allocated: Math.round(20 * scale), filled: 0, cardIds: [], curveBreakdown: { low: 0, mid: 0, high: 0, finisher: 0 } },
    { color: 'land', allocated: Math.round(10 * scale), filled: 0, cardIds: [], curveBreakdown: { low: 0, mid: 0, high: 0, finisher: 0 } },
  ];

  return slots;
}

function greedySlotSelection(
  candidates: CubeCard[],
  slots: CubeSlot[],
  config: CubeConfig,
  selectedArches: ArchetypeKey[],
  callbacks: BuildCallbacks,
): { slotMap: Map<string, ColorSlot>; selectedIds: Set<string> } {
  const selectedIds = new Set<string>();
  const slotMap = new Map<string, ColorSlot>();
  const usedNames = new Set<string>();

  for (const slot of slots) {
    if (slot.color === 'land') continue;
    const color = slot.color;

    const pool = candidates.filter((c) => {
      if (selectedIds.has(c.scryfallData.id)) return false;
      const nameLower = c.scryfallData.name.toLowerCase();
      if (usedNames.has(nameLower)) return false;
      return cardFitsSlot(c, color, config, selectedArches);
    });

    scratchDuplicateEffects(pool);

    pool.sort((a, b) => {
      const aScore = cardSelectionScore(a, slot, selectedArches);
      const bScore = cardSelectionScore(b, slot, selectedArches);
      return bScore - aScore;
    });

    const targetCount = slot.allocated;
    for (const card of pool) {
      if (slot.filled >= targetCount) break;
      if (callbacks.cancelled()) break;
      const nameLower = card.scryfallData.name.toLowerCase();
      if (usedNames.has(nameLower)) continue;

      slot.cardIds.push(card.scryfallData.id);
      slot.filled++;
      slot.curveBreakdown[card.curveBucket]++;
      selectedIds.add(card.scryfallData.id);
      slotMap.set(card.scryfallData.id, color);
      usedNames.add(nameLower);
    }
  }

  return { slotMap, selectedIds };
}

function cardFitsSlot(
  card: CubeCard,
  color: ColorSlot,
  config: CubeConfig,
  selectedArches: ArchetypeKey[],
): boolean {
  const ci = card.colorIdentity;
  const cardColors = (card.scryfallData.colors || []).map((c) => c.toUpperCase());

  switch (color) {
    case 'W': return ci.includes('W') && ci.length === 1;
    case 'U': return ci.includes('U') && ci.length === 1;
    case 'B': return ci.includes('B') && ci.length === 1;
    case 'R': return ci.includes('R') && ci.length === 1;
    case 'G': return ci.includes('G') && ci.length === 1;
    case 'multi': {
      if (cardColors.length < 2) return false;
      return selectedArches.some((arch) => {
        const archColors = archKeyToPair(arch);
        return archColors.every((c) => cardColors.includes(c)) && cardColors.every((c) => archColors.includes(c));
      });
    }
    case 'colorless': return ci.length === 0;
    default: return false;
  }
}

function scratchDuplicateEffects(pool: CubeCard[]): void {
  const seen = new Map<string, number>();
  for (const card of pool) {
    const key = `${card.effectCategory}|${card.effectScope}`;
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  for (const card of pool) {
    const key = `${card.effectCategory}|${card.effectScope}`;
    const count = seen.get(key) || 1;
    if (count > 2) {
      card.powerScore *= 0.85;
    }
  }
}

function cardSelectionScore(
  card: CubeCard,
  slot: CubeSlot,
  selectedArches: ArchetypeKey[],
): number {
  const archFit = selectedArches.reduce((sum, arch) => {
    const fit = card.archetypeFits.find((f) => f.archetype === arch);
    return sum + (fit ? fit.score : 0);
  }, 0) / Math.max(1, selectedArches.length);

  const curveNeed = getCurveNeed(slot, card.curveBucket);

  const uniqueness = 1 - Math.min(1, slot.filled * 0.002);

  if (card.isSignpost) return 1.5;
  return archFit * 0.4 + card.powerScore * 0.3 + curveNeed * 0.2 + uniqueness * 0.1;
}

function getCurveNeed(slot: CubeSlot, bucket: CurveBucket): number {
  if (slot.allocated === 0) return 0.5;

  const target: Record<CurveBucket, number> = {
    low: 0.15,
    mid: 0.25,
    high: 0.25,
    finisher: 0.20,
  };

  const current = slot.curveBreakdown[bucket] / Math.max(1, slot.filled);
  const targetPct = target[bucket];
  return Math.max(0, targetPct - current);
}

function selectFixingLands(
  config: CubeConfig,
  selectedArches: ArchetypeKey[],
  candidates: CubeCard[],
): string[] {
  const selectedIds: string[] = [];
  const supportedPairs = new Set(selectedArches.map((a) => {
    const p = archKeyToPair(a).sort().join('');
    return p;
  }));

  for (const tier of FIXING_LAND_TIERS) {
    if (!tier.cubeTypes.includes(config.cubeType) && config.cubeType !== 'custom' && config.cubeType !== 'theme') continue;

    for (const landName of tier.lands) {
      const card = candidates.find((c) => c.scryfallData.name.toLowerCase() === landName.toLowerCase());
      if (!card || selectedIds.includes(card.scryfallData.id)) continue;

      const landColors = (card.scryfallData.colors || []).map((c) => c.toUpperCase()).sort();
      const produced = card.scryfallData.produced_mana || [];
      const producedColors = produced.filter((x) => x !== 'C').sort().join('');
      const relevant = (landColors.length === 2 && supportedPairs.has(landColors.join('')))
        || (producedColors.length > 0 && supportedPairs.has(producedColors));

      if (relevant || !landColors.length) {
        selectedIds.push(card.scryfallData.id);
        if (selectedIds.length >= 10) return selectedIds;
      }
    }
  }

  return selectedIds;
}

function injectSignposts(
  candidates: CubeCard[],
  slots: CubeSlot[],
  selectedIds: Set<string>,
  selectedArches: ArchetypeKey[],
): void {
  for (const arch of selectedArches) {
    const signposts = SIGNPOST_UNCOMMONS.filter((s) => s.archetype === arch);
    let injected = 0;
    for (const sp of signposts) {
      if (injected >= 2) break;
      const card = candidates.find((c) =>
        c.scryfallData.name.toLowerCase() === sp.name.toLowerCase()
        && !selectedIds.has(c.scryfallData.id),
      );
      if (!card) continue;

      const multiSlot = slots.find((s) => s.color === 'multi');
      if (multiSlot && multiSlot.filled < multiSlot.allocated) {
        multiSlot.cardIds.push(card.scryfallData.id);
        multiSlot.filled++;
        multiSlot.curveBreakdown[card.curveBucket]++;
        selectedIds.add(card.scryfallData.id);
        injected++;
      }
    }
    if (injected === 0) {
      const pool = candidates.filter((c) =>
        !selectedIds.has(c.scryfallData.id)
        && c.primaryArchetype === arch
        && c.powerScore >= 0.4,
      );
      pool.sort((a, b) => b.powerScore - a.powerScore);
      for (const card of pool.slice(0, 2)) {
        const multiSlot = slots.find((s) => s.color === 'multi');
        if (!multiSlot || multiSlot.filled >= multiSlot.allocated) break;
        multiSlot.cardIds.push(card.scryfallData.id);
        multiSlot.filled++;
        multiSlot.curveBreakdown[card.curveBucket]++;
        selectedIds.add(card.scryfallData.id);
      }
    }
  }
}

export function analyzeCube(
  cards: CubeCard[],
  slots: CubeSlot[],
  config: CubeConfig,
  selectedArches: ArchetypeKey[],
): CubeAnalysis {
  const colorBalance: Record<string, number> = {};
  for (const slot of slots) {
    colorBalance[slot.color] = slot.filled;
  }

  const overallCurve: CurveData = { low: 0, mid: 0, high: 0, finisher: 0 };
  const byColor: Record<string, CurveData> = {};
  for (const slot of slots) {
    const cd: CurveData = {
      low: slot.curveBreakdown.low,
      mid: slot.curveBreakdown.mid,
      high: slot.curveBreakdown.high,
      finisher: slot.curveBreakdown.finisher,
    };
    byColor[slot.color] = cd;
    overallCurve.low += slot.curveBreakdown.low;
    overallCurve.mid += slot.curveBreakdown.mid;
    overallCurve.high += slot.curveBreakdown.high;
    overallCurve.finisher += slot.curveBreakdown.finisher;
  }

  const archetypeCoverage = {} as CubeAnalysis['archetypeCoverage'];
  for (const arch of selectedArches) {
    const archCards = cards.filter((c) => {
      const fit = c.archetypeFits.find((f) => f.archetype === arch);
      return fit && fit.score >= 0.2;
    });

    const payoffs = archCards.filter((c) =>
      /you win the game|each opponent loses|extra turn|extra combat|overrun/i.test(
        getOracleText(c.scryfallData).toLowerCase().replace(/\n/g, ' '),
      ),
    ).length;

    const enablers = archCards.filter((c) =>
      /whenever|at the beginning|enters the battlefield/i.test(
        getOracleText(c.scryfallData).toLowerCase().replace(/\n/g, ' '),
      ),
    ).length;

    const density = calculateSynergyDensityForArchetype(archCards, arch);
    archetypeCoverage[arch] = {
      cardCount: archCards.length,
      synergyDensity: density,
      payoffs,
      enablers,
    };
  }

  const scores = cards.map((c) => c.powerScore).sort((a, b) => a - b);
  const histogram = [0, 0, 0, 0, 0];
  for (const s of scores) {
    const bucket = Math.min(4, Math.floor(s * 5));
    if (bucket >= 0 && bucket < 5) histogram[bucket]++;
  }

  const powerDistribution = {
    min: scores[0] || 0,
    max: scores[scores.length - 1] || 0,
    mean: scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length),
    median: scores[Math.floor(scores.length / 2)] || 0,
    histogram,
  };

  const fixingLandCount = cards.filter((c) => {
    const tl = getTypeLine(c.scryfallData).toLowerCase();
    const oracle = getOracleText(c.scryfallData).toLowerCase().replace(/\n/g, ' ');
    return tl.includes('land') && (
      /add one mana of any color|add \{.+\}.*\{.+\}|\{t\}: add \{.+\}/i.test(oracle)
    );
  }).length;

  const gaps = detectGaps(archetypeCoverage, selectedArches, cards);

  const synergyConnections = findSynergyConnections(cards, selectedArches);

  return {
    colorBalance,
    manaCurve: { overall: overallCurve, byColor },
    archetypeCoverage,
    powerDistribution,
    fixingLandCount,
    gaps,
    synergyConnections,
  };
}

function calculateSynergyDensityForArchetype(cards: CubeCard[], arch: ArchetypeKey): number {
  if (cards.length === 0) return 0;
  let connections = 0;
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cardsShareSynergy(cards[i], cards[j], arch)) {
        connections++;
      }
    }
  }
  return Math.min(10, connections / Math.max(1, cards.length) * 2);
}

function cardsShareSynergy(a: CubeCard, b: CubeCard, arch: ArchetypeKey): boolean {
  const def = ARCHETYPE_DEFINITIONS.find((d) => d.key === arch);
  if (!def) return false;

  const oracleA = getOracleText(a.scryfallData).toLowerCase().replace(/\n/g, ' ');
  const oracleB = getOracleText(b.scryfallData).toLowerCase().replace(/\n/g, ' ');

  for (const kw of def.keywords) {
    try {
      const re = new RegExp(kw, 'i');
      if (re.test(oracleA) && re.test(oracleB)) return true;
    } catch { continue; }
  }

  if (a.effectCategory === 'ramp' && b.effectCategory === 'creature' && b.scryfallData.cmc >= 5) return true;
  if (a.effectCategory === 'token' && /creatures you control get/i.test(oracleB)) return true;
  if (a.effectCategory === 'recursion' && /whenever.*dies/i.test(oracleB)) return true;

  return false;
}

function detectGaps(
  coverage: CubeAnalysis['archetypeCoverage'],
  selectedArches: ArchetypeKey[],
  cards: CubeCard[],
): CubeGap[] {
  const gaps: CubeGap[] = [];

  for (const arch of selectedArches) {
    const data = coverage[arch];
    if (!data) continue;

    const def = ARCHETYPE_DEFINITIONS.find((d) => d.key === arch);
    if (!def) continue;

    if (data.cardCount < 8) {
      gaps.push({
        archetype: arch,
        severity: 'critical',
        message: `${def.name} has only ${data.cardCount} cards — needs at least 8`,
        suggestedCards: def.signpostUncommons,
      });
    }

    if (data.synergyDensity < 1.5 && data.cardCount >= 5) {
      gaps.push({
        archetype: arch,
        severity: 'warning',
        message: `${def.name} has low synergy density (${data.synergyDensity.toFixed(1)})`,
        suggestedCards: def.signpostUncommons,
      });
    }

    if (data.payoffs < 2) {
      gaps.push({
        archetype: arch,
        severity: 'info',
        message: `${def.name} has only ${data.payoffs} payoff cards — consider adding finishers`,
        suggestedCards: def.signatureCards.filter((n) => {
          const c = cards.find((x) => x.scryfallData.name.toLowerCase() === n.toLowerCase());
          return c && /you win|each opponent loses|extra turn|extra combat/i.test(
            getOracleText(c.scryfallData).toLowerCase(),
          );
        }),
      });
    }

    if (data.enablers < data.payoffs && data.payoffs >= 2) {
      gaps.push({
        archetype: arch,
        severity: 'warning',
        message: `${def.name} has ${data.payoffs} payoffs but only ${data.enablers} enablers`,
        suggestedCards: def.signpostUncommons,
      });
    }
  }

  return gaps;
}

function findSynergyConnections(
  cards: CubeCard[],
  selectedArches: ArchetypeKey[],
): Array<{ cardA: string; cardB: string; archetype: ArchetypeKey }> {
  const connections: Array<{ cardA: string; cardB: string; archetype: ArchetypeKey }> = [];

  for (const arch of selectedArches) {
    const archCards = cards.filter((c) => {
      const fit = c.archetypeFits.find((f) => f.archetype === arch);
      return fit && fit.score >= 0.2;
    });

    for (let i = 0; i < archCards.length; i++) {
      for (let j = i + 1; j < archCards.length; j++) {
        if (cardsShareSynergy(archCards[i], archCards[j], arch)) {
          connections.push({
            cardA: archCards[i].scryfallData.name,
            cardB: archCards[j].scryfallData.name,
            archetype: arch,
          });
        }
      }
    }
  }

  return connections.slice(0, 200);
}
