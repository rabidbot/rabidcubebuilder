import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Grid3X3, List } from 'lucide-react';
import { useCubeStore } from '../../stores/cubeStore';
import CardPreview from '../card/CardPreview';
import { clsx } from 'clsx';

type ViewMode = 'grid' | 'list';
type SortKey = 'name' | 'cmc' | 'power' | 'color';

export default function CardBrowser() {
  const navigate = useNavigate();
  const cube = useCubeStore((s) => s.cube);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [cmcFilter, setCmcFilter] = useState<string | null>(null);
  const [archFilter, setArchFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('cmc');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!cube) return [];
    let result = cube.cubeCards;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter((c) =>
        c.scryfallData.name.toLowerCase().includes(s)
        || (c.scryfallData.type_line || '').toLowerCase().includes(s)
        || (c.scryfallData.oracle_text || '').toLowerCase().includes(s)
      );
    }

    if (colorFilter) {
      if (colorFilter === 'colorless') {
        result = result.filter((c) => c.colorIdentity.length === 0);
      } else if (colorFilter === 'multi') {
        result = result.filter((c) => c.colorIdentity.length >= 2);
      } else {
        result = result.filter((c) => c.colorIdentity.includes(colorFilter));
      }
    }

    if (cmcFilter) {
      const ranges: Record<string, [number, number]> = {
        '0': [0, 0], '1': [1, 1], '2': [2, 2], '3': [3, 3],
        '4': [4, 4], '5': [5, 5], '6+': [6, 99],
      };
      const [min, max] = ranges[cmcFilter] || [0, 99];
      result = result.filter((c) => {
        const cmc = c.scryfallData.cmc || 0;
        return cmc >= min && cmc <= max;
      });
    }

    if (archFilter) {
      result = result.filter((c) =>
        c.archetypeFits.some((f) => f.archetype === archFilter && f.score >= 0.15)
      );
    }

    const sorted = [...result];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name': cmp = a.scryfallData.name.localeCompare(b.scryfallData.name); break;
        case 'cmc': cmp = (a.scryfallData.cmc || 0) - (b.scryfallData.cmc || 0); break;
        case 'power': cmp = a.powerScore - b.powerScore; break;
        case 'color': cmp = a.colorIdentity.join('').localeCompare(b.colorIdentity.join('')); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [cube, search, colorFilter, cmcFilter, archFilter, sortKey, sortDir]);

  if (!cube) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text mb-2">No Cube Built Yet</h2>
        <p className="text-text-secondary mb-4">Build a cube first to browse its cards.</p>
        <button onClick={() => navigate('/wizard')} className="px-4 py-2 rounded-md bg-primary text-black font-medium hover:bg-primary-light">
          Go to Builder
        </button>
      </div>
    );
  }

  const colors = ['W', 'U', 'B', 'R', 'G', 'multi', 'colorless'];
  const cmcOptions = ['0', '1', '2', '3', '4', '5', '6+'];
  const arches = cube.config.selectedArchetypes as string[] || [];

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/analysis')} className="p-2 rounded-md hover:bg-hover text-text-secondary hover:text-text">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-text">Card Browser</h1>
        <span className="text-text-muted text-sm">{filtered.length} cards</span>
      </div>

      <div className="glass rounded-lg p-3 mb-4 border border-border/30 space-y-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, type, or text..."
            className="flex-1 bg-transparent text-text text-sm placeholder:text-text-muted focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-text-muted text-xs self-center mr-1">Color:</span>
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColorFilter(colorFilter === c ? null : c)}
              className={clsx(
                'px-2 py-0.5 rounded text-xs transition-colors',
                colorFilter === c ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-card text-text-muted border border-border hover:border-border-light',
              )}
            >
              {c === 'colorless' ? 'C' : c === 'multi' ? 'Gold' : c}
            </button>
          ))}
          <span className="text-text-muted text-xs self-center ml-2 mr-1">CMC:</span>
          {cmcOptions.map((c) => (
            <button
              key={c}
              onClick={() => setCmcFilter(cmcFilter === c ? null : c)}
              className={clsx(
                'px-2 py-0.5 rounded text-xs transition-colors',
                cmcFilter === c ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-card text-text-muted border border-border hover:border-border-light',
              )}
            >
              {c}
            </button>
          ))}
          <span className="text-text-muted text-xs self-center ml-2 mr-1">Arch:</span>
          {arches.map((a) => (
            <button
              key={a}
              onClick={() => setArchFilter(archFilter === a ? null : a)}
              className={clsx(
                'px-2 py-0.5 rounded text-xs transition-colors',
                archFilter === a ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-card text-text-muted border border-border hover:border-border-light',
              )}
            >
              {a}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-card border border-border text-text text-xs rounded px-2 py-0.5"
            >
              <option value="cmc">CMC</option>
              <option value="name">Name</option>
              <option value="power">Power Score</option>
              <option value="color">Color</option>
            </select>
            <button
              onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
              className="px-1.5 py-0.5 rounded text-text-muted text-xs hover:bg-hover"
            >
              {sortDir === 'asc' ? '\u2191' : '\u2193'}
            </button>
            <div className="border-l border-border mx-1 h-5" />
            <button
              onClick={() => setViewMode('grid')}
              className={clsx('p-1 rounded', viewMode === 'grid' ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-text')}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx('p-1 rounded', viewMode === 'list' ? 'bg-primary/15 text-primary' : 'text-text-muted hover:text-text')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {filtered.map((cc) => (
            <button
              key={cc.scryfallData.id}
              onClick={() => setSelectedId(selectedId === cc.scryfallData.id ? null : cc.scryfallData.id)}
              className={clsx(
                'rounded-lg border transition-all hover-lift overflow-hidden',
                selectedId === cc.scryfallData.id ? 'border-primary neon-glow-primary' : 'border-border/50 hover:border-border-light',
              )}
            >
              <CardPreview card={cc.scryfallData} size="small" className="w-full" />
              <div className="p-1.5">
                <div className="text-text text-[11px] font-medium truncate">{cc.scryfallData.name}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  {cc.colorIdentity.map((c) => (
                    <span key={c} className={`w-3 h-3 rounded-full inline-block ${
                      { W: 'bg-mana-w', U: 'bg-mana-u', B: 'bg-mana-b', R: 'bg-mana-r', G: 'bg-mana-g' }[c] || 'bg-border'
                    }`} />
                  ))}
                  {cc.colorIdentity.length === 0 && <span className="w-3 h-3 rounded-full bg-border" />}
                  <span className="text-text-muted text-[10px] ml-auto">{cc.scryfallData.cmc}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl border border-border/30 overflow-hidden">
          <div className="divide-y divide-border/30">
            {filtered.map((cc) => (
              <button
                key={cc.scryfallData.id}
                onClick={() => setSelectedId(selectedId === cc.scryfallData.id ? null : cc.scryfallData.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-hover/50 text-left transition-colors"
              >
                <div className="flex items-center gap-0.5">
                  {cc.colorIdentity.map((c) => (
                    <span key={c} className={`w-2.5 h-2.5 rounded-full ${
                      { W: 'bg-mana-w', U: 'bg-mana-u', B: 'bg-mana-b', R: 'bg-mana-r', G: 'bg-mana-g' }[c] || 'bg-border'
                    }`} />
                  ))}
                </div>
                <span className="text-text text-sm font-medium flex-1">{cc.scryfallData.name}</span>
                <span className="text-text-muted text-xs">{cc.scryfallData.type_line}</span>
                <span className="text-text-muted text-xs w-8 text-right">{cc.scryfallData.cmc}</span>
                <span className="text-text-muted text-[10px] w-10 text-right">
                  {(cc.powerScore * 10).toFixed(1)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
