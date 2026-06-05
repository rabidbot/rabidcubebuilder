import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Loader2, Zap, X } from 'lucide-react';
import { useCubeStore } from '../../stores/cubeStore';
import type { CubeType, CubeSize, ArchetypeKey } from '../../lib/types';

const CUBE_TYPES: { value: CubeType; label: string; desc: string }[] = [
  { value: 'powered', label: 'Powered', desc: 'Includes Power 9. Fast, explosive gameplay.' },
  { value: 'unpowered', label: 'Unpowered / Vintage', desc: 'High power without Power 9. MTGO-style.' },
  { value: 'legacy', label: 'Legacy', desc: 'Legacy power level. Balanced and competitive.' },
  { value: 'modern', label: 'Modern', desc: 'Modern-legal only. Synergy-focused and fair.' },
  { value: 'peasant', label: 'Peasant', desc: 'Commons + Uncommons only. Budget-friendly.' },
  { value: 'pauper', label: 'Pauper', desc: 'Commons only. Ultra-budget, creature-focused.' },
  { value: 'theme', label: 'Theme / Set', desc: 'Built around a specific set or mechanic.' },
  { value: 'custom', label: 'Custom', desc: 'No restrictions. Pure curation.' },
];

const CUBE_SIZES: { value: CubeSize; label: string }[] = [
  { value: 360, label: '360 (8 players)' },
  { value: 450, label: '450 (10 players)' },
  { value: 540, label: '540 (12 players)' },
  { value: 720, label: '720 (16 players)' },
];

const ARCHETYPES: { key: ArchetypeKey; label: string; desc: string; colors: string[] }[] = [
  { key: 'WU', label: 'WU Artifacts / Flicker', desc: 'Blink, ETB, artifacts, counterspells', colors: ['W','U'] },
  { key: 'UB', label: 'UB Reanimator', desc: 'Graveyard, reanimation, mill, control', colors: ['U','B'] },
  { key: 'BR', label: 'BR Sacrifice / Aggro', desc: 'Sac outlets, tokens, dies triggers', colors: ['B','R'] },
  { key: 'RG', label: 'RG Ramp / Stompy', desc: 'Mana dorks, big threats, haste', colors: ['R','G'] },
  { key: 'GW', label: 'GW Tokens / Counters', desc: 'Token swarm, +1/+1, go-wide', colors: ['G','W'] },
  { key: 'WB', label: 'WB Lifegain / Midrange', desc: 'Drain, resilient midrange, aristocrats', colors: ['W','B'] },
  { key: 'UR', label: 'UR Spells / Prowess', desc: 'Instants/sorceries, prowess, tempo', colors: ['U','R'] },
  { key: 'BG', label: 'BG Graveyard Value', desc: 'Delve, dredge, self-mill, recursion', colors: ['B','G'] },
  { key: 'RW', label: 'RW Weenie / Equipment', desc: 'Small creatures, equipment, battalions', colors: ['R','W'] },
  { key: 'UG', label: 'UG Ramp / Simic Value', desc: 'Landfall, +1/+1, flash, big draw', colors: ['U','G'] },
];

const MANA_COLORS: Record<string, string> = {
  W: 'bg-mana-w text-black',
  U: 'bg-mana-u text-white',
  B: 'bg-mana-b text-white',
  R: 'bg-mana-r text-white',
  G: 'bg-mana-g text-white',
};

