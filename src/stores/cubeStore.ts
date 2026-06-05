import { create } from 'zustand';
import type { Cube, CubeConfig, CubeCard, CubeAnalysis, BuildMode, CubeType, CubeSize, ArchetypeKey } from '../lib/types';
import { buildCube, findCandidateCards } from '../lib/cube-engine';
import { useToastStore } from './toastStore';

interface CubeState {
  cube: Cube | null;
  cubeCards: CubeCard[];
  config: Partial<CubeConfig>;
  isBuilding: boolean;
  buildPhase: number;
  buildMessage: string;
  buildPercent: number;
  cancelBuild: (() => void) | null;
  analysis: CubeAnalysis | null;
  loadedCubeId: string | null;
  savedCubes: Array<{ id: string; name: string; config: string; created_at: string }>;

  setConfig: (partial: Partial<CubeConfig>) => void;
  setConfigField: <K extends keyof CubeConfig>(key: K, value: CubeConfig[K]) => void;
  toggleArchetype: (arch: ArchetypeKey) => void;
  setMode: (mode: BuildMode) => void;
  build: () => Promise<void>;
  cancel: () => void;
  loadCube: (id: string) => Promise<void>;
  saveCube: (name: string) => Promise<void>;
  deleteCube: (id: string) => Promise<void>;
  fetchSavedCubes: () => Promise<void>;
  resetAll: () => void;
}

function defaultConfig(): Partial<CubeConfig> {
  return {
    size: 360,
    cubeType: 'modern',
    powerLevel: 5,
    selectedArchetypes: ['WU', 'UB', 'BR', 'RG', 'GW', 'WB', 'UR', 'BG', 'RW', 'UG'],
    formatRestrictions: [],
    budgetCeiling: null,
    bannedCards: [],
    bannedSets: [],
    themeKeywords: [],
    mode: 4,
  };
}

export const useCubeStore = create<CubeState>((set, get) => ({
  cube: null,
  cubeCards: [],
  config: defaultConfig(),
  isBuilding: false,
  buildPhase: 0,
  buildMessage: '',
  buildPercent: 0,
  cancelBuild: null,
  analysis: null,
  loadedCubeId: null,
  savedCubes: [],

  setConfig: (partial) => set((s) => ({ config: { ...s.config, ...partial } })),
  setConfigField: (key, value) => set((s) => ({ config: { ...s.config, [key]: value } })),

  toggleArchetype: (arch) => set((s) => {
    const current = s.config.selectedArchetypes || [];
    const updated = current.includes(arch)
      ? current.filter((a) => a !== arch)
      : [...current, arch];
    return { config: { ...s.config, selectedArchetypes: updated } };
  }),

  setMode: (mode) => set((s) => ({ config: { ...s.config, mode: mode as BuildMode } })),

  build: async () => {
    const state = get();
    const config: CubeConfig = {
      size: (state.config.size as CubeSize) || 360,
      cubeType: (state.config.cubeType as CubeType) || 'modern',
      powerLevel: state.config.powerLevel ?? 5,
      selectedArchetypes: (state.config.selectedArchetypes as ArchetypeKey[]) || ['WU','UB','BR','RG','GW','WB','UR','BG','RW','UG'],
      formatRestrictions: state.config.formatRestrictions || [],
      budgetCeiling: state.config.budgetCeiling ?? null,
      bannedCards: state.config.bannedCards || [],
      bannedSets: state.config.bannedSets || [],
      themeKeywords: state.config.themeKeywords || [],
      mode: state.config.mode || 4,
    };

    let cancelled = false;
    const cancelFn = () => { cancelled = true; };

    set({ isBuilding: true, buildPhase: 0, buildMessage: 'Searching for cards...', buildPercent: 0, cancelBuild: cancelFn });

    try {
      const toast = useToastStore.getState().addToast;

      const searchResult = await findCandidateCards(config, {
        onProgress: (phase, message, percent) => {
          if (!cancelled) set({ buildPhase: phase, buildMessage: message, buildPercent: percent });
        },
        cancelled: () => cancelled,
      });

      if (cancelled) { set({ isBuilding: false, cancelBuild: null }); return; }

      if (searchResult.error) {
        toast(searchResult.error, 'error');
        set({ isBuilding: false, cancelBuild: null });
        return;
      }

      const cardPool = searchResult.cards;

      if (cardPool.length < 60) {
        toast(`Only found ${cardPool.length} cards matching your criteria. Try broader filters or a different cube type.`, 'error');
        set({ isBuilding: false, cancelBuild: null });
        return;
      }

      const cube = await buildCube(config, cardPool, {
        onProgress: (phase, message, percent) => {
          if (!cancelled) set({ buildPhase: phase, buildMessage: message, buildPercent: percent });
        },
        cancelled: () => cancelled,
      });

      if (cancelled) { set({ isBuilding: false, cancelBuild: null }); return; }

      set({
        cube,
        cubeCards: cube.cubeCards,
        analysis: cube.analysis,
        isBuilding: false,
        buildPhase: 9,
        buildMessage: 'Complete!',
        buildPercent: 100,
        cancelBuild: null,
      });

      toast(`Cube built: ${cube.cubeCards.length} cards across ${cube.slots.length} slots`, 'success');
    } catch (err) {
      if (!cancelled) {
        useToastStore.getState().addToast(`Build failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      }
      set({ isBuilding: false, cancelBuild: null });
    }
  },

  cancel: () => {
    const cancel = get().cancelBuild;
    if (cancel) cancel();
  },

  loadCube: async () => {
    useToastStore.getState().addToast('Load cube not yet implemented in full', 'info');
  },

  saveCube: async () => {
    useToastStore.getState().addToast('Save cube not yet implemented in full', 'info');
  },

  deleteCube: async () => {
    useToastStore.getState().addToast('Delete cube not yet implemented in full', 'info');
  },

  fetchSavedCubes: async () => {
  },

  resetAll: () => set({
    cube: null,
    cubeCards: [],
    config: defaultConfig(),
    isBuilding: false,
    buildPhase: 0,
    buildMessage: '',
    buildPercent: 0,
    cancelBuild: null,
    analysis: null,
    loadedCubeId: null,
  }),
}));
