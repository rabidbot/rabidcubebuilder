import type { ScryfallCard } from './types';
import { isElectron } from './electron-api';

const memoryCache = new Map<string, ScryfallCard>();
const cacheInsertOrder: string[] = [];
const MAX_MEMORY_CACHE = 2000;

export function getFromMemoryCache(id: string): ScryfallCard | undefined {
  return memoryCache.get(id);
}

export function setInMemoryCache(id: string, card: ScryfallCard): void {
  if (memoryCache.has(id)) return;
  memoryCache.set(id, card);
  cacheInsertOrder.push(id);
  while (cacheInsertOrder.length > MAX_MEMORY_CACHE) {
    const oldest = cacheInsertOrder.shift();
    if (oldest) memoryCache.delete(oldest);
  }
}

export function clearMemoryCache(): void {
  memoryCache.clear();
  cacheInsertOrder.length = 0;
}

export function cacheCards(cards: ScryfallCard[]): void {
  for (const card of cards) {
    if (!card.id) continue;
    setInMemoryCache(card.id, card);
  }
}

function serializeJson(val: unknown): string {
  try { return JSON.stringify(val); } catch { return 'null'; }
}

function parseJsonField(val: unknown): unknown {
  if (typeof val !== 'string') return val;
  try { return JSON.parse(val); } catch { return val; }
}

export async function cacheCard(card: ScryfallCard): Promise<void> {
  if (!isElectron()) return;
  setInMemoryCache(card.id, card);
  await window.electronAPI.db.run(
    `INSERT OR REPLACE INTO cards (id, oracle_id, name, mana_cost, cmc, type_line, oracle_text,
     colors, color_identity, keywords, power, toughness, loyalty, set_code, set_name,
     collector_number, rarity, scryfall_uri, image_uris, card_faces, prices, legalities,
     produced_mana, released_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      card.id,
      card.oracle_id || '',
      card.name || '',
      card.mana_cost || '',
      card.cmc || 0,
      card.type_line || '',
      card.oracle_text || '',
      serializeJson(card.colors || []),
      serializeJson(card.color_identity || []),
      serializeJson(card.keywords || []),
      card.power || '',
      card.toughness || '',
      card.loyalty || '',
      card.set || '',
      card.set_name || '',
      card.collector_number || '',
      card.rarity || '',
      card.scryfall_uri || '',
      serializeJson(card.image_uris || {}),
      serializeJson(card.card_faces || []),
      serializeJson(card.prices || {}),
      serializeJson(card.legalities || {}),
      serializeJson(card.produced_mana || []),
      card.released_at || '',
    ],
  );
}

export async function getCachedCard(id: string): Promise<ScryfallCard | null> {
  const mem = getFromMemoryCache(id);
  if (mem) return mem;

  if (!isElectron()) return null;
  const result = await window.electronAPI.db.all('SELECT * FROM cards WHERE id = ?', [id]);
  if (!result.ok || !result.rows || result.rows.length === 0) return null;

  const row = result.rows[0];
  const card: ScryfallCard = {
    id: row.id as string,
    oracle_id: row.oracle_id as string,
    name: row.name as string,
    mana_cost: row.mana_cost as string,
    cmc: row.cmc as number,
    type_line: row.type_line as string,
    oracle_text: row.oracle_text as string,
    colors: parseJsonField(row.colors) as string[],
    color_identity: parseJsonField(row.color_identity) as string[],
    keywords: parseJsonField(row.keywords) as string[],
    power: row.power as string,
    toughness: row.toughness as string,
    loyalty: row.loyalty as string,
    set: row.set_code as string,
    set_name: row.set_name as string,
    collector_number: row.collector_number as string,
    rarity: row.rarity as string,
    scryfall_uri: row.scryfall_uri as string,
    image_uris: parseJsonField(row.image_uris) as Record<string, string>,
    card_faces: parseJsonField(row.card_faces) as ScryfallCard['card_faces'],
    prices: parseJsonField(row.prices) as Record<string, string>,
    legalities: parseJsonField(row.legalities) as Record<string, string>,
    produced_mana: parseJsonField(row.produced_mana) as string[],
    released_at: row.released_at as string,
  };
  setInMemoryCache(id, card);
  return card;
}

export async function cardExistsInCache(id: string): Promise<boolean> {
  if (memoryCache.has(id)) return true;
  if (!isElectron()) return false;
  const result = await window.electronAPI.db.all('SELECT 1 FROM cards WHERE id = ?', [id]);
  return !!(result.ok && result.rows && result.rows.length > 0);
}
