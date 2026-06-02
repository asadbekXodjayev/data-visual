/**
 * Algorithm engine.
 *
 * Every sort is a generator that operates on a plain `number[]` and yields one
 * AlgorithmOperation per observable step. The crucial invariant: the generator
 * mutates its working array IN LOCKSTEP with the ops it yields. Every mutation
 * is described by either a `swap` or an `overwrite` op, so a consumer that mirrors
 * those ops onto its own array stays perfectly in sync. This is what makes
 * merge / radix / counting / bucket sorts visualize faithfully (the previous
 * version wrote to the array directly without emitting ops, so bars never moved).
 */

export type CompareOperation = { type: 'compare'; indices: number[] };
export type SwapOperation = { type: 'swap'; indices: [number, number] };
export type OverwriteOperation = { type: 'overwrite'; index: number; value: number };
export type PivotOperation = { type: 'pivot'; indices: number[] };
export type MarkSortedOperation = { type: 'markSorted'; indices?: number[] };

export type AlgorithmOperation =
  | CompareOperation
  | SwapOperation
  | OverwriteOperation
  | PivotOperation
  | MarkSortedOperation;

export type SortGenerator = (arr: number[]) => Generator<AlgorithmOperation, void, unknown>;

/* -------------------------------------------------------------------------- */
/*  Simple sorts                                                               */
/* -------------------------------------------------------------------------- */

/** Bubble sort — repeatedly swap adjacent out-of-order pairs. */
export function* bubbleSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      yield { type: 'compare', indices: [j, j + 1] };
      if (arr[j] > arr[j + 1]) {
        yield { type: 'swap', indices: [j, j + 1] };
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    yield { type: 'markSorted', indices: [n - i - 1] };
    if (!swapped) {
      yield { type: 'markSorted', indices: range(0, n - i - 1) };
      break;
    }
  }
  yield { type: 'markSorted' };
}

/** Selection sort — select the minimum of the unsorted tail each pass. */
export function* selectionSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      yield { type: 'compare', indices: [minIdx, j] };
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      yield { type: 'swap', indices: [i, minIdx] };
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
    yield { type: 'markSorted', indices: [i] };
  }
  yield { type: 'markSorted' };
}

/** Insertion sort — shift each element back into the sorted prefix. */
export function* insertionSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0) {
      yield { type: 'compare', indices: [j, j + 1] };
      if (arr[j] <= key) break;
      yield { type: 'overwrite', index: j + 1, value: arr[j] };
      arr[j + 1] = arr[j];
      j--;
    }
    if (j + 1 !== i) yield { type: 'overwrite', index: j + 1, value: key };
    arr[j + 1] = key;
  }
  yield { type: 'markSorted' };
}

/** Gnome sort — like insertion sort but steps back one position at a time. */
export function* gnomeSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  let i = 0;
  while (i < n) {
    if (i === 0) {
      i++;
      continue;
    }
    yield { type: 'compare', indices: [i - 1, i] };
    if (arr[i - 1] <= arr[i]) {
      i++;
    } else {
      yield { type: 'swap', indices: [i - 1, i] };
      [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
      i--;
    }
  }
  yield { type: 'markSorted' };
}

/* -------------------------------------------------------------------------- */
/*  Efficient sorts                                                            */
/* -------------------------------------------------------------------------- */

/** Merge sort — divide, recursively sort, merge with `overwrite` ops. */
export function* mergeSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  yield* mergeSortHelper(arr, 0, arr.length - 1);
  yield { type: 'markSorted' };
}

function* mergeSortHelper(arr: number[], left: number, right: number): Generator<AlgorithmOperation, void, unknown> {
  if (left >= right) return;
  const mid = Math.floor((left + right) / 2);
  yield* mergeSortHelper(arr, left, mid);
  yield* mergeSortHelper(arr, mid + 1, right);
  yield* merge(arr, left, mid, right);
}

