"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GitBranch, Layers, Ruler, ScrollText } from "lucide-react";

import { META_BY_KIND } from "@/entities/tree";

import { TreeCanvas } from "./TreeCanvas";
import { Toolbar } from "./Toolbar";
import { useTree } from "./use-tree";

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2.5">
      <div className="text-white/40">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[0.55rem] tracking-[0.16em] text-white/35 uppercase">{label}</span>
        <span className={`font-mono text-sm font-semibold ${tone ?? "text-white"}`}>{value}</span>
      </div>
    </div>
  );
}

export function TreeVisualizer() {
  const tree = useTree();
  const reduce = useReducedMotion();
  const meta = META_BY_KIND[tree.kind];

  return (
    <div className="w-full text-white">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* Canvas + output */}
        <section className="order-2 flex flex-col gap-4 lg:order-1">
          <div className="rounded-2xl border border-white/10 bg-[#0B0E14] p-3 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
            <TreeCanvas
              layout={tree.layout}
              activeIds={tree.activeIds}
              visitedIds={tree.visitedIds}
              foundId={tree.foundId}
              missing={tree.missing}
              pulseId={tree.pulseId}
              onNodeClick={tree.isHeap ? null : tree.deleteNode}
              empty={tree.size === 0}
            />
          </div>

          {/* Sequence output strip */}
          <div className="min-h-[68px] rounded-2xl border border-white/10 bg-white/[0.02] p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <ScrollText className="size-3.5 text-[#22D3EE]" />
              <span className="text-[0.6rem] font-medium tracking-[0.2em] text-white/45 uppercase">
                {tree.outputLabel ?? "Output sequence"}
              </span>
            </div>
            {tree.output.length === 0 ? (
              <p className="font-mono text-xs text-white/30">
                {tree.isHeap
                  ? "Run Heap Sort to repeatedly extract the root into sorted order."
                  : "Run a traversal — in-order yields a sorted list."}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                <AnimatePresence initial={false}>
                  {tree.output.map((v, i) => (
                    <motion.span
                      key={`${i}-${v}`}
                      initial={reduce ? false : { opacity: 0, scale: 0.6, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                      className="rounded-md bg-[#22D3EE]/12 px-2 py-0.5 font-mono text-xs text-[#9EEBFB] ring-1 ring-[#22D3EE]/25"
                    >
                      {v}
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Legend + hint */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex flex-wrap items-center gap-3 text-[0.62rem] text-white/45">
              <LegendDot color="#FFB627" label="On path" />
              <LegendDot color="#22D3EE" label="Visited" />
              <LegendDot color="#34D399" label="Found" />
              <LegendDot color="#FF4D6D" label="Removed" />
            </div>
            {!tree.isHeap && (
              <p className="text-[0.62rem] tracking-wide text-white/35">Click a node to delete it</p>
            )}
          </div>
        </section>

        {/* Controls */}
        <aside className="order-1 flex flex-col gap-4 lg:order-2">
          <header className="flex flex-col gap-1">
            <span className="text-[0.6rem] font-medium tracking-[0.22em] text-[#22D3EE]/80 uppercase">
              Tree Lab
            </span>
            <h2 className="font-heading text-lg font-semibold tracking-tight text-white">
              {meta.label}
            </h2>
            <p className="text-xs leading-relaxed text-white/45">{meta.blurb}</p>
          </header>

          <Toolbar tree={tree} />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-1.5">
            <Stat icon={<GitBranch className="size-4" />} label="Nodes" value={String(tree.size)} />
            <Stat icon={<Ruler className="size-4" />} label="Height" value={String(tree.height)} />
            <Stat
              icon={<Layers className="size-4" />}
              label="Levels"
              value={String(tree.layout.levels)}
            />
            <Stat
              icon={<GitBranch className="size-4 rotate-90" />}
              label={tree.isHeap ? "Heap" : "Balance"}
              value={tree.isHeap ? "valid" : tree.isBalanced ? "balanced" : "skewed"}
              tone={
                tree.isHeap || tree.isBalanced ? "text-[#34D399]" : "text-[#FFB627]"
              }
            />
          </div>

          {/* Live message */}
          <div className="min-h-[20px] px-1" aria-live="polite">
            <AnimatePresence mode="wait">
              {tree.message && (
                <motion.p
                  key={tree.message}
                  initial={reduce ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: 4 }}
                  className="font-mono text-xs text-white/55"
                >
                  {tree.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export default TreeVisualizer;
