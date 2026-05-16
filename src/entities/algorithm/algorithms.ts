import { ArrayData } from './store';

export type SwapOperation = { type: 'swap'; indices: [number, number] };
export type CompareOperation = { type: 'compare'; indices: [number, number] };
export type MarkSortedOperation = { type: 'markSorted' };
export type PivotOperation = { type: 'pivot'; index: number };
export type ResetOperation = { type: 'reset' };

export type AlgorithmOperation = 
  | SwapOperation 
  | CompareOperation 
  | MarkSortedOperation 
  | PivotOperation 
  | ResetOperation;

// Generator function types for different algorithm categories
export type SortGenerator = (arr: ArrayData[]) => Generator<AlgorithmOperation, void, unknown>;

/**
 * BUBBLE SORT - Simple
 * Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order
 */
export function* bubbleSort(arr: ArrayData[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      yield { type: 'compare', indices: [j, j + 1] };
      if (arr[j].value > arr[j + 1].value) {
        yield { type: 'swap', indices: [j, j + 1] };
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  yield { type: 'markSorted' };
}

/**
 * SELECTION SORT - Simple
 * Divides the input list into two parts: a sorted sublist and unsorted sublist
 */
export function* selectionSort(arr: ArrayData[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      yield { type: 'compare', indices: [minIdx, j] };
      if (arr[j].value < arr[minIdx].value) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      yield { type: 'swap', indices: [i, minIdx] };
      const temp = arr[i];
      arr[i] = arr[minIdx];
      arr[minIdx] = temp;
    }
  }
  yield { type: 'markSorted' };
}

/**
 * INSERTION SORT - Simple
 * Builds the final sorted array one item at a time
 */
export function* insertionSort(arr: ArrayData[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      yield { type: 'compare', indices: [j - 1, j] };
      if (arr[j - 1].value > arr[j].value) {
        yield { type: 'swap', indices: [j - 1, j] };
        const temp = arr[j];
        arr[j] = arr[j - 1];
        arr[j - 1] = temp;
        j--;
      } else {
        break;
      }
    }
  }
  yield { type: 'markSorted' };
}

/**
 * MERGE SORT - Efficient
 * Divides the input list into two halves, recursively sorts them, and merges the sorted halves
 */
export function* mergeSort(arr: ArrayData[]): Generator<AlgorithmOperation, void, unknown> {
  yield* mergeSortHelper(arr, 0, arr.length - 1);
  yield { type: 'markSorted' };
}

function* mergeSortHelper(
  arr: ArrayData[], 
  left: number, 
  right: number
): Generator<AlgorithmOperation, void, unknown> {
  if (left >= right) return;
  
  const mid = Math.floor((left + right) / 2);
  yield* mergeSortHelper(arr, left, mid);
  yield* mergeSortHelper(arr, mid + 1, right);
  yield* merge(arr, left, mid, right);
}

function* merge(
  arr: ArrayData[], 
  left: number, 
  mid: number, 
  right: number
): Generator<AlgorithmOperation, void, unknown> {
  const leftArr = arr.slice(left, mid + 1);
  const rightArr = arr.slice(mid + 1, right + 1);
  
  let i = 0, j = 0, k = left;
  
  while (i < leftArr.length && j < rightArr.length) {
    yield { type: 'compare', indices: [left + i, mid + 1 + j] };
    if (leftArr[i].value <= rightArr[j].value) {
      arr[k] = leftArr[i];
      i++;
    } else {
      arr[k] = rightArr[j];
      j++;
    }
    k++;
  }
  
  while (i < leftArr.length) {
    arr[k] = leftArr[i];
    i++;
    k++;
  }
  
  while (j < rightArr.length) {
    arr[k] = rightArr[j];
    j++;
    k++;
  }
}

/**
 * QUICK SORT - Efficient (Dual-Pivot)
 * Uses two pivot points to partition the array into three parts
 */
