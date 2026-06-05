import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Zap, Layers, Link2 } from 'lucide-react';
import { useCubeStore } from '../../stores/cubeStore';
import { ARCHETYPE_DEFINITIONS } from '../../lib/archetype-matcher';
import { getOracleText } from '../../lib/card-utils';
import type { ArchetypeKey } from '../../lib/types';
import CardPreview from '../card/CardPreview';

const NAMES: Record<ArchetypeKey, string> = {
  WU: 'Artifacts / Flicker / Control',
  UB: 'Reanimator / Control',
  BR: 'Sacrifice / Aggro',
  RG: 'Ramp / Stompy / Aggro',
  GW: 'Tokens / Counters / Go-Wide',
  WB: 'Lifegain / Midrange',
  UR: 'Spells / Prowess / Tempo',
  BG: 'Graveyard Value / Self-Mill',
  RW: 'Weenie Aggro / Equipment',
  UG: 'Ramp / Simic Value',
};

const MANA_COLORS: Record<string, string> = {
  W: 'bg-mana-w text-black', U: 'bg-mana-u text-white', B: 'bg-mana-b text-white',
  R: 'bg-mana-r text-white', G: 'bg-mana-g text-white',
};

export default function ArchetypeDashboard() {
  const { archetypeKey } = useParams<{ cubeId: string; archetypeKey: string }>();
  const navigate = useNavigate();
  const cube = useCubeStore((s) => s.cube);
  const analysis = useCubeStore((s) => s.analysis);

  const archKey = archetypeKey as ArchetypeKey;
  const def = ARCHETYPE_DEFINITIONS.find((d) => d.key === archKey);
  const archName = NAMES[archKey] || archKey;

  if (!cube || !analysis) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-text mb-2">No Cube Loaded</h2>
        <button onClick={() => navigate('/')} className="px-4 py-2 rounded-md bg-primary text-black font-medium">
          Go Home
        </button>
      </div>
    );
  }

  if (!def) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-text mb-2">Unknown Archetype: {archKey}</h2>
        <button onClick={() => navigate('/analysis')} className="px-4 py-2 rounded-md bg-primary text-black font-medium">
          Back to Analysis
        </button>
      </div>
    );
  }

  const coverage = analysis.archetypeCoverage[archKey];
  const archCards = cube.cubeCards.filter((c) =>
    c.archetypeFits.some((f) => f.archetype === archKey && f.score >= 0.15),
  );

  const payoffs = archCards.filter((c) =>
    /you win the game|each opponent loses|extra turn|extra combat|overrun/i.test(
      getOracleText(c.scryfallData).toLowerCase().replace(/\n/g, ' '),
    ),
  );

  const enablers = archCards.filter((c) =>
    /whenever|at the beginning|enters the battlefield/i.test(
      getOracleText(c.scryfallData).toLowerCase().replace(/\n/g, ' '),
    ),
  );

  const connections = (analysis.synergyConnections || []).filter((conn) => conn.archetype === archKey);

  const gaps = (analysis.gaps || []).filter((g) => g.archetype === archKey);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/analysis')} className="p-2 rounded-md hover:bg-hover text-text-secondary hover:text-text">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {def.colors.map((c) => (
            <span key={c} className={`inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold ${MANA_COLORS[c]}`}>
              {c}
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-text">{archKey} — {archName}</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Cards', value: archCards.length, icon: Layers, color: 'text-primary' },
          { label: 'Payoffs', value: payoffs.length, icon: Zap, color: 'text-success' },
          { label: 'Enablers', value: enablers.length, icon: Layers, color: 'text-info' },
          { label: 'Connections', value: connections.length, icon: Link2, color: 'text-accent' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="glass rounded-lg p-4 border border-border/30">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-text-muted text-xs">{stat.label}</span>
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          );
        })}
      </div>

      {coverage && (
        <div className="glass rounded-xl p-6 border border-border/30 mb-6">
          <h3 className="text-lg font-bold text-text mb-2">Synergy Density</h3>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-border rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, coverage.synergyDensity * 25)}%` }}
              />
            </div>
            <span className="text-text font-bold">{coverage.synergyDensity.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* Gaps */}
      {gaps.length > 0 && (
        <div className="glass rounded-xl p-6 border border-border/30 mb-6">
          <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange" />
            Gaps & Missing Pieces
          </h3>
          <div className="space-y-3">
            {gaps.map((gap, i) => (
              <div key={i} className="p-3 rounded-lg border bg-orange/10 border-orange/30">
                <p className="text-sm text-text">{gap.message}</p>
                {gap.suggestedCards.length > 0 && (
                  <p className="text-xs text-text-muted mt-1">
                    Suggested: {gap.suggestedCards.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card grid */}
      <div className="glass rounded-xl p-6 border border-border/30">
        <h3 className="text-lg font-bold text-text mb-4">All Cards in {archKey}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {archCards.map((cc) => {
            return (
              <div key={cc.scryfallData.id} className="rounded-lg border border-border/50 bg-card overflow-hidden hover:border-primary/30 transition-colors">
                <CardPreview card={cc.scryfallData} size="small" className="w-full" />
                <div className="p-2">
                  <div className="text-text text-xs font-medium truncate">{cc.scryfallData.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-0.5">
                      {cc.colorIdentity.map((c) => (
                        <span key={c} className={`w-2.5 h-2.5 rounded-full ${
                          { W: 'bg-mana-w', U: 'bg-mana-u', B: 'bg-mana-b', R: 'bg-mana-r', G: 'bg-mana-g' }[c] || 'bg-border'
                        }`} />
                      ))}
                    </div>
                    <span className="text-text-muted text-[10px]">{(cc.powerScore * 10).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
