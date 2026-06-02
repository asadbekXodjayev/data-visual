import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type AlgorithmType =
  | 'bubble'
  | 'selection'
  | 'insertion'
  | 'gnome'
  | 'merge'
  | 'quick'
  | 'heap'
  | 'shell'
  | 'radix'
  | 'counting'
  | 'bucket'
  | 'comb'
  | 'cocktail'
  | 'oddEven'
  | 'pancake'
  | 'cycle';

export type AlgorithmCategory = 'simple' | 'efficient' | 'distribution' | 'exotic';

export type Distribution = 'random' | 'nearlySorted' | 'reversed' | 'fewUnique';

export interface Complexity {
  best: string;
  average: string;
  worst: string;
  space: string;
}

export interface SortAlgorithm {
  name: AlgorithmType;
  displayName: string;
  category: AlgorithmCategory;
  complexity: Complexity;
  stable: boolean;
  blurb: string;
}

export interface ArrayData {
  value: number;
}

export interface AlgorithmState {
  isRunning: boolean;
  isPaused: boolean;
  speed: number; // 1-100, where 100 is fastest

  currentAlgorithm: AlgorithmType;
  arrayData: ArrayData[];
  arraySize: number;
  minValue: number;
  maxValue: number;
  distribution: Distribution;

  comparisons: number;
  swaps: number;
  writes: number;
  totalOperations: number;
}

export const ALGORITHM_LIST: Record<AlgorithmType, SortAlgorithm> = {
  bubble: {
    name: 'bubble',
    displayName: 'Bubble Sort',
    category: 'simple',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    stable: true,
    blurb: 'Repeatedly swaps adjacent out-of-order pairs, bubbling the largest to the end each pass.',
  },
  selection: {
    name: 'selection',
    displayName: 'Selection Sort',
    category: 'simple',
    complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    stable: false,
    blurb: 'Selects the minimum of the unsorted tail and moves it into place — minimal swaps, many compares.',
  },
  insertion: {
    name: 'insertion',
    displayName: 'Insertion Sort',
    category: 'simple',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    stable: true,
    blurb: 'Grows a sorted prefix, shifting each new element back to its slot. Excellent on nearly-sorted data.',
  },
  gnome: {
    name: 'gnome',
    displayName: 'Gnome Sort',
    category: 'simple',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    stable: true,
    blurb: 'Like insertion sort but steps backward one swap at a time — the "garden gnome" method.',
  },
  merge: {
    name: 'merge',
    displayName: 'Merge Sort',
    category: 'efficient',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
    stable: true,
    blurb: 'Divides the array, recursively sorts halves, and merges them back — guaranteed O(n log n).',
  },
  quick: {
    name: 'quick',
    displayName: 'Quick Sort',
    category: 'efficient',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
    stable: false,
    blurb: 'Partitions around a pivot (Lomuto) and recurses — fast in practice, in-place.',
  },
  heap: {
    name: 'heap',
    displayName: 'Heap Sort',
    category: 'efficient',
    complexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
    stable: false,
    blurb: 'Builds a max-heap then repeatedly extracts the root — O(n log n) with no extra memory.',
  },
  shell: {
    name: 'shell',
    displayName: 'Shell Sort',
    category: 'efficient',
    complexity: { best: 'O(n log n)', average: 'O(n^1.3)', worst: 'O(n²)', space: 'O(1)' },
    stable: false,
    blurb: 'Gapped insertion sort (Knuth sequence) that lets distant elements jump into place.',
  },
  radix: {
    name: 'radix',
    displayName: 'Radix Sort',
    category: 'distribution',
    complexity: { best: 'O(nk)', average: 'O(nk)', worst: 'O(nk)', space: 'O(n+k)' },
    stable: true,
    blurb: 'Non-comparison LSD sort: stable counting pass per base-10 digit. No comparisons at all.',
  },
  counting: {
    name: 'counting',
    displayName: 'Counting Sort',
    category: 'distribution',
    complexity: { best: 'O(n+k)', average: 'O(n+k)', worst: 'O(n+k)', space: 'O(k)' },
    stable: true,
    blurb: 'Tallies occurrences of each value then writes them back in order. Linear for small ranges.',
  },
  bucket: {
    name: 'bucket',
    displayName: 'Bucket Sort',
    category: 'distribution',
    complexity: { best: 'O(n+k)', average: 'O(n+k)', worst: 'O(n²)', space: 'O(n+k)' },
    stable: true,
    blurb: 'Scatters values into range buckets, sorts each, then gathers them in order.',
  },
  comb: {
    name: 'comb',
    displayName: 'Comb Sort',
    category: 'exotic',
    complexity: { best: 'O(n log n)', average: 'O(n²/2^p)', worst: 'O(n²)', space: 'O(1)' },
    stable: false,
    blurb: 'Bubble sort with a shrinking gap (÷1.3) that eliminates small values stuck near the end.',
  },
  cocktail: {
    name: 'cocktail',
    displayName: 'Cocktail Sort',
    category: 'exotic',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    stable: true,
    blurb: 'Bidirectional bubble sort that sweeps forward then backward each round.',
  },
  oddEven: {
    name: 'oddEven',
    displayName: 'Odd-Even Sort',
    category: 'exotic',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    stable: true,
    blurb: 'Brick sort: alternately compare-exchanges odd-indexed then even-indexed pairs. Parallel-friendly.',
  },
  pancake: {
    name: 'pancake',
    displayName: 'Pancake Sort',
    category: 'exotic',
    complexity: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    stable: false,
    blurb: 'Sorts by repeatedly flipping a prefix of the array — like ordering a stack of pancakes.',
  },
  cycle: {
    name: 'cycle',
    displayName: 'Cycle Sort',
    category: 'exotic',
    complexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
    stable: false,
    blurb: 'Theoretically optimal in writes — each value is moved to its final spot exactly once.',
  },
};

