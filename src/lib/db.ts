import type { Cube, CubeAnalysis, CubeConfig } from './types';
import { isElectron } from './electron-api';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  oracle_id TEXT,
  name TEXT NOT NULL,
  mana_cost TEXT,
  cmc REAL,
  type_line TEXT,
  oracle_text TEXT,
  colors TEXT,
  color_identity TEXT,
  keywords TEXT,
  power TEXT,
  toughness TEXT,
  loyalty TEXT,
  set_code TEXT,
  set_name TEXT,
  collector_number TEXT,
  rarity TEXT,
  scryfall_uri TEXT,
  image_uris TEXT,
  card_faces TEXT,
  prices TEXT,
  legalities TEXT,
  produced_mana TEXT,
  released_at TEXT
);

CREATE TABLE IF NOT EXISTS collection (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id TEXT NOT NULL REFERENCES cards(id),
  quantity INTEGER DEFAULT 1,
  set_code TEXT,
  collector_number TEXT,
  foil BOOLEAN DEFAULT FALSE,
  condition TEXT,
  language TEXT,
  purchase_price REAL,
  csv_data TEXT
);

CREATE TABLE IF NOT EXISTS cubes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config TEXT NOT NULL,
  analysis TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cube_cards (
  cube_id TEXT NOT NULL REFERENCES cubes(id),
  card_id TEXT NOT NULL REFERENCES cards(id),
  primary_archetype TEXT,
  slot TEXT,
  locked BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (cube_id, card_id)
);
`;

export async function initDatabase(): Promise<void> {
  if (!isElectron()) return;
  await window.electronAPI.db.exec(SCHEMA);
}

export async function dbRun(query: string, params?: unknown[]): Promise<void> {
  if (!isElectron()) return;
  await window.electronAPI.db.run(query, params);
}

export async function dbAll<T = Record<string, unknown>>(query: string, params?: unknown[]): Promise<T[]> {
  if (!isElectron()) return [];
  const result = await window.electronAPI.db.all(query, params);
  if (!result.ok || !result.rows) return [];
  return result.rows as T[];
}

export async function dbSave(): Promise<void> {
  if (!isElectron()) return;
  await window.electronAPI.db.save();
}

export async function saveCube(cube: Cube): Promise<void> {
  if (!isElectron()) return;
  await window.electronAPI.db.run(
    `INSERT OR REPLACE INTO cubes (id, name, config, analysis, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [
      cube.id,
      cube.name,
      JSON.stringify(cube.config),
      cube.analysis ? JSON.stringify(cube.analysis) : null,
      cube.createdAt || new Date().toISOString(),
    ],
  );

  await window.electronAPI.db.run('DELETE FROM cube_cards WHERE cube_id = ?', [cube.id]);

  for (let i = 0; i < cube.cubeCards.length; i++) {
    const cc = cube.cubeCards[i];
    await window.electronAPI.db.run(
      `INSERT INTO cube_cards (cube_id, card_id, primary_archetype, slot, locked, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        cube.id,
        cc.scryfallData.id,
        cc.primaryArchetype,
        findCardSlot(cube, cc.scryfallData.id),
        cc.locked ? 1 : 0,
        i,
      ],
    );
  }
}

function findCardSlot(cube: Cube, cardId: string): string {
  for (const slot of cube.slots) {
    if (slot.cardIds.includes(cardId)) return slot.color;
  }
  return '';
}

export async function loadCube(id: string): Promise<Cube | null> {
  if (!isElectron()) return null;
  const rows = await dbAll<{ id: string; name: string; config: string; analysis: string; created_at: string; updated_at: string }>(
    'SELECT * FROM cubes WHERE id = ?', [id],
  );
  if (rows.length === 0) return null;

  const row = rows[0];
  const config: CubeConfig = JSON.parse(row.config);
  const analysis: CubeAnalysis | null = row.analysis ? JSON.parse(row.analysis) : null;
  void await dbAll<{ card_id: string; primary_archetype: string; slot: string; locked: number; sort_order: number }>(
    'SELECT * FROM cube_cards WHERE cube_id = ? ORDER BY sort_order', [id],
  );

  const cube: Cube = {
    id: row.id,
    name: row.name,
    config,
    cubeCards: [],
    slots: [],
    analysis,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return cube;
}

export async function listCubes(): Promise<Array<{ id: string; name: string; config: string; created_at: string }>> {
  if (!isElectron()) return [];
  return dbAll('SELECT id, name, config, created_at FROM cubes ORDER BY updated_at DESC');
}

export async function deleteCube(id: string): Promise<void> {
  if (!isElectron()) return;
  await window.electronAPI.db.run('DELETE FROM cube_cards WHERE cube_id = ?', [id]);
  await window.electronAPI.db.run('DELETE FROM cubes WHERE id = ?', [id]);
}

export async function insertCollectionEntry(cardId: string, csvData: Record<string, string>, quantity: number = 1): Promise<void> {
  if (!isElectron()) return;
  await window.electronAPI.db.run(
    `INSERT INTO collection (card_id, quantity, set_code, collector_number, csv_data)
     VALUES (?, ?, ?, ?, ?)`,
    [
      cardId,
      quantity,
      csvData.set_code || csvData['Set Code'] || '',
      csvData.collector_number || csvData['Collector Number'] || '',
      JSON.stringify(csvData),
    ],
  );
}

export async function getCollectionCardIds(): Promise<string[]> {
  if (!isElectron()) return [];
  const rows = await dbAll<{ card_id: string }>('SELECT DISTINCT card_id FROM collection');
  return rows.map((r) => r.card_id);
}

export async function clearCollection(): Promise<void> {
  if (!isElectron()) return;
  await window.electronAPI.db.run('DELETE FROM collection');
}