function* merge(arr: number[], left: number, mid: number, right: number): Generator<AlgorithmOperation, void, unknown> {
  const leftArr = arr.slice(left, mid + 1);
  const rightArr = arr.slice(mid + 1, right + 1);
  let i = 0;
  let j = 0;
  let k = left;

  while (i < leftArr.length && j < rightArr.length) {
    yield { type: 'compare', indices: [left + i, mid + 1 + j] };
    if (leftArr[i] <= rightArr[j]) {
      yield { type: 'overwrite', index: k, value: leftArr[i] };
      arr[k] = leftArr[i];
      i++;
    } else {
      yield { type: 'overwrite', index: k, value: rightArr[j] };
      arr[k] = rightArr[j];
      j++;
    }
    k++;
  }
  while (i < leftArr.length) {
    yield { type: 'overwrite', index: k, value: leftArr[i] };
    arr[k] = leftArr[i];
    i++;
    k++;
  }
  while (j < rightArr.length) {
    yield { type: 'overwrite', index: k, value: rightArr[j] };
    arr[k] = rightArr[j];
    j++;
    k++;
  }
}

/** Quick sort — Lomuto partition with last element as pivot. Correct & clear. */
export function* quickSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  yield* quickSortHelper(arr, 0, arr.length - 1);
  yield { type: 'markSorted' };
}

function* quickSortHelper(arr: number[], low: number, high: number): Generator<AlgorithmOperation, void, unknown> {
  if (low >= high) {
    if (low === high) yield { type: 'markSorted', indices: [low] };
    return;
  }
  const pivotValue = arr[high];
  yield { type: 'pivot', indices: [high] };
  let i = low;
  for (let j = low; j < high; j++) {
    yield { type: 'compare', indices: [j, high] };
    if (arr[j] < pivotValue) {
      if (i !== j) {
        yield { type: 'swap', indices: [i, j] };
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      i++;
    }
  }
  if (i !== high) {
    yield { type: 'swap', indices: [i, high] };
    [arr[i], arr[high]] = [arr[high], arr[i]];
  }
  yield { type: 'markSorted', indices: [i] };
  yield* quickSortHelper(arr, low, i - 1);
  yield* quickSortHelper(arr, i + 1, high);
}

/** Heap sort — build a max-heap, then repeatedly extract the root. */
export function* heapSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* heapify(arr, n, i);
  }
  for (let i = n - 1; i > 0; i--) {
    yield { type: 'swap', indices: [0, i] };
    [arr[0], arr[i]] = [arr[i], arr[0]];
    yield { type: 'markSorted', indices: [i] };
    yield* heapify(arr, i, 0);
  }
  yield { type: 'markSorted' };
}

function* heapify(arr: number[], n: number, i: number): Generator<AlgorithmOperation, void, unknown> {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;
  if (left < n) {
    yield { type: 'compare', indices: [largest, left] };
    if (arr[left] > arr[largest]) largest = left;
  }
  if (right < n) {
    yield { type: 'compare', indices: [largest, right] };
    if (arr[right] > arr[largest]) largest = right;
  }
  if (largest !== i) {
    yield { type: 'swap', indices: [i, largest] };
    [arr[i], arr[largest]] = [arr[largest], arr[i]];
    yield* heapify(arr, n, largest);
  }
}

/** Shell sort — gapped insertion sort using Knuth's gap sequence. */
export function* shellSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  let gap = 1;
  while (gap < Math.floor(n / 3)) gap = gap * 3 + 1;
  while (gap > 0) {
    for (let i = gap; i < n; i++) {
      const temp = arr[i];
      let j = i;
      while (j >= gap) {
        yield { type: 'compare', indices: [j - gap, j] };
        if (arr[j - gap] <= temp) break;
        yield { type: 'overwrite', index: j, value: arr[j - gap] };
        arr[j] = arr[j - gap];
        j -= gap;
      }
      if (j !== i) yield { type: 'overwrite', index: j, value: temp };
      arr[j] = temp;
    }
    gap = Math.floor(gap / 3);
  }
  yield { type: 'markSorted' };
}