export function* quickSort(arr: ArrayData[]): Generator<AlgorithmOperation, void, unknown> {
  yield* quickSortHelper(arr, 0, arr.length - 1);
  yield { type: 'markSorted' };
}

function* quickSortHelper(
  arr: ArrayData[], 
  left: number, 
  right: number
): Generator<AlgorithmOperation, void, unknown> {
  if (left >= right) return;
  
  // Choose two pivots
  if (arr[left].value > arr[right].value) {
    yield { type: 'swap', indices: [left, right] };
    const temp = arr[left];
    arr[left] = arr[right];
    arr[right] = temp;
  }
  
  let low = left + 1;
  let high = right - 1;
  
  let i = low;
  while (i <= high) {
    yield { type: 'pivot', index: left };
    yield { type: 'pivot', index: right };
    yield { type: 'compare', indices: [i, left] };
    
    if (arr[i].value < arr[left].value) {
      yield { type: 'swap', indices: [i, low] };
      const temp = arr[i];
      arr[i] = arr[low];
      arr[low] = temp;
      low++;
    } else if (arr[i].value > arr[right].value) {
      yield { type: 'swap', indices: [i, high] };
      const temp = arr[i];
      arr[i] = arr[high];
      arr[high] = temp;
      high--;
      continue;
    }
    i++;
  }
  
  low--;
  high++;
  
  yield { type: 'swap', indices: [left, low] };
  const temp = arr[left];
  arr[left] = arr[low];
  arr[low] = temp;
  
  yield { type: 'swap', indices: [right, high] };
  const temp2 = arr[right];
  arr[right] = arr[high];
  arr[high] = temp2;
  
  yield* quickSortHelper(arr, left, low - 1);
  yield* quickSortHelper(arr, low + 1, high - 1);
  yield* quickSortHelper(arr, high + 1, right);
}

/**
 * HEAP SORT - Efficient
 * Uses a binary heap data structure to sort elements
 */
export function* heapSort(arr: ArrayData[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  
  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* heapify(arr, n, i);
  }
  
  // Extract elements from heap
  for (let i = n - 1; i > 0; i--) {
    yield { type: 'swap', indices: [0, i] };
    const temp = arr[0];
    arr[0] = arr[i];
    arr[i] = temp;
    yield* heapify(arr, i, 0);
  }
  
  yield { type: 'markSorted' };
}

function* heapify(
  arr: ArrayData[], 
  n: number, 
  i: number
): Generator<AlgorithmOperation, void, unknown> {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;
  
  if (left < n) {
    yield { type: 'compare', indices: [largest, left] };
    if (arr[left].value > arr[largest].value) {
      largest = left;
      yield { type: 'swap', indices: [largest, left] };
    }
  }
  
  if (right < n) {
    yield { type: 'compare', indices: [largest, right] };
    if (arr[right].value > arr[largest].value) {
      largest = right;
      yield { type: 'swap', indices: [largest, right] };
    }
  }
  
  if (largest !== i) {
    yield { type: 'swap', indices: [i, largest] };
    const temp = arr[i];
    arr[i] = arr[largest];
    arr[largest] = temp;
    yield* heapify(arr, n, largest);
  }
}

/**
 * RADIX SORT - Distribution
 * Non-comparative integer sorting algorithm that sorts numbers by processing individual digits
 */
export function* radixSort(arr: ArrayData[]): Generator<AlgorithmOperation, void, unknown> {
  if (arr.length === 0) return;
  
  const max = Math.max(...arr.map(a => a.value));
  let exp = 1;
  
  while (Math.floor(max / exp) > 0) {
    yield* countingSortByDigit(arr, exp);
    exp *= 10;
  }
  
  // Mark all as compared/sorted
  for (let i = 0; i < arr.length - 1; i++) {
    yield { type: 'compare', indices: [i, i + 1] };
  }
  
  yield { type: 'markSorted' };
}

