import type { ScryfallCard, ScryfallFetchResult, ScryfallBatchResult, ScryfallSearchResult } from './types';
import { isElectron } from './electron-api';

let requestCount = 0;
const MAX_PER_SECOND = 8;
const REQUEST_DELAY = 120;

async function rateLimit() {
  requestCount++;
  if (requestCount > MAX_PER_SECOND) {
    await new Promise((r) => setTimeout(r, REQUEST_DELAY));
    requestCount = 0;
  }
}

export async function fetchCardById(id: string): Promise<ScryfallCard | null> {
  if (isElectron()) {
    await rateLimit();
    const result: ScryfallFetchResult = await window.electronAPI.scryfall.fetchCard(id);
    if (result.ok && result.data) return result.data as ScryfallCard;
    return null;
  }

  await rateLimit();
  try {
    const res = await fetch(`https://api.scryfall.com/cards/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    return await res.json() as ScryfallCard;
  } catch {
    return null;
  }
}

export async function fetchCardBySetAndNumber(set: string, collectorNumber: string): Promise<ScryfallCard | null> {
  const query = `https://api.scryfall.com/cards/${encodeURIComponent(set)}/${encodeURIComponent(collectorNumber)}`;
  await rateLimit();
  try {
    const res = await fetch(query);
    if (!res.ok) return null;
    return await res.json() as ScryfallCard;
  } catch {
    return null;
  }
}

export async function fetchCardsBatch(ids: string[]): Promise<ScryfallCard[]> {
  if (ids.length === 0) return [];
  if (isElectron()) {
    const result: ScryfallBatchResult = await window.electronAPI.scryfall.fetchBatch(ids);
    if (result.ok && result.cards) return result.cards;
    return [];
  }

  const cards: ScryfallCard[] = [];
  for (let i = 0; i < ids.length; i += 75) {
    const batch = ids.slice(i, i + 75);
    await rateLimit();
    try {
      const res = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers: batch.map((id) => ({ id })) }),
      });
      if (!res.ok) continue;
      const json = await res.json();
      if (json.data) cards.push(...json.data);
    } catch {
      continue;
    }
  }
  return cards;
}

export async function searchCards(query: string, maxPages: number = 5): Promise<{ cards: ScryfallCard[]; total: number }> {
  if (isElectron()) {
    const result: ScryfallSearchResult = await window.electronAPI.scryfall.search(query, maxPages);
    if (result.ok && result.cards) return { cards: result.cards, total: result.total || result.cards.length };
    return { cards: [], total: 0 };
  }

  const allCards: ScryfallCard[] = [];
  let page = 1;

  for (let i = 0; i < maxPages; i++) {
    await rateLimit();
    try {
      const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&page=${page}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.code === 'not_found') break;
        continue;
      }
      const json = await res.json();
      if (json.data) allCards.push(...json.data);
      if (!json.has_more) break;
      page++;
    } catch {
      break;
    }
  }

  return { cards: allCards, total: allCards.length };
}

export function getCardImageUrl(card: ScryfallCard, size: 'small' | 'normal' | 'large'): string | null {
  if (card.image_uris?.[size]) return card.image_uris[size];
  if (card.card_faces?.[0]?.image_uris?.[size]) return card.card_faces[0].image_uris[size];
  return null;
}

export function isLegalInFormat(card: ScryfallCard, format: string): boolean {
  const legalities = card.legalities || {};
  const status = (legalities[format] || '').toLowerCase();
  return status === 'legal';
}

export function isBannedInFormat(card: ScryfallCard, format: string): boolean {
  const legalities = card.legalities || {};
  const status = (legalities[format] || '').toLowerCase();
  return status === 'banned';
}
