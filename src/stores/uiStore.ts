import { create } from 'zustand';

interface UIState {
  onboardingComplete: boolean;
  onboardingDismissed: boolean;
  showHelp: boolean;
  setOnboardingComplete: (val: boolean) => void;
  setOnboardingDismissed: (val: boolean) => void;
  setShowHelp: (val: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  onboardingComplete: typeof window !== 'undefined' ? localStorage.getItem('cube-onboarding-v1-seen') === 'true' : true,
  onboardingDismissed: false,
  showHelp: false,
  setOnboardingComplete: (val) => {
    localStorage.setItem('cube-onboarding-v1-seen', String(val));
    set({ onboardingComplete: val });
  },
  setOnboardingDismissed: (val) => set({ onboardingDismissed: val }),
  setShowHelp: (val) => set({ showHelp: val }),
}));
