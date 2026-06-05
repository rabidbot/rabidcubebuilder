import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, AlertTriangle, Zap, Layers, Grid3X3 } from 'lucide-react';
import { useCubeStore } from '../../stores/cubeStore';
import { clsx } from 'clsx';

function severityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-danger/15 text-danger border-danger/30';
    case 'warning': return 'bg-orange/15 text-orange border-orange/30';
    default: return 'bg-info/15 text-info border-info/30';
  }
}

export default function CubeAnalysisView() {
  const navigate = useNavigate();
  const cube = useCubeStore((s) => s.cube);
  const analysis = useCubeStore((s) => s.analysis);
  const isBuilding = useCubeStore((s) => s.isBuilding);
  const buildPhase = useCubeStore((s) => s.buildPhase);
  const buildMessage = useCubeStore((s) => s.buildMessage);
  const buildPercent = useCubeStore((s) => s.buildPercent);

  if (!analysis && !isBuilding) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <BarChart3 className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text mb-2">No Cube Built Yet</h2>
        <p className="text-text-secondary mb-4">
          Build a cube first to see its analysis.
        </p>
        <button
          onClick={() => navigate('/wizard')}
          className="px-4 py-2 rounded-md bg-primary text-black font-medium hover:bg-primary-light transition-colors"
        >
          Go to Builder
        </button>
      </div>
    );
  }

  if (isBuilding) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <h2 className="text-xl font-bold text-text mb-2">Building Cube</h2>
        <p className="text-text-secondary mb-2">{buildMessage}</p>
        <div className="w-full bg-border rounded-full h-2 mb-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${buildPercent}%` }}
          />
        </div>
        <p className="text-text-muted text-sm">Phase {buildPhase} of 9 — {buildPercent}%</p>
      </div>
    );
  }

  if (!analysis || !cube) return null;

  const gaps = analysis.gaps || [];
  const coverage = analysis.archetypeCoverage || {};
  const curve = analysis.manaCurve?.overall || { low: 0, mid: 0, high: 0, finisher: 0 };
  const totalCurve = curve.low + curve.mid + curve.high + curve.finisher || 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/wizard')}
          className="p-2 rounded-md hover:bg-hover text-text-secondary hover:text-text"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text">{cube.name}</h1>
          <p className="text-text-muted text-sm">
            {cube.cubeCards.length} cards &middot; {Object.keys(coverage).length} archetypes &middot; Power level {cube.config.powerLevel}/10
          </p>
        </div>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Cards', value: cube.cubeCards.length, icon: Layers, color: 'text-primary' },
          { label: 'Fixing Lands', value: analysis.fixingLandCount, icon: Grid3X3, color: 'text-accent' },
          { label: 'Avg Power', value: analysis.powerDistribution.mean.toFixed(2), icon: Zap, color: 'text-success' },
          { label: 'Gaps', value: gaps.length, icon: AlertTriangle, color: gaps.length > 0 ? 'text-danger' : 'text-success' },
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

      {/* Mana Curve */}
      <div className="glass rounded-xl p-6 border border-border/30 mb-6">
        <h3 className="text-lg font-bold text-text mb-4">Overall Mana Curve</h3>
        <div className="space-y-3">
          {(['low','mid','high','finisher'] as const).map((bucket) => {
            const pct = totalCurve > 0 ? (curve[bucket] / totalCurve) * 100 : 0;
            const labels = { low: '1-2 CMC', mid: '3-4 CMC', high: '5 CMC', finisher: '6+ CMC' };
            const colors = { low: 'bg-success', mid: 'bg-info', high: 'bg-orange', finisher: 'bg-accent' };
            return (
              <div key={bucket} className="flex items-center gap-3">
                <span className="text-text-muted text-xs w-16 text-right">{labels[bucket]}</span>
                <div className="flex-1 bg-border rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${colors[bucket]}`}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="text-text text-xs w-12">{curve[bucket]} &middot; {pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Color Balance */}
      <div className="glass rounded-xl p-6 border border-border/30 mb-6">
        <h3 className="text-lg font-bold text-text mb-4">Color Balance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {['W','U','B','R','G','multi','colorless','land'].map((color) => {
            const count = analysis.colorBalance[color] || 0;
            const colors: Record<string, string> = {
              W: 'bg-mana-w text-black', U: 'bg-mana-u text-white', B: 'bg-mana-b text-white',
              R: 'bg-mana-r text-white', G: 'bg-mana-g text-white',
              multi: 'bg-primary text-black', colorless: 'bg-border text-text', land: 'bg-accent text-white',
            };
            return (
              <div
                key={color}
                className={`rounded-lg p-3 text-center ${colors[color] || 'bg-border text-text'}`}
              >
                <div className="text-xs font-medium opacity-75">{color === 'multi' ? 'Gold' : color === 'colorless' ? 'Colorless' : color === 'land' ? 'Lands' : color}</div>
                <div className="text-lg font-bold">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Archetype Coverage */}
      <div className="glass rounded-xl p-6 border border-border/30 mb-6">
        <h3 className="text-lg font-bold text-text mb-4">Archetype Coverage</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 text-text-muted font-medium">Archetype</th>
                <th className="text-right py-2 text-text-muted font-medium">Cards</th>
                <th className="text-right py-2 text-text-muted font-medium">Synergy</th>
                <th className="text-right py-2 text-text-muted font-medium">Payoffs</th>
                <th className="text-right py-2 text-text-muted font-medium">Enablers</th>
              </tr>
            </thead>
            <tbody>
              {(cube.config.selectedArchetypes as string[]).map((arch) => {
                const data = coverage[arch as keyof typeof coverage];
                if (!data) return null;
                const archDef = {
                  WU: 'Artifacts / Flicker', UB: 'Reanimator', BR: 'Sacrifice', RG: 'Ramp / Stompy',
                  GW: 'Tokens / Counters', WB: 'Lifegain', UR: 'Spells / Prowess',
                  BG: 'Graveyard Value', RW: 'Weenie / Equipment', UG: 'Ramp / Simic',
                }[arch] || arch;
                return (
                  <tr key={arch} className="border-b border-border/30 hover:bg-hover/50">
                    <td className="py-2 text-text font-medium">{arch} <span className="text-text-muted text-xs">({archDef})</span></td>
                    <td className="py-2 text-right text-text">{data.cardCount}</td>
                    <td className="py-2 text-right">
                      <span className={clsx(
                        'font-medium',
                        data.synergyDensity >= 4 ? 'text-success' : data.synergyDensity >= 2 ? 'text-info' : 'text-danger',
                      )}>
                        {data.synergyDensity.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2 text-right text-text">{data.payoffs}</td>
                    <td className="py-2 text-right text-text">{data.enablers}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Power Distribution */}
      <div className="glass rounded-xl p-6 border border-border/30 mb-6">
        <h3 className="text-lg font-bold text-text mb-4">Power Distribution</h3>
        <div className="flex items-end gap-1 h-24">
          {(analysis.powerDistribution.histogram || [0,0,0,0,0]).map((count, i) => {
            const max = Math.max(1, ...analysis.powerDistribution.histogram);
            const labels = ['0-0.2', '0.2-0.4', '0.4-0.6', '0.6-0.8', '0.8-1.0'];
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-text-muted text-[10px]">{count}</span>
                <div
                  className="w-full bg-primary/30 rounded-t transition-all"
                  style={{ height: `${(count / max) * 100}%` }}
                />
                <span className="text-text-muted text-[10px]">{labels[i]}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-text-muted text-xs mt-4">
          <span>Min: {analysis.powerDistribution.min.toFixed(2)}</span>
          <span>Avg: {analysis.powerDistribution.mean.toFixed(2)}</span>
          <span>Median: {analysis.powerDistribution.median.toFixed(2)}</span>
          <span>Max: {analysis.powerDistribution.max.toFixed(2)}</span>
        </div>
      </div>

      {/* Gaps */}
      {gaps.length > 0 && (
        <div className="glass rounded-xl p-6 border border-border/30 mb-6">
          <h3 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange" />
            Gaps & Suggestions ({gaps.length})
          </h3>
          <div className="space-y-3">
            {gaps.map((gap, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${severityColor(gap.severity)}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium uppercase">{gap.severity}</span>
                  <span className="text-xs font-bold">{gap.archetype}</span>
                </div>
                <p className="text-xs">{gap.message}</p>
                {gap.suggestedCards.length > 0 && (
                  <p className="text-[10px] mt-1 opacity-75">
                    Consider: {gap.suggestedCards.slice(0, 3).join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => navigate('/browser')}
          className="px-4 py-2 rounded-md bg-card border border-border text-text text-sm hover:bg-hover transition-colors"
        >
          Browse All Cards
        </button>
        <button
          onClick={() => navigate('/export')}
          className="px-4 py-2 rounded-md bg-primary text-black font-medium text-sm hover:bg-primary-light transition-colors"
        >
          Export Cube
        </button>
      </div>
    </div>
  );
}