const generateValues = (size: number, min: number, max: number, distribution: Distribution): number[] => {
  const span = max - min;
  const randomValue = () => Math.floor(Math.random() * (span + 1)) + min;

  switch (distribution) {
    case 'reversed': {
      return Array.from({ length: size }, (_, i) =>
        Math.round(max - (i / Math.max(1, size - 1)) * span),
      );
    }
    case 'nearlySorted': {
      const sorted = Array.from({ length: size }, (_, i) =>
        Math.round(min + (i / Math.max(1, size - 1)) * span),
      );
      const swaps = Math.max(1, Math.floor(size * 0.05));
      for (let s = 0; s < swaps; s++) {
        const a = Math.floor(Math.random() * size);
        const b = Math.min(size - 1, a + 1 + Math.floor(Math.random() * 3));
        [sorted[a], sorted[b]] = [sorted[b], sorted[a]];
      }
      return sorted;
    }
    case 'fewUnique': {
      const buckets = [min, min + Math.round(span * 0.33), min + Math.round(span * 0.66), max];
      return Array.from({ length: size }, () => buckets[Math.floor(Math.random() * buckets.length)]);
    }
    case 'random':
    default:
      return Array.from({ length: size }, randomValue);
  }
};

const makeArray = (size: number, min: number, max: number, distribution: Distribution): ArrayData[] =>
  generateValues(size, min, max, distribution).map((value) => ({ value }));

export interface AlgorithmActions {
  toggleRunning: () => void;
  togglePause: () => void;
  stop: () => void;
  setRunning: (running: boolean) => void;
  setSpeed: (speed: number) => void;

  setAlgorithm: (algorithm: AlgorithmType) => void;
  getAlgorithm: (type: AlgorithmType) => SortAlgorithm;
  getAllAlgorithms: () => SortAlgorithm[];

  generateArray: () => void;
  setArraySize: (size: number) => void;
  setArrayValues: (values: number[]) => void;
  setRange: (min: number, max: number) => void;
  setDistribution: (distribution: Distribution) => void;

  resetStats: () => void;
  incrementComparisons: (count?: number) => void;
  incrementSwaps: (count?: number) => void;
  incrementWrites: (count?: number) => void;
}

interface AlgorithmStore {
  state: AlgorithmState;
  actions: AlgorithmActions;
}

const MIN_VALUE = 5;
const MAX_VALUE = 100;

const initialState: AlgorithmState = {
  isRunning: false,
  isPaused: false,
  speed: 55,
  currentAlgorithm: 'quick',
  arrayData: [],
  arraySize: 60,
  minValue: MIN_VALUE,
  maxValue: MAX_VALUE,
  distribution: 'random',
  comparisons: 0,
  swaps: 0,
  writes: 0,
  totalOperations: 0,
};

