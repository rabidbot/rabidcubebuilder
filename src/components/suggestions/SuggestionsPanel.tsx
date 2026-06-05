import { useNavigate } from 'react-router-dom';
import { Lightbulb, ArrowLeft } from 'lucide-react';

export default function SuggestionsPanel() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-purple/10 flex items-center justify-center">
          <Lightbulb className="w-8 h-8 text-purple" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Cube Suggestions</h2>
        <p className="text-text-secondary max-w-md mx-auto mb-6">
          Upload your existing cube CSV for upgrade suggestions, or pair it with your collection for gap-filling recommendations.
        </p>
      </div>

      <div className="glass rounded-xl p-8 border border-border/30 max-w-md mx-auto">
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-card border border-border">
            <h3 className="text-text font-medium text-sm mb-2">Mode 2: Flesh Out</h3>
            <p className="text-text-muted text-xs">
              Upload your current cube CSV plus your collection CSV. We analyze gaps and suggest cards from your collection to fill them. Locked cards are never removed.
            </p>
            <div className="mt-3 px-3 py-1.5 rounded bg-purple/10 text-purple text-xs font-medium inline-block">
              Coming Soon
            </div>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <h3 className="text-text font-medium text-sm mb-2">Mode 3: Upgrade</h3>
            <p className="text-text-muted text-xs">
              Upload your cube CSV. We suggest upgrades from the full Scryfall card pool with power-level delta analysis and budget filtering.
            </p>
            <div className="mt-3 px-3 py-1.5 rounded bg-purple/10 text-purple text-xs font-medium inline-block">
              Coming Soon
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 mx-auto mt-6 px-4 py-2 rounded-md text-sm text-text-secondary hover:text-text hover:bg-hover transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>
    </div>
  );
}
