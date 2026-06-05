import type { ScryfallCard, ArchetypeKey, ArchetypeFit, ArchetypeDefinition } from './types';
import { getOracleText, getTypeLine, getColorIdentity } from './card-utils';

export const ARCHETYPE_DEFINITIONS: ArchetypeDefinition[] = [
  {
    key: 'WU', name: 'Artifacts / Flicker / Control',
    colors: ['W', 'U'],
    keywords: ['artifact', 'flicker', 'blink', 'exile', 'enters the battlefield', 'counter target',
               'tap target creature', 'return target creature to', 'draw a card'],
    oraclePatterns: [
      /\benters the battlefield\b/i,
      /\bwhenever (a|an) (creature|artifact) enters the battlefield\b/i,
      /\breturn (target )?(creature|permanent) (you control )?to (its|your) (owner's )?hand\b/i,
      /\bexile.*return.*battlefield\b/i,
      /\bartifacts? you control\b/i,
      /\bwhenever you cast an artifact\b/i,
      /\bcounter target\b/i,
      /\bdraw a card\b/i,
    ],
    typePatterns: [
      /\bartifact creature\b/i,
      /\bartifact\b(?!.*creature)/i,
      /\bwizard\b/i,
    ],
    cmcPenalty: false,
    signatureCards: ['Soulherder', 'Baleful Strix', 'Urza, Lord High Artificer', 'Teferi, Time Raveler'],
    signpostUncommons: ['Soulherder', 'Cloudblazer', 'Reflector Mage'],
  },
  {
    key: 'UB', name: 'Reanimator / Control',
    colors: ['U', 'B'],
    keywords: ['graveyard', 'reanimate', 'return target.*graveyard', 'discard', 'mill',
               'destroy target', 'counter target', 'draw a card and lose'],
    oraclePatterns: [
      /\breturn target creature card from (a|your) graveyard\b/i,
      /\bput target creature card from (a|your) graveyard\b/i,
      /\bwhenever (a|an) creature (card|you control) (is put|dies)\b/i,
      /\bdiscard a card\b/i,
      /\bmill \d+\b/i,
      /\breveal the top \d+ cards?\b/i,
      /\bcounter target\b/i,
      /\bdestroy target\b/i,
    ],
    typePatterns: [
      /\bzombie\b/i,
      /\brogue\b/i,
      /\bhorror\b/i,
    ],
    cmcPenalty: false,
    signatureCards: ['Baleful Strix', 'The Scarab God', 'Reanimate', 'Entomb', 'Tasigur, the Golden Fang'],
    signpostUncommons: ['Baleful Strix', 'Dimir Charm', 'Fallen Shinobi'],
  },
  {
    key: 'BR', name: 'Sacrifice / Aggro',
    colors: ['B', 'R'],
    keywords: ['sacrifice', 'dies', 'token', 'haste', 'deal damage', 'goblin', 'vampire',
               'whenever.*sacrifice', 'aristocrat'],
    oraclePatterns: [
      /\bsacrifice (a|another) (creature|permanent)\b/i,
      /\bwhenever (a|another creature|each creature) (you control )?dies\b/i,
      /\bwhenever you sacrifice\b/i,
      /\bcreate (a|two|a \d+\/\d+) \w+ (creature|goblin|zombie|elemental) token\b/i,
      /\bhaste\b/i,
      /\bdeal \d+ damage to any target\b/i,
      /\bwhenever (a|an) creature you control (attacks|deals combat damage)\b/i,
    ],
    typePatterns: [
      /\bgoblin\b/i,
      /\bvampire\b/i,
      /\bbarbarian\b/i,
    ],
    cmcPenalty: true,
    signatureCards: ['Mayhem Devil', 'Blood Artist', 'Goblin Rabblemaster', 'Kolaghan\'s Command'],
    signpostUncommons: ['Terminate', 'Mayhem Devil', 'Dreadbore'],
  },
  {
    key: 'RG', name: 'Ramp / Stompy / Aggro',
    colors: ['R', 'G'],
    keywords: ['ramp', 'search.*land', 'haste', 'trample', 'large creature', 'deal damage',
               'mana dork', 'elf', 'stompy'],
    oraclePatterns: [
      /\badd \{g\}.*\{r\}|\{r\}.*\{g\}\b/i,
      /\bsearch your library for (a|up to).*(?:(?!land).)*and put.*onto the battlefield\b/i,
      /\bhaste\b/i,
      /\btrample\b/i,
      /\b(deals? \d+ damage to |fight target)\b/i,
      /\bcreatures? you control (get|have) \+\d/i,
      /\bwhenever (a|an) creature with power \d or greater\b/i,
      /\btap (an untapped|target) .*: add/i,
    ],
    typePatterns: [
      /\belf\b/i,
      /\bbeast\b/i,
      /\bdinosaur\b/i,
      /\bdragon\b/i,
    ],
    cmcPenalty: true,
    signatureCards: ['Bloodbraid Elf', 'Huntmaster of the Fells', 'Llanowar Elves', 'Craterhoof Behemoth'],
    signpostUncommons: ['Bloodbraid Elf', 'Rhythm of the Wild', 'Gruul Spellbreaker'],
  },
  {
    key: 'GW', name: 'Tokens / Counters / Go-Wide',
    colors: ['G', 'W'],
    keywords: ['token', '+1/+1 counter', 'anthem', 'populate', 'convoke', 'go-wide',
               'creatures you control get', 'saproling', 'soldier'],
    oraclePatterns: [
      /\bcreate (a|two|\d+) \w+ (creature )?token\b/i,
      /\b\+1\/\+1 counter\b/i,
      /\bcreatures you control (get|have) \+\d\b/i,
      /\beach creature you control\b/i,
      /\bwhenever (a|another) creature (enters the battlefield|dies) under your control\b/i,
      /\bproliferate\b/i,
      /\bpopulate\b/i,
      /\bconvoke\b/i,
    ],
    typePatterns: [
      /\bsoldier\b/i,
      /\belder\b/i,
      /\bhuman\b/i,
      /\belemental\b/i,
    ],
    cmcPenalty: false,
    signatureCards: ['Kitchen Finks', 'Voice of Resurgence', 'Knight of the Reliquary', 'Luminarch Aspirant'],
    signpostUncommons: ['Kitchen Finks', 'Knight of Autumn', 'Voice of Resurgence'],
  },
  {
    key: 'WB', name: 'Lifegain / Midrange',
    colors: ['W', 'B'],
    keywords: ['lifelink', 'gain life', 'lose life', 'drain', 'sacrifice', 'reanimate',
               'whenever you gain life', 'extort'],
    oraclePatterns: [
      /\byou gain \d+ life\b/i,
      /\bgain \d+ life\b/i,
      /\blifelink\b/i,
      /\bwhenever you gain life\b/i,
      /\beach opponent loses \d+ life\b/i,
      /\breturn target creature (card )?from (a|your) graveyard\b/i,
      /\b sacrifice (a|another) creature\b/i,
      /\bexile target\b/i,
    ],
    typePatterns: [
      /\bcleric\b/i,
      /\bangel\b/i,
      /\bdemon\b/i,
      /\bwarlock\b/i,
    ],
    cmcPenalty: false,
    signatureCards: ['Lingering Souls', 'Sorin, Solemn Visitor', 'Tidehollow Sculler', 'Vindicate'],
    signpostUncommons: ['Lingering Souls', 'Tidehollow Sculler', 'Sin Collector'],
  },
  {
    key: 'UR', name: 'Spells / Prowess / Tempo',
    colors: ['U', 'R'],
    keywords: ['instant', 'sorcery', 'prowess', 'copy', 'cast.*instant', 'cast.*sorcery',
               'noncreature spell', 'wizard', 'storm'],
    oraclePatterns: [
      /\bprowess\b/i,
      /\bwhenever you cast (a|an) (instant|sorcery|noncreature)\b/i,
      /\bcopy target (instant|sorcery)\b/i,
      /\bdraw a card.*discard a card\b/i,
      /\bdiscard a card.*draw a card\b/i,
      /\bmagecraft\b/i,
      /\binstant or sorcery card\b/i,
      /\bflashback\b/i,
    ],
    typePatterns: [
      /\bwizard\b/i,
      /\bshaman\b/i,
      /\bmonk\b/i,
    ],
    cmcPenalty: true,
    signatureCards: ['Izzet Charm', 'Electrolyze', 'Dack Fayden', 'Young Pyromancer'],
    signpostUncommons: ['Izzet Charm', 'Electrolyze', 'Prismari Command'],
  },
  {
    key: 'BG', name: 'Graveyard Value / Self-Mill',
    colors: ['B', 'G'],
    keywords: ['graveyard', 'mill', 'delve', 'dredge', 'undergrowth', 'surveil',
               'return.*graveyard', 'from your graveyard'],
    oraclePatterns: [
      /\bfrom your graveyard\b/i,
      /\bdelve\b/i,
      /\bdredge\b/i,
      /\bundergrowth\b/i,
      /\bmill \d+\b/i,
      /\bsurveil\b/i,
      /\bcreature card in your graveyard\b/i,
      /\bput (the top|a) card(s?) of your library into your graveyard\b/i,
      /\breturn target.*from your graveyard\b/i,
      /\b(gain|get) \+1\/\+1 for each creature card in your graveyard\b/i,
    ],
    typePatterns: [
      /\bfungus\b/i,
      /\binsect\b/i,
      /\bspider\b/i,
      /\bplant\b/i,
    ],
    cmcPenalty: false,
    signatureCards: ['Deathrite Shaman', 'Assassin\'s Trophy', 'Grisly Salvage', 'Grist, the Hunger Tide'],
    signpostUncommons: ['Grisly Salvage', 'Deathrite Shaman', 'Assassin\'s Trophy'],
  },
  {
    key: 'RW', name: 'Weenie Aggro / Equipment',
    colors: ['R', 'W'],
    keywords: ['equipment', 'aura', 'first strike', 'double strike', 'pump',
               'attacking', 'artifact.*equipment', 'whenever.*attacks'],
    oraclePatterns: [
      /\bequip\b/i,
      /\bequipped creature gets\b/i,
      /\bfirst strike\b/i,
      /\bdouble strike\b/i,
      /\bwhenever (a|another) creature (you control )?(attacks|enters the battlefield under your control)\b/i,
      /\bcreatures you control (get|have) \+\d\b/i,
      /\bbattalion\b/i,
      /\bmentor\b/i,
      /\b exert /i,
    ],
    typePatterns: [
      /\bhuman\b/i,
      /\bsoldier\b/i,
      /\bknight\b/i,
      /\bwarrior\b/i,
    ],
    cmcPenalty: true,
    signatureCards: ['Boros Charm', 'Figure of Destiny', 'Aurelia, Exemplar of Justice', 'Boros Reckoner'],
    signpostUncommons: ['Boros Charm', 'Heroic Reinforcements', 'Tajic, Legion\'s Edge'],
  },
  {
    key: 'UG', name: 'Ramp / Simic Value',
    colors: ['U', 'G'],
    keywords: ['landfall', '+1/+1 counter', 'flash', 'draw cards', 'additional land',
               'whenever a land enters', 'evolve', 'adapt'],
    oraclePatterns: [
      /\blandfall\b/i,
      /\bwhenever a land enters the battlefield\b/i,
      /\byou may play (an |up to |one )?additional land\b/i,
      /\bflash\b/i,
      /\bevolve\b/i,
      /\badapt\b/i,
      /\bdraw (a|\d+) card(s)?\b/i,
      /\b\+1\/\+1 counter\b/i,
      /\bsearch your library for (a |an |up to )?(basic )?land\b/i,
      /\bcopy target\b/i,
    ],
    typePatterns: [
      /\bmerfolk\b/i,
      /\bmutant\b/i,
      /\bsnake\b/i,
      /\bturtle\b/i,
    ],
    cmcPenalty: false,
    signatureCards: ['Coiling Oracle', 'Growth Spiral', 'Uro, Titan of Nature\'s Wrath', 'Hydroid Krasis'],
    signpostUncommons: ['Coiling Oracle', 'Growth Spiral', 'Ice-Fang Coatl'],
  },
];

export function scoreArchetypeFit(card: ScryfallCard, arch: ArchetypeDefinition): ArchetypeFit {
  const oracle = getOracleText(card).toLowerCase().replace(/\n/g, ' ');
  const typeLine = getTypeLine(card).toLowerCase();
  const ci = getColorIdentity(card);
  const reasons: string[] = [];
  let score = 0;

  const cardColors = (card.colors || []).map((c) => c.toUpperCase());
  const archColors = arch.colors.map((c) => c.toUpperCase());
  const ciMatches = ci.length === 0 || ci.every((c) => archColors.includes(c));
  const canBeCast = cardColors.length === 0 || cardColors.every((c) => archColors.includes(c));

  if (!ciMatches && !canBeCast) {
    return { archetype: arch.key, score: 0, reasons: ['Outside archetype color identity'] };
  }

  const ciPresent = ci.filter((c) => archColors.includes(c)).length;
  const colorBonus = ciPresent >= 2 ? 0.15 : ciPresent === 1 ? 0.08 : 0;
  if (colorBonus > 0) {
    score += colorBonus;
    reasons.push(`Color identity matches archetype (${ciPresent} colors)`);
  }

  for (const kw of arch.keywords) {
    try {
      if (new RegExp(kw, 'i').test(oracle) || new RegExp(kw, 'i').test(typeLine)) {
        score += 0.06;
        reasons.push(`Keyword match: ${kw}`);
      }
    } catch { continue; }
  }

  for (const pat of arch.oraclePatterns) {
    if (pat.test(oracle)) {
      score += 0.08;
    }
  }

  for (const pat of arch.typePatterns) {
    if (pat.test(typeLine)) {
      score += 0.05;
      break;
    }
  }

  if (arch.signpostUncommons.includes(card.name)) {
    score += 0.25;
    reasons.push('Signpost uncommon for this archetype');
  }

  if (arch.cmcPenalty && card.cmc >= 5) {
    const penalty = 0.1 * (card.cmc - 4);
    score = Math.max(0, score - penalty);
    reasons.push(`CMC ${card.cmc} penalized in aggro archetype`);
  }

  const isLand = /land/i.test(typeLine);
  if (isLand && cardColors.length === 0) {
    score += 0.02;
  }

  score = Math.max(0, Math.min(1, score));

  if (reasons.length === 0 && score < 0.1) {
    reasons.push('No archetype signals detected');
  }

  return { archetype: arch.key, score, reasons };
}

export function computeAllFits(card: ScryfallCard): ArchetypeFit[] {
  return ARCHETYPE_DEFINITIONS.map((arch) => scoreArchetypeFit(card, arch));
}

export function isBridgeCard(fits: ArchetypeFit[], threshold: number = 0.2): boolean {
  return fits.filter((f) => f.score >= threshold).length >= 2;
}

export function getPrimaryArchetype(fits: ArchetypeFit[]): ArchetypeKey | null {
  if (fits.length === 0) return null;
  let best = fits[0];
  for (const fit of fits) {
    if (fit.score > best.score) best = fit;
  }
  return best.score >= 0.15 ? best.archetype : null;
}

export function extractEffectTaxonomy(card: ScryfallCard): { category: string; scope: string } {
  const oracle = getOracleText(card).toLowerCase().replace(/\n/g, ' ');
  const typeLine = getTypeLine(card).toLowerCase();

  let category = 'other';
  if (/(destroy|exile|deal).*target/i.test(oracle)) category = 'removal';
  else if (/draw \d+ card/i.test(oracle)) category = 'draw';
  else if (/search your library for.*land|add \{/.test(oracle)) category = 'ramp';
  else if (/counter target/i.test(oracle)) category = 'counter';
  else if (/create.*token/i.test(oracle)) category = 'token';
  else if (/search your library/i.test(oracle)) category = 'tutor';
  else if (/return.*graveyard|reanimate/i.test(oracle)) category = 'recursion';
  else if (/creatures you control get \+|team get/i.test(oracle)) category = 'pump';
  else if (/land/i.test(typeLine)) category = 'land';
  else if (/creature/i.test(typeLine)) category = 'creature';
  else if (/(planeswalker|instant|sorcery|enchantment)/i.test(typeLine)) category = 'spell';
  else if (/artifact/i.test(typeLine)) category = 'artifact';

  let scope = 'single';
  if (/destroy all|exile all|each creature|each opponent/i.test(oracle)) scope = 'mass';
  else if (/whenever|at the beginning|each (upkeep|end step|combat)/i.test(oracle)) scope = 'triggered';
  else if (/if .+ instead/i.test(oracle)) scope = 'conditional';

  return { category, scope };
}
