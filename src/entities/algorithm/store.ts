import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type AlgorithmType = 
  | 'bubble' 
  | 'selection' 
  | 'insertion' 
  | 'merge' 
  | 'quick' 
  | 'heap';

export type GridCellType = 0 | 1 | 2 | 3;

export interface TreeNode {
  value: number;
  left: TreeNode | null;
  right: TreeNode | null;
  isBalanced?: boolean;
  height?: number;
}

export interface ArrayData {
  value: number;
  isComparing?: boolean;
  isSwapping?: boolean;
  isSorted?: boolean;
  isPivot?: boolean;
}

export interface SortAlgorithm {
  name: AlgorithmType;
  displayName: string;
  complexity: string;
  category: 'simple' | 'efficient';
}

export interface AlgorithmState {
  // Core state
  isRunning: boolean;
  isPaused: boolean;
  isFocusMode: boolean;
  speed: number; // 1-100, where 100 is fastest
  
  // Algorithm state
  currentAlgorithm: AlgorithmType;
  arrayData: ArrayData[];
  arraySize: number;
  minValue: number;
  maxValue: number;
  
  // Statistics
  comparisons: number;
  swaps: number;
  totalOperations: number;
  
  // Grid state (for pathfinding)
  gridRows: number;
  gridCols: number;
  gridData: GridCellType[][];
  
  // Tree state (for BST/AVL visualization)
  treeRoot: TreeNode | null;
  
  // Callbacks
  onAlgorithmComplete: () => void;
  onAlgorithmStep: () => void;
}

const defaultArrayData = (size: number, min: number, max: number): ArrayData[] => {
  return Array.from({ length: size }, () => ({
    value: Math.floor(Math.random() * (max - min + 1)) + min,
  }));
};

const ALGORITHM_LIST: Record<AlgorithmType, SortAlgorithm> = {
  bubble: { name: 'bubble', displayName: 'Bubble Sort', complexity: 'O(n²)', category: 'simple' },
  selection: { name: 'selection', displayName: 'Selection Sort', complexity: 'O(n²)', category: 'simple' },
  insertion: { name: 'insertion', displayName: 'Insertion Sort', complexity: 'O(n²)', category: 'simple' },
  merge: { name: 'merge', displayName: 'Merge Sort', complexity: 'O(n log n)', category: 'efficient' },
  quick: { name: 'quick', displayName: 'Quick Sort', complexity: 'O(n log n)', category: 'efficient' },
  heap: { name: 'heap', displayName: 'Heap Sort', complexity: 'O(n log n)', category: 'efficient' },
};

interface AlgorithmActions {
  // Playback controls
  toggleRunning: () => void;
  togglePause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  toggleFocusMode: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  
  // Algorithm selection
  setAlgorithm: (algorithm: AlgorithmType) => void;
  getAlgorithm: (type: AlgorithmType) => SortAlgorithm;
  getAllAlgorithms: () => SortAlgorithm[];
  
  // Array manipulation
  generateArray: (size?: number, min?: number, max?: number) => void;
  setArraySize: (size: number) => void;
  setArrayValues: (values: number[]) => void;
  setArrayRange: (min: number, max: number) => void;
  
  // Statistics
  resetStats: () => void;
  incrementComparisons: (count?: number) => void;
  incrementSwaps: (count?: number) => void;
  
  // Grid operations
  setGridSize: (rows: number, cols: number) => void;
  generateGrid: () => void;
  setGridCell: (row: number, col: number, value: GridCellType) => void;
  
  // Tree operations
  setTreeRoot: (root: TreeNode | null) => void;
  insertTreeNode: (value: number) => void;
  
  // Utility
  markArrayAsSorted: () => void;
}

interface AlgorithmStore {
  state: AlgorithmState;
  actions: AlgorithmActions;
}

const initialState: AlgorithmState = {
  isRunning: false,
  isPaused: false,
  isFocusMode: false,
  speed: 50,
  currentAlgorithm: 'bubble',
  arrayData: [],
  arraySize: 100,
  minValue: 1,
  maxValue: 100,
  comparisons: 0,
  swaps: 0,
  totalOperations: 0,
  gridRows: 20,
  gridCols: 30,
  gridData: [],
  treeRoot: null,
  onAlgorithmComplete: () => {},
  onAlgorithmStep: () => {},
};

// Generate initial array data
const initialArrayData = defaultArrayData(initialState.arraySize, initialState.minValue, initialState.maxValue);