function* countingSortByDigit(
  arr: ArrayData[], 
  exp: number
): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  const output: ArrayData[] = new Array(n);
  const count: number[] = new Array(10).fill(0);
  
  // Count occurrences of each digit
  for (let i = 0; i < n; i++) {
    const digit = Math.floor(arr[i].value / exp) % 10;
    count[digit]++;
    // Yield a compare operation for tracking
    if (i > 0) {
      yield { type: 'compare', indices: [i - 1, i] };
    }
  }
  
  // Change count to cumulative count
  for (let i = 1; i < 10; i++) {
    count[i] += count[i - 1];
  }
  
  // Build output array
  for (let i = n - 1; i >= 0; i--) {
    const digit = Math.floor(arr[i].value / exp) % 10;
    output[count[digit] - 1] = arr[i];
    count[digit]--;
    // Yield swap operation for visualization
    if (i !== count[digit]) {
      yield { type: 'swap', indices: [i, count[digit]] };
    }
  }
  
  // Copy output to arr with swap operations
  for (let i = 0; i < n; i++) {
    if (arr[i].value !== output[i].value) {
      arr[i] = output[i];
      yield { type: 'swap', indices: [i, i] };
    }
  }
}

/**
 * COUNTING SORT - Distribution
 * Works by counting the number of objects that have distinct key values
 */
export function* countingSort(arr: ArrayData[]): Generator<AlgorithmOperation, void, unknown> {
  if (arr.length === 0) return;
  
  const max = Math.max(...arr.map(a => a.value));
  const min = Math.min(...arr.map(a => a.value));
  const range = max - min + 1;
  
  const count: number[] = new Array(range).fill(0);
  const output: ArrayData[] = new Array(arr.length);
  
  // Count occurrences with comparison tracking
  for (let i = 0; i < arr.length; i++) {
    count[arr[i].value - min]++;
    if (i > 0) {
      yield { type: 'compare', indices: [i - 1, i] };
    }
  }
  
  // Cumulative count
  for (let i = 1; i < range; i++) {
    count[i] += count[i - 1];
  }
  
  // Build output with swap tracking
  for (let i = arr.length - 1; i >= 0; i--) {
    const targetIdx = count[arr[i].value - min] - 1;
    output[targetIdx] = arr[i];
    count[arr[i].value - min]--;
    if (i !== targetIdx) {
      yield { type: 'swap', indices: [i, targetIdx] };
    }
  }
  
  // Copy to original with swap tracking
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].value !== output[i].value) {
      arr[i] = output[i];
      yield { type: 'swap', indices: [i, i] };
    }
  }
  
  // Verify sorted order with comparisons
  for (let i = 0; i < arr.length - 1; i++) {
    yield { type: 'compare', indices: [i, i + 1] };
  }
  
  yield { type: 'markSorted' };
}

/**
 * BUCKET SORT - Distribution
 * Distributes elements into buckets and sorts each bucket individually
 */
export function* bucketSort(arr: ArrayData[]): Generator<AlgorithmOperation, void, unknown> {
  if (arr.length === 0) return;
  
  const n = arr.length;
  const buckets: ArrayData[][] = Array.from({ length: n }, () => []);
  
  // Find max and min values
  const max = Math.max(...arr.map(a => a.value));
  const min = Math.min(...arr.map(a => a.value));
  const range = max - min + 1;
  
  // Distribute elements into buckets with comparison tracking
  for (let i = 0; i < n; i++) {
    const bucketIdx = Math.floor(((arr[i].value - min) / range) * (n - 1));
    buckets[bucketIdx].push(arr[i]);
    if (i > 0) {
      yield { type: 'compare', indices: [i - 1, i] };
    }
  }
  
  // Sort individual buckets using insertion sort
  for (let i = 0; i < n; i++) {
    yield* insertionSortInPlace(buckets[i]);
  }
  
  // Concatenate buckets with swap tracking
  let idx = 0;
  for (let i = 0; i < n; i++) {
    for (const bucketItem of buckets[i]) {
      if (arr[idx].value !== bucketItem.value) {
        yield { type: 'swap', indices: [idx, idx] };
      }
      arr[idx++] = bucketItem;
    }
  }
  
  // Verify sorted order with comparisons
  for (let i = 0; i < arr.length - 1; i++) {
    yield { type: 'compare', indices: [i, i + 1] };
  }
  
  yield { type: 'markSorted' };
}

