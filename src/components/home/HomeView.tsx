import { useNavigate } from 'react-router-dom';
import { FileUp, Search, GitMerge, PenLine, ArrowRight } from 'lucide-react';
import { useCubeStore } from '../../stores/cubeStore';
import { useUIStore } from '../../stores/uiStore';
import type { BuildMode } from '../../lib/types';

const modes = [
  {
    mode: 1 as BuildMode,
    icon: FileUp,
    title: 'Build from Collection',
    subtitle: 'Upload your ManaBox CSV and build a cube using only cards you own.',
    available: false,
    eta: 'Coming soon',
  },
  {
    mode: 2 as BuildMode,
    icon: GitMerge,
    title: 'Flesh Out Existing Cube',
    subtitle: 'Upload your cube + collection. We find gaps and suggest cards to fill them.',
    available: false,
    eta: 'Coming soon',
  },
  {
    mode: 3 as BuildMode,
    icon: Search,
    title: 'Upgrade a Cube',
    subtitle: 'Upload your cube and let us suggest upgrades from the full Scryfall database.',
    available: false,
    eta: 'Coming soon',
  },
  {
    mode: 4 as BuildMode,
    icon: PenLine,
    title: 'Theme-First Build',
    subtitle: 'Design a cube from scratch. Pick archetypes, themes, power level, and budget.',
    available: true,
    eta: null,
  },
];

export default function HomeView() {
  const navigate = useNavigate();
  const setMode = useCubeStore((s) => s.setMode);
  const onboardingComplete = useUIStore((s) => s.onboardingComplete);
  const onboardingDismissed = useUIStore((s) => s.onboardingDismissed);
  const setShowHelp = useUIStore((s) => s.setShowHelp);

  const handleModeClick = (mode: BuildMode, available: boolean) => {
    setMode(mode);
    if (!available) {
      const messages: Record<number, string> = {
        1: 'Mode 1 coming soon — upload your collection CSV and we\'ll build from your cards',
        2: 'Mode 2 coming soon — upload both your cube and collection CSVs',
        3: 'Mode 3 coming soon — upload your cube CSV for upgrade suggestions',
      };
      import('../../stores/toastStore').then((mod) => {
        mod.useToastStore.getState().addToast(messages[mode] || 'Coming soon', 'info');
      });
      return;
    }
    navigate('/wizard');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12 animate-fade-in-up">
        <h1 className="text-4xl font-bold text-primary mb-3 text-glow">
          Rabid Cube Builder
        </h1>
        <p className="text-text-secondary text-lg max-w-xl mx-auto">
          Design, analyze, and export Magic: The Gathering cubes.
          Build a self-contained draft format from scratch or improve your existing cube.
        </p>
        {!onboardingComplete && !onboardingDismissed && (
          <button
            onClick={() => setShowHelp(true)}
            className="mt-4 text-sm text-primary hover:text-primary-light transition-colors underline underline-offset-4"
          >
            New to cubes? Take the quick tour
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modes.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.mode}
              onClick={() => handleModeClick(m.mode, m.available)}
              className={`relative text-left p-6 rounded-xl border transition-all hover-lift ${
                m.available
                  ? 'border-border-light bg-card hover:border-primary/30 cursor-pointer'
                  : 'border-border bg-card/50 cursor-pointer opacity-70 hover:opacity-90'
              }`}
            >
              {m.eta && (
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                  {m.eta}
                </span>
              )}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                m.available ? 'bg-primary/15 text-primary' : 'bg-border text-text-muted'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-text mb-1">{m.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{m.subtitle}</p>
              {m.available && (
                <div className="flex items-center gap-1 mt-3 text-primary text-sm font-medium">
                  Get started <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