export const useAlgorithmStore = create<AlgorithmStore>()(
  devtools(
    persist(
      (set, get) => ({
        state: {
          ...initialState,
          arrayData: initialArrayData,
        },
        actions: {
          toggleRunning: () => {
            set((state) => ({
              state: {
                ...state.state,
                isRunning: !state.state.isRunning,
                isPaused: state.state.isRunning ? false : state.state.isPaused,
              },
            }));
          },
          togglePause: () => {
            set((state) => ({
              state: {
                ...state.state,
                isPaused: !state.state.isPaused,
              },
            }));
          },
          stop: () => {
            set((state) => ({
              state: {
                ...state.state,
                isRunning: false,
                isPaused: false,
              },
            }));
          },
          setSpeed: (speed: number) => {
            set((state) => ({
              state: {
                ...state.state,
                speed: Math.max(1, Math.min(100, speed)),
              },
            }));
          },
          toggleFocusMode: () => {
            set((state) => ({
              state: {
                ...state.state,
                isFocusMode: !state.state.isFocusMode,
              },
            }));
          },
          stepForward: () => {
            set((state) => ({
              state: {
                ...state.state,
                totalOperations: state.state.totalOperations + 1,
              },
            }));
          },
          stepBackward: () => {
            set((state) => ({
              state: {
                ...state.state,
                totalOperations: Math.max(0, state.state.totalOperations - 1),
              },
            }));
          },
          setAlgorithm: (algorithm: AlgorithmType) => {
            set((state) => ({
              state: {
                ...state.state,
                currentAlgorithm: algorithm,
              },
            }));
          },
          getAlgorithm: (type: AlgorithmType): SortAlgorithm => {
            return ALGORITHM_LIST[type];
          },
          getAllAlgorithms: (): SortAlgorithm[] => {
            return Object.values(ALGORITHM_LIST);
          },
          generateArray: (size?: number, min?: number, max?: number) => {
            const newSize = size ?? get().state.arraySize;
            const newMin = min ?? get().state.minValue;
            const newMax = max ?? get().state.maxValue;
            set((state) => ({
              state: {
                ...state.state,
                arrayData: defaultArrayData(newSize, newMin, newMax),
                arraySize: newSize,
                minValue: newMin,
                maxValue: newMax,
                comparisons: 0,
                swaps: 0,
                totalOperations: 0,
              },
            }));
          },
          setArraySize: (size: number) => {
            set((state) => ({
              state: {
                ...state.state,
                arraySize: size,
                arrayData: defaultArrayData(size, state.state.minValue, state.state.maxValue),
              },
            }));
          },
          setArrayValues: (values: number[]) => {
            set((state) => ({
              state: {
                ...state.state,
                arrayData: values.map((v) => ({ value: v })),
              },
            }));
          },
          setArrayRange: (min: number, max: number) => {
            set((state) => ({
              state: {
                ...state.state,
                minValue: min,
                maxValue: max,
                arrayData: defaultArrayData(state.state.arraySize, min, max),
              },
            }));
          },
          resetStats: () => {
            set((state) => ({
              state: {
                ...state.state,
                comparisons: 0,
                swaps: 0,
                totalOperations: 0,
              },
            }));
          },
          incrementComparisons: (count = 1) => {
            set((state) => ({
              state: {
                ...state.state,
                comparisons: state.state.comparisons + count,
                totalOperations: state.state.totalOperations + count,
              },
            }));
          },
          incrementSwaps: (count = 1) => {
            set((state) => ({
              state: {
                ...state.state,
                swaps: state.state.swaps + count,
                totalOperations: state.state.totalOperations + count,
              },
            }));
          },
          setGridSize: (rows: number, cols: number) => {
            set((state) => ({
              state: {
                ...state.state,
                gridRows: rows,
                gridCols: cols,
                gridData: Array(rows).fill(0).map(() => Array(cols).fill(0) as GridCellType[]) as GridCellType[][],
              },
            }));
          },
          generateGrid: () => {
            const { gridRows, gridCols } = get().state;
            const gridData = Array(gridRows).fill(0).map((_, row) =>
              Array(gridCols).fill(0).map((_, col) => {
                return Math.random() < 0.1 ? 1 : 0;
              }) as GridCellType[]
            ) as GridCellType[][];
            gridData[0][0] = 2;
            gridData[gridRows - 1][gridCols - 1] = 3;
            set((state) => ({
              state: {
                ...state.state,
                gridData,
              },
            }));
          },
          setGridCell: (row: number, col: number, value: GridCellType) => {
            set((state) => {
              const newGridData = state.state.gridData.map((r, ri) =>
                r.map((c, ci) => (ri === row && ci === col ? value : c))
              );
              return { state: { ...state.state, gridData: newGridData } };
            });
          },
          setTreeRoot: (root: TreeNode | null) => {
            set((state) => ({
              state: {
                ...state.state,
                treeRoot: root,
              },
            }));
          },
          insertTreeNode: (value: number) => {
            const { treeRoot } = get().state;
            const newNode: TreeNode = { value, left: null, right: null };
            
            if (!treeRoot) {
              set((state) => ({ state: { ...state.state, treeRoot: newNode } }));
              return;
            }
            
            let current: TreeNode | null = treeRoot;
            while (current) {
              if (value < current.value) {
                if (!current.left) {
                  current.left = newNode;
                  break;
                }
                current = current.left;
              } else {
                if (!current.right) {
                  current.right = newNode;
                  break;
                }
                current = current.right;
              }
            }
            set((state) => ({ state: { ...state.state, treeRoot } }));
          },
          markArrayAsSorted: () => {
            set((state) => ({
              state: {
                ...state.state,
                arrayData: state.state.arrayData.map((item) => ({
                  ...item,
                  isSorted: true,
                })),
                isRunning: false,
              },
            }));
          },
        },
      }),
      {
        name: 'algorithm-storage',
        partialize: (state) => ({
          state: {
            arraySize: state.state.arraySize,
            minValue: state.state.minValue,
            maxValue: state.state.maxValue,
            speed: state.state.speed,
            currentAlgorithm: state.state.currentAlgorithm,
          },
        }),
        onRehydrateStorage: () => {
          // After hydration, regenerate arrayData if it's empty
          return (state) => {
            if (state && (!state.state.arrayData || state.state.arrayData.length === 0)) {
              state.state.arrayData = defaultArrayData(state.state.arraySize, state.state.minValue, state.state.maxValue);
            }
          };
        },
      }
    ),
    { name: 'algorithm-store' }
  )
);

// Helper hooks for cleaner component code
export const useAlgorithmState = () => useAlgorithmStore((state) => state.state);
export const useAlgorithmActions = () => useAlgorithmStore((state) => state.actions);