import { algorithmRegistry, AlgorithmOperation } from '../src/entities/algorithm/algorithms';

type Case = { name: string; arr: number[] };

function makeCases(): Case[] {
  const rand = (n: number, max = 999) => Array.from({ length: n }, () => Math.floor(Math.random() * max) + 1);
  return [
    { name: 'empty', arr: [] },
    { name: 'single', arr: [42] },
    { name: 'two-sorted', arr: [1, 2] },
    { name: 'two-rev', arr: [2, 1] },
    { name: 'sorted', arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    { name: 'reversed', arr: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] },
    { name: 'duplicates', arr: [5, 3, 5, 1, 3, 1, 5, 3, 1, 9] },
    { name: 'few-unique', arr: rand(60, 4) },
    { name: 'random-40', arr: rand(40) },
    { name: 'random-120', arr: rand(120) },
  ];
}

/** Mirror ops onto a fresh array — exactly what the visualizer does. */
function applyOps(initial: number[], ops: AlgorithmOperation[]): number[] {
  const a = [...initial];
  for (const op of ops) {
    if (op.type === 'swap') {
      const [i, j] = op.indices;
      [a[i], a[j]] = [a[j], a[i]];
    } else if (op.type === 'overwrite') {
      a[op.index] = op.value;
    }
  }
  return a;
}

function isSorted(a: number[]): boolean {
  for (let i = 1; i < a.length; i++) if (a[i - 1] > a[i]) return false;
  return true;
}

function sameMultiset(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}

let failures = 0;
let total = 0;
const opCounts: Record<string, number> = {};

for (const [name, gen] of Object.entries(algorithmRegistry)) {
  for (const c of makeCases()) {
    total++;
    const working = [...c.arr]; // generator mutates this in lockstep
    const expected = [...c.arr].sort((a, b) => a - b);
    const ops: AlgorithmOperation[] = [];
    for (const op of gen(working)) ops.push(op);

    const generatorResult = working;          // generator's own in-place array
    const mirrored = applyOps(c.arr, ops);    // what the visualizer would render

    const problems: string[] = [];
    if (!isSorted(generatorResult)) problems.push('generator-array-not-sorted');
    if (!sameMultiset(generatorResult, c.arr)) problems.push('generator-multiset-changed');
    if (generatorResult.join(',') !== expected.join(',')) problems.push('generator-wrong-order');
    if (mirrored.join(',') !== generatorResult.join(',')) problems.push('VISUAL-DESYNC (mirrored ops != generator array)');

    if (problems.length) {
      failures++;
      console.log(`FAIL  ${name.padEnd(10)} / ${c.name.padEnd(12)} -> ${problems.join(', ')}`);
      console.log(`        in:  ${c.arr.slice(0, 12).join(',')}`);
      console.log(`        gen: ${generatorResult.slice(0, 12).join(',')}`);
      console.log(`        mir: ${mirrored.slice(0, 12).join(',')}`);
    }
    opCounts[name] = (opCounts[name] ?? 0) + ops.length;
  }
}

console.log('\n— op volume (sum across all cases) —');
for (const [k, v] of Object.entries(opCounts)) console.log(`  ${k.padEnd(10)} ${v}`);

console.log(`\n${total - failures}/${total} checks passed.`);
if (failures) {
  console.error(`\n❌ ${failures} FAILURES`);
  process.exit(1);
} else {
  console.log('\n✅ All sorts correct AND visually in-sync.');
}
