import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Boxes, BarChart3, Zap } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

const steps = [
  {
    icon: Boxes,
    title: 'What is a Cube?',
    desc: 'A Magic: The Gathering Cube is a curated collection of 360+ cards designed to be drafted by 8 players. Each draft creates unique 40-card decks from the same card pool — infinite replayability.',
  },
  {
    icon: Zap,
    title: 'Choose Your Mode',
    desc: 'Build a cube from scratch with themes, flesh out an existing cube from your collection, find upgrades from the full Scryfall database, or get AI-powered suggestions to improve your cube.',
  },
  {
    icon: BarChart3,
    title: 'Analyze & Export',
    desc: 'View mana curves, color balance, archetype coverage, and synergy density. Export to CubeCobra, CSV, or plain text. Your cube is ready for draft night.',
  },
];

export default function OnboardingModal() {
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);
  const setOnboardingComplete = useUIStore((s) => s.setOnboardingComplete);
  const setOnboardingDismissed = useUIStore((s) => s.setOnboardingDismissed);
  const setShowHelp = useUIStore((s) => s.setShowHelp);

  const handleClose = () => {
    if (dontShow) setOnboardingComplete(true);
    setOnboardingDismissed(true);
    setShowHelp(false);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  };

  const StepIcon = steps[step].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-xl max-w-md w-full mx-4 p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-primary">
            <StepIcon className="w-6 h-6" />
            <span className="font-bold">Step {step + 1} of {steps.length}</span>
          </div>
          <button onClick={handleClose} className="p-1 rounded hover:bg-hover text-text-muted hover:text-text">
            <X className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-xl font-bold text-text mb-2">{steps[step].title}</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-6">{steps[step].desc}</p>

        <div className="flex gap-1 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-text-muted text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="rounded border-border bg-card"
            />
            Don't show again
          </label>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-text-secondary hover:text-text hover:bg-hover transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 rounded-md text-sm bg-primary text-black font-medium hover:bg-primary-light transition-colors"
            >
              {step === steps.length - 1 ? 'Got it' : 'Next'}
              {step !== steps.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