export default function CubeWizard() {
  const navigate = useNavigate();
  const config = useCubeStore((s) => s.config);
  const setConfig = useCubeStore((s) => s.setConfig);
  const toggleArchetype = useCubeStore((s) => s.toggleArchetype);
  const build = useCubeStore((s) => s.build);
  const isBuilding = useCubeStore((s) => s.isBuilding);
  const buildMessage = useCubeStore((s) => s.buildMessage);
  const buildPercent = useCubeStore((s) => s.buildPercent);
  const cancel = useCubeStore((s) => s.cancel);

  const [step, setStep] = useState(0);
  const [keywordInput, setKeywordInput] = useState('');
  const [bannedInput, setBannedInput] = useState('');

  const totalSteps = 7;

  const selectedArches = config.selectedArchetypes || [];
  const themeKeywords = config.themeKeywords || [];
  const bannedCards = config.bannedCards || [];

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !themeKeywords.includes(kw)) {
      setConfig({ themeKeywords: [...themeKeywords, kw] });
    }
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => {
    setConfig({ themeKeywords: themeKeywords.filter((k) => k !== kw) });
  };

  const addBanned = () => {
    const card = bannedInput.trim();
    if (card && !bannedCards.includes(card)) {
      setConfig({ bannedCards: [...bannedCards, card] });
    }
    setBannedInput('');
  };

  const removeBanned = (card: string) => {
    setConfig({ bannedCards: bannedCards.filter((c) => c !== card) });
  };

  const handleBuild = async () => {
    await build();
    const currentCube = useCubeStore.getState().cube;
    if (currentCube) {
      navigate('/analysis');
    }
  };

  const nextStep = () => {
    if (step < totalSteps - 1) setStep((s) => s + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-1 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-colors ${
              i <= step ? 'bg-primary' : 'bg-border'
            }`}
          />
        ))}
      </div>
      <div className="text-center text-text-muted text-sm mb-8">
        Step {step + 1} of {totalSteps}
      </div>

      <div className="glass rounded-xl p-6 border border-border/30">
        {/* Step 0: Cube Type */}
        {step === 0 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-text mb-1">Select Cube Type</h2>
            <p className="text-text-secondary text-sm mb-6">What kind of cube are you building?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CUBE_TYPES.map((ct) => (
                <button
                  key={ct.value}
                  onClick={() => setConfig({ cubeType: ct.value })}
                  className={`text-left p-4 rounded-lg border transition-all ${
                    config.cubeType === ct.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-border-light bg-card'
                  }`}
                >
                  <div className="text-text font-medium">{ct.label}</div>
                  <div className="text-text-muted text-xs mt-1">{ct.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Cube Size */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-text mb-1">Select Cube Size</h2>
            <p className="text-text-secondary text-sm mb-6">How many players do you want to support?</p>
            <div className="grid grid-cols-2 gap-3">
              {CUBE_SIZES.map((cs) => (
                <button
                  key={cs.value}
                  onClick={() => setConfig({ size: cs.value })}
                  className={`text-center p-4 rounded-lg border transition-all ${
                    config.size === cs.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-border-light bg-card'
                  }`}
                >
                  <div className="text-text font-medium">{cs.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Archetypes */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-text mb-1">Select Archetypes</h2>
            <p className="text-text-secondary text-sm mb-2">
              Choose which color pair archetypes to support. Default: all 10.
            </p>
            <p className="text-text-muted text-xs mb-6">
              {selectedArches.length} selected
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ARCHETYPES.map((arch) => (
                <button
                  key={arch.key}
                  onClick={() => toggleArchetype(arch.key)}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedArches.includes(arch.key)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-border-light bg-card opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-center gap-0.5 mb-1">
                    {arch.colors.map((c) => (
                      <span
                        key={c}
                        className={`inline-flex w-5 h-5 rounded-full items-center justify-center text-[10px] font-bold ${MANA_COLORS[c]}`}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="text-text text-xs font-medium">{arch.key}</div>
                  <div className="text-text-muted text-[10px] mt-0.5 leading-tight">{arch.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Power Level */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-text mb-1">Set Power Level</h2>
            <p className="text-text-secondary text-sm mb-6">
              1 = Pauper-level fair Magic, 10 = Vintage broken. Current: {config.powerLevel ?? 5}
            </p>
            <input
              type="range"
              min={1}
              max={10}
              value={config.powerLevel ?? 5}
              onChange={(e) => setConfig({ powerLevel: parseInt(e.target.value) })}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #00ff88 ${(config.powerLevel ?? 5) * 10}%, #1c1c1c ${(config.powerLevel ?? 5) * 10}%)`,
              }}
            />
            <div className="flex justify-between text-text-muted text-xs mt-2">
              <span>1 — Fair</span>
              <span>5 — Mid</span>
              <span>10 — Broken</span>
            </div>
          </div>
        )}

        {/* Step 4: Format Restrictions */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-text mb-1">Format Restrictions</h2>
            <p className="text-text-secondary text-sm mb-6">Limit your cube to specific formats (optional).</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['standard', 'modern', 'legacy', 'vintage', 'pauper', 'pioneer'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => {
                    const current = config.formatRestrictions || [];
                    const updated = current.includes(fmt)
                      ? current.filter((f) => f !== fmt)
                      : [...current, fmt];
                    setConfig({ formatRestrictions: updated });
                  }}
                  className={`p-3 rounded-lg border text-center capitalize transition-all ${
                    (config.formatRestrictions || []).includes(fmt)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-border-light bg-card'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Budget Ceiling */}
        {step === 5 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-text mb-1">Budget Ceiling</h2>
            <p className="text-text-secondary text-sm mb-6">
              Max price per card in USD. Leave blank for no limit.
            </p>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="No limit"
              value={config.budgetCeiling ?? ''}
              onChange={(e) => setConfig({ budgetCeiling: e.target.value ? parseFloat(e.target.value) : null })}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50"
            />
          </div>
        )}

        {/* Step 6: Themes + Banned */}
        {step === 6 && (
          <div className="animate-fade-in space-y-8">
            <div>
              <h2 className="text-xl font-bold text-text mb-1">Theme Keywords</h2>
              <p className="text-text-secondary text-sm mb-3">
                Tags that define your cube's focus (e.g., "graveyard", "tribal Elves", "artifacts").
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder='e.g. "graveyard matters"'
                  className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={addKeyword}
                  className="px-3 py-2 rounded-lg bg-primary/15 text-primary text-sm font-medium hover:bg-primary/25 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {themeKeywords.map((kw) => (
                  <span key={kw} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs">
                    {kw}
                    <button onClick={() => removeKeyword(kw)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-text mb-1">Banned Cards</h3>
              <p className="text-text-secondary text-sm mb-3">
                Specific cards to exclude from the cube.
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={bannedInput}
                  onChange={(e) => setBannedInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addBanned()}
                  placeholder='e.g. "Black Lotus"'
                  className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={addBanned}
                  className="px-3 py-2 rounded-lg bg-danger/15 text-danger text-sm font-medium hover:bg-danger/25 transition-colors"
                >
                  Ban
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {bannedCards.map((card) => (
                  <span key={card} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-danger/10 text-danger text-xs">
                    {card}
                    <button onClick={() => removeBanned(card)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => navigate('/')}
          className="px-3 py-2 rounded-md text-sm text-text-secondary hover:text-text hover:bg-hover transition-colors"
        >
          Back to Home
        </button>

        <div className="flex gap-2">
          {step > 0 && !isBuilding && (
            <button
              onClick={prevStep}
              className="flex items-center gap-1 px-4 py-2 rounded-md text-sm text-text-secondary hover:text-text hover:bg-hover transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
          )}

          {step < totalSteps - 1 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-1 px-4 py-2 rounded-md text-sm bg-primary text-black font-medium hover:bg-primary-light transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : isBuilding ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{buildMessage}</span>
                <span className="text-xs">({buildPercent}%)</span>
              </div>
              <button
                onClick={cancel}
                className="px-4 py-2 rounded-md text-sm bg-danger/15 text-danger hover:bg-danger/25"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleBuild}
              className="flex items-center gap-2 px-6 py-2 rounded-md text-sm bg-primary text-black font-bold hover:bg-primary-light transition-colors hover-lift"
            >
              <Zap className="w-4 h-4" /> Build Cube
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