export const useAlgorithmStore = create<AlgorithmStore>()(
  devtools(
    persist(
      (set, get) => ({
        state: {
          ...initialState,
          arrayData: makeArray(initialState.arraySize, MIN_VALUE, MAX_VALUE, initialState.distribution),
        },
        actions: {
          toggleRunning: () =>
            set((s) => ({ state: { ...s.state, isRunning: !s.state.isRunning, isPaused: false } })),
          togglePause: () => set((s) => ({ state: { ...s.state, isPaused: !s.state.isPaused } })),
          stop: () => set((s) => ({ state: { ...s.state, isRunning: false, isPaused: false } })),
          setRunning: (running) =>
            set((s) => ({ state: { ...s.state, isRunning: running, isPaused: running ? s.state.isPaused : false } })),
          setSpeed: (speed) =>
            set((s) => ({ state: { ...s.state, speed: Math.max(1, Math.min(100, Math.round(speed))) } })),

          setAlgorithm: (algorithm) =>
            set((s) => (s.state.isRunning ? s : { state: { ...s.state, currentAlgorithm: algorithm } })),
          getAlgorithm: (type) => ALGORITHM_LIST[type],
          getAllAlgorithms: () => Object.values(ALGORITHM_LIST),

          generateArray: () =>
            set((s) => ({
              state: {
                ...s.state,
                arrayData: makeArray(s.state.arraySize, s.state.minValue, s.state.maxValue, s.state.distribution),
                comparisons: 0,
                swaps: 0,
                writes: 0,
                totalOperations: 0,
                isRunning: false,
                isPaused: false,
              },
            })),
          setArraySize: (size) =>
            set((s) => {
              const clamped = Math.max(5, Math.min(200, Math.round(size)));
              return {
                state: {
                  ...s.state,
                  arraySize: clamped,
                  arrayData: makeArray(clamped, s.state.minValue, s.state.maxValue, s.state.distribution),
                  comparisons: 0,
                  swaps: 0,
                  writes: 0,
                  totalOperations: 0,
                  isRunning: false,
                  isPaused: false,
                },
              };
            }),
          setArrayValues: (values) =>
            set((s) => ({ state: { ...s.state, arrayData: values.map((value) => ({ value })) } })),
          setRange: (min, max) =>
            set((s) => ({
              state: {
                ...s.state,
                minValue: min,
                maxValue: max,
                arrayData: makeArray(s.state.arraySize, min, max, s.state.distribution),
              },
            })),
          setDistribution: (distribution) =>
            set((s) => ({
              state: {
                ...s.state,
                distribution,
                arrayData: makeArray(s.state.arraySize, s.state.minValue, s.state.maxValue, distribution),
                comparisons: 0,
                swaps: 0,
                writes: 0,
                totalOperations: 0,
                isRunning: false,
                isPaused: false,
              },
            })),

          resetStats: () =>
            set((s) => ({ state: { ...s.state, comparisons: 0, swaps: 0, writes: 0, totalOperations: 0 } })),
          incrementComparisons: (count = 1) =>
            set((s) => ({
              state: { ...s.state, comparisons: s.state.comparisons + count, totalOperations: s.state.totalOperations + count },
            })),
          incrementSwaps: (count = 1) =>
            set((s) => ({
              state: { ...s.state, swaps: s.state.swaps + count, totalOperations: s.state.totalOperations + count },
            })),
          incrementWrites: (count = 1) =>
            set((s) => ({
              state: { ...s.state, writes: s.state.writes + count, totalOperations: s.state.totalOperations + count },
            })),
        },
      }),
      {
        name: 'algorithm-storage',
        version: 2,
        partialize: (s) => ({
          state: {
            arraySize: s.state.arraySize,
            minValue: s.state.minValue,
            maxValue: s.state.maxValue,
            speed: s.state.speed,
            currentAlgorithm: s.state.currentAlgorithm,
            distribution: s.state.distribution,
          },
        }),
        merge: (persisted, current) => {
          const p = persisted as { state?: Partial<AlgorithmState> } | undefined;
          const next: AlgorithmStore = {
            ...current,
            state: { ...current.state, ...(p?.state ?? {}) },
          };
          // Guard against a persisted algorithm key that no longer exists.
          if (!next.state.currentAlgorithm || !(next.state.currentAlgorithm in ALGORITHM_LIST)) {
            next.state.currentAlgorithm = initialState.currentAlgorithm;
          }
          next.state.arrayData = makeArray(
            next.state.arraySize,
            next.state.minValue,
            next.state.maxValue,
            next.state.distribution,
          );
          next.state.isRunning = false;
          next.state.isPaused = false;
          return next;
        },
      },
    ),
    { name: 'algorithm-store' },
  ),
);

export const useAlgorithmState = () => useAlgorithmStore((state) => state.state);
export const useAlgorithmActions = () => useAlgorithmStore((state) => state.actions);