/* -------------------------------------------------------------------------- */
/*  Distribution sorts (non-comparison)                                        */
/* -------------------------------------------------------------------------- */

/** Radix sort (LSD) — stable counting sort on each base-10 digit. */
export function* radixSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  if (n === 0) return;
  const max = Math.max(...arr);
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const output = new Array<number>(n);
    const count = new Array<number>(10).fill(0);
    for (let i = 0; i < n; i++) {
      yield { type: 'compare', indices: [i] };
      count[Math.floor(arr[i] / exp) % 10]++;
    }
    for (let d = 1; d < 10; d++) count[d] += count[d - 1];
    for (let i = n - 1; i >= 0; i--) {
      const digit = Math.floor(arr[i] / exp) % 10;
      output[--count[digit]] = arr[i];
    }
    for (let i = 0; i < n; i++) {
      yield { type: 'overwrite', index: i, value: output[i] };
      arr[i] = output[i];
    }
  }
  yield { type: 'markSorted' };
}

/** Counting sort — tally each value, then write back in order. */
export function* countingSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  if (n === 0) return;
  const max = Math.max(...arr);
  const min = Math.min(...arr);
  const count = new Array<number>(max - min + 1).fill(0);
  for (let i = 0; i < n; i++) {
    yield { type: 'compare', indices: [i] };
    count[arr[i] - min]++;
  }
  let idx = 0;
  for (let v = 0; v < count.length; v++) {
    while (count[v] > 0) {
      yield { type: 'overwrite', index: idx, value: v + min };
      arr[idx] = v + min;
      idx++;
      count[v]--;
    }
  }
  yield { type: 'markSorted' };
}

/** Bucket sort — scatter into value-range buckets, insertion-sort each, gather. */
export function* bucketSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  if (n === 0) return;
  const max = Math.max(...arr);
  const min = Math.min(...arr);
  const range = max - min + 1;
  const bucketCount = Math.max(1, Math.floor(Math.sqrt(n)));
  const buckets: number[][] = Array.from({ length: bucketCount }, () => []);

  for (let i = 0; i < n; i++) {
    yield { type: 'compare', indices: [i] };
    const b = Math.min(bucketCount - 1, Math.floor(((arr[i] - min) / range) * bucketCount));
    buckets[b].push(arr[i]);
  }

  let idx = 0;
  for (const bucket of buckets) {
    bucket.sort((a, b) => a - b); // local insertion-equivalent; emitted as overwrites below
    for (const value of bucket) {
      yield { type: 'overwrite', index: idx, value };
      arr[idx] = value;
      idx++;
    }
  }
  yield { type: 'markSorted' };
}

/* -------------------------------------------------------------------------- */
/*  Exotic sorts                                                               */
/* -------------------------------------------------------------------------- */

/** Comb sort — bubble sort with a shrinking gap to kill "turtles". */
export function* combSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  let gap = n;
  let swapped = true;
  while (gap > 1 || swapped) {
    gap = Math.max(1, Math.floor(gap / 1.3));
    swapped = false;
    for (let i = 0; i + gap < n; i++) {
      yield { type: 'compare', indices: [i, i + gap] };
      if (arr[i] > arr[i + gap]) {
        yield { type: 'swap', indices: [i, i + gap] };
        [arr[i], arr[i + gap]] = [arr[i + gap], arr[i]];
        swapped = true;
      }
    }
  }
  yield { type: 'markSorted' };
}