function* insertionSortInPlace(
  arr: ArrayData[]
): Generator<AlgorithmOperation, void, unknown> {
  for (let i = 1; i < arr.length; i++) {
    let j = i;
    while (j > 0) {
      yield { type: 'compare', indices: [j - 1, j] };
      if (arr[j - 1].value > arr[j].value) {
        yield { type: 'swap', indices: [j - 1, j] };
        const temp = arr[j];
        arr[j] = arr[j - 1];
        arr[j - 1] = temp;
        j--;
      } else {
        break;
      }
    }
  }
}

/**
 * SHELL SORT - Exotic
 * Generalization of insertion sort that allows exchange of far apart elements
 */
export function* shellSort(arr: ArrayData[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  let gap = Math.floor(n / 2);
  
  while (gap > 0) {
    for (let i = gap; i < n; i++) {
      let j = i;
      while (j >= gap) {
        yield { type: 'compare', indices: [j - gap, j] };
        if (arr[j - gap].value > arr[j].value) {
          yield { type: 'swap', indices: [j - gap, j] };
          const temp = arr[j];
          arr[j] = arr[j - gap];
          arr[j - gap] = temp;
          j -= gap;
        } else {
          break;
        }
      }
    }
    gap = Math.floor(gap / 2);
  }
  
  yield { type: 'markSorted' };
}

/**
 * COMB SORT - Exotic
 * Improvement over bubble sort that eliminates turtles (small values near the end)
 */
export function* combSort(arr: ArrayData[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  let gap = n;
  let swapped = true;
  
  while (gap > 1 || swapped) {
    gap = Math.max(1, Math.floor(gap / 1.3));
    swapped = false;
    
    for (let i = 0; i < n - gap; i++) {
      yield { type: 'compare', indices: [i, i + gap] };
      if (arr[i].value > arr[i + gap].value) {
        yield { type: 'swap', indices: [i, i + gap] };
        const temp = arr[i];
        arr[i] = arr[i + gap];
        arr[i + gap] = temp;
        swapped = true;
      }
    }
  }
  
  yield { type: 'markSorted' };
}

/**
 * COCKTAIL SHAKER SORT - Exotic
 * Variation of bubble sort that sorts in both directions on each pass
 */
export function* cocktailShakerSort(arr: ArrayData[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  let start = 0;
  let end = n - 1;
  let swapped = true;
  
  while (swapped) {
    swapped = false;
    
    // Forward pass
    for (let i = start; i < end; i++) {
      yield { type: 'compare', indices: [i, i + 1] };
      if (arr[i].value > arr[i + 1].value) {
        yield { type: 'swap', indices: [i, i + 1] };
        const temp = arr[i];
        arr[i] = arr[i + 1];
        arr[i + 1] = temp;
        swapped = true;
      }
    }
    
    if (!swapped) break;
    
    swapped = false;
    end--;
    
    // Backward pass
    for (let i = end; i > start; i--) {
      yield { type: 'compare', indices: [i - 1, i] };
      if (arr[i - 1].value > arr[i].value) {
        yield { type: 'swap', indices: [i - 1, i] };
        const temp = arr[i - 1];
        arr[i - 1] = arr[i];
        arr[i] = temp;
        swapped = true;
      }
    }
    
    start++;
  }
  
  yield { type: 'markSorted' };
}

// Algorithm registry
export const algorithmRegistry: Record<string, SortGenerator> = {
  bubble: bubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  merge: mergeSort,
  quick: quickSort,
  heap: heapSort,
  radix: radixSort,
  bucket: bucketSort,
  counting: countingSort,
  shell: shellSort,
  comb: combSort,
  cocktail: cocktailShakerSort,
};