/** Cocktail shaker sort — bidirectional bubble sort. */
export function* cocktailShakerSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  let start = 0;
  let end = arr.length - 1;
  let swapped = true;
  while (swapped) {
    swapped = false;
    for (let i = start; i < end; i++) {
      yield { type: 'compare', indices: [i, i + 1] };
      if (arr[i] > arr[i + 1]) {
        yield { type: 'swap', indices: [i, i + 1] };
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        swapped = true;
      }
    }
    yield { type: 'markSorted', indices: [end] };
    end--;
    if (!swapped) break;
    swapped = false;
    for (let i = end; i > start; i--) {
      yield { type: 'compare', indices: [i - 1, i] };
      if (arr[i - 1] > arr[i]) {
        yield { type: 'swap', indices: [i - 1, i] };
        [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
        swapped = true;
      }
    }
    yield { type: 'markSorted', indices: [start] };
    start++;
  }
  yield { type: 'markSorted' };
}

/** Odd-even (brick) sort — compare-exchange odd then even indexed pairs. */
export function* oddEvenSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  let sorted = false;
  while (!sorted) {
    sorted = true;
    for (let i = 1; i < n - 1; i += 2) {
      yield { type: 'compare', indices: [i, i + 1] };
      if (arr[i] > arr[i + 1]) {
        yield { type: 'swap', indices: [i, i + 1] };
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        sorted = false;
      }
    }
    for (let i = 0; i < n - 1; i += 2) {
      yield { type: 'compare', indices: [i, i + 1] };
      if (arr[i] > arr[i + 1]) {
        yield { type: 'swap', indices: [i, i + 1] };
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        sorted = false;
      }
    }
  }
  yield { type: 'markSorted' };
}

/** Pancake sort — sort by repeatedly flipping a prefix of the array. */
export function* pancakeSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  for (let size = n; size > 1; size--) {
    let maxIdx = 0;
    for (let i = 1; i < size; i++) {
      yield { type: 'compare', indices: [maxIdx, i] };
      if (arr[i] > arr[maxIdx]) maxIdx = i;
    }
    if (maxIdx !== size - 1) {
      yield* flip(arr, maxIdx);
      yield* flip(arr, size - 1);
    }
    yield { type: 'markSorted', indices: [size - 1] };
  }
  yield { type: 'markSorted' };
}

function* flip(arr: number[], k: number): Generator<AlgorithmOperation, void, unknown> {
  let i = 0;
  while (i < k) {
    yield { type: 'swap', indices: [i, k] };
    [arr[i], arr[k]] = [arr[k], arr[i]];
    i++;
    k--;
  }
}

/** Cycle sort — minimizes the number of writes; each element placed in one move. */
export function* cycleSort(arr: number[]): Generator<AlgorithmOperation, void, unknown> {
  const n = arr.length;
  for (let cycleStart = 0; cycleStart < n - 1; cycleStart++) {
    let item = arr[cycleStart];
    let pos = cycleStart;
    for (let i = cycleStart + 1; i < n; i++) {
      yield { type: 'compare', indices: [cycleStart, i] };
      if (arr[i] < item) pos++;
    }
    if (pos === cycleStart) continue;
    while (item === arr[pos]) pos++;
    yield { type: 'overwrite', index: pos, value: item };
    [arr[pos], item] = [item, arr[pos]];

    while (pos !== cycleStart) {
      pos = cycleStart;
      for (let i = cycleStart + 1; i < n; i++) {
        yield { type: 'compare', indices: [cycleStart, i] };
        if (arr[i] < item) pos++;
      }
      while (item === arr[pos]) pos++;
      yield { type: 'overwrite', index: pos, value: item };
      [arr[pos], item] = [item, arr[pos]];
    }
  }
  yield { type: 'markSorted' };
}

/* -------------------------------------------------------------------------- */

function range(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i < to; i++) out.push(i);
  return out;
}

export const algorithmRegistry: Record<string, SortGenerator> = {
  bubble: bubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  gnome: gnomeSort,
  merge: mergeSort,
  quick: quickSort,
  heap: heapSort,
  shell: shellSort,
  radix: radixSort,
  counting: countingSort,
  bucket: bucketSort,
  comb: combSort,
  cocktail: cocktailShakerSort,
  oddEven: oddEvenSort,
  pancake: pancakeSort,
  cycle: cycleSort,
};
