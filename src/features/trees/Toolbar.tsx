"use client";

import { useState } from "react";
import {
  ArrowDownUp,
  CornerUpRight,
  Dice5,
  ListTree,
  Plus,
  Search,
  Square,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { TRAVERSALS, TREE_KINDS } from "@/entities/tree";

import type { TreeView } from "./use-tree";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[0.6rem] font-medium tracking-[0.18em] text-white/40 uppercase">
      {children}
    </span>
  );
}

function ToolButton({
  children,
  icon,
  onClick,
  disabled,
  tone = "neutral",
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2.5",
        "text-[0.65rem] font-medium tracking-wide text-white/70 transition-all",
        "hover:border-white/20 hover:bg-white/[0.07] hover:text-white",
        "focus-visible:ring-2 focus-visible:ring-[#22D3EE]/50 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-40",
        tone === "danger" && "hover:border-[#FF4D6D]/40 hover:text-[#FF8098]",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function Toolbar({ tree }: { tree: TreeView }) {
  const [input, setInput] = useState("");
  const busy = tree.busy;

  const parsed = () => {
    const v = parseInt(input, 10);
    return Number.isNaN(v) ? null : v;
  };

  const submitInsert = () => {
    const v = parsed();
    if (v === null) return;
    tree.insert(v);
    setInput("");
  };

  const submitAction = (fn: (v: number) => void) => {
    const v = parsed();
    if (v === null) return;
    fn(v);
  };

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
      {/* Structure selector */}
      <div className="flex flex-col gap-2">
        <Label>Structure</Label>
        <div
          role="radiogroup"
          aria-label="Tree structure"
          className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-black/30 p-1"
        >
          {TREE_KINDS.map((meta) => {
            const active = meta.id === tree.kind;
            return (
              <button
                key={meta.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={busy}
                onClick={() => tree.setKind(meta.id)}
                className={cn(
                  "group relative flex flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-all outline-none",
                  "focus-visible:ring-2 focus-visible:ring-[#22D3EE]/50",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  active
                    ? "bg-gradient-to-b from-[#22D3EE]/20 to-[#22D3EE]/5 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.4)]"
                    : "hover:bg-white/[0.06]",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-sm font-semibold transition-colors",
                    active ? "text-[#5BE8FF]" : "text-white/80",
                  )}
                >
                  {meta.short}
                </span>
                <span className="text-[0.58rem] tracking-wide text-white/40">{meta.ops}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Value input + primary actions */}
      <div className="flex flex-col gap-2">
        <Label>Value</Label>
        <div className="flex gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            value={input}
            disabled={busy}
            placeholder="0–99"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitInsert();
            }}
            className={cn(
              "h-10 w-full rounded-xl border border-white/12 bg-black/40 px-3 font-mono text-sm text-white",
              "placeholder:text-white/25 focus:border-[#22D3EE]/50 focus:outline-none",
              "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50",
            )}
          />
          <Button
            type="button"
            onClick={submitInsert}
            disabled={busy}
            className={cn(
              "h-10 shrink-0 gap-1.5 rounded-xl border-0 px-4 font-semibold text-black",
              "bg-gradient-to-r from-[#FFB627] to-[#FFCB5E] hover:from-[#FFC44D] hover:to-[#FFD884]",
              "shadow-[0_0_20px_-6px_rgba(255,182,39,0.7)] disabled:opacity-60",
            )}
          >
            <Plus className="size-4" />
            Insert
          </Button>
        </div>

        {/* Value-driven secondary actions depend on the structure */}
        {tree.isHeap ? (
          <div className="grid grid-cols-2 gap-1.5">
            <ToolButton
              onClick={tree.extract}
              disabled={busy || tree.size === 0}
              icon={<CornerUpRight className="size-3.5" />}
            >
              Extract Root
            </ToolButton>
            <ToolButton
              onClick={tree.heapSort}
              disabled={busy || tree.size === 0}
              icon={<ArrowDownUp className="size-3.5" />}
            >
              Heap Sort
            </ToolButton>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <ToolButton
              onClick={() => submitAction(tree.search)}
              disabled={busy}
              icon={<Search className="size-3.5" />}
            >
              Search
            </ToolButton>
            <ToolButton
              onClick={() => submitAction(tree.remove)}
              disabled={busy}
              tone="danger"
              icon={<Trash2 className="size-3.5" />}
            >
              Delete
            </ToolButton>
          </div>
        )}
      </div>

      {/* Traversals (ordered trees only) */}
      {!tree.isHeap && (
        <div className="flex flex-col gap-2">
          <Label>Traversal</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {TRAVERSALS.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={busy || tree.size === 0}
                onClick={() => tree.runTraversal(t.id)}
                title={t.note}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2",
                  "text-[0.7rem] font-medium text-white/75 transition-all",
                  "hover:border-[#22D3EE]/35 hover:bg-[#22D3EE]/[0.07] hover:text-white",
                  "focus-visible:ring-2 focus-visible:ring-[#22D3EE]/50 focus-visible:outline-none",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  t.id === "inorder" && "col-span-2",
                )}
              >
                <ListTree className="size-3.5 text-[#22D3EE]" />
                {t.label}
                {t.id === "inorder" && (
                  <span className="text-[0.58rem] text-white/40">· sorted</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Speed */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Speed</Label>
          <span className="font-mono text-xs text-white/60">{tree.speed}</span>
        </div>
        <Slider
          min={1}
          max={100}
          value={[tree.speed]}
          onValueChange={(v) => {
            const next = Array.isArray(v) ? v[0] : v;
            if (typeof next === "number") tree.setSpeed(next);
          }}
          className="[&_[data-slot=slider-range]]:bg-[#22D3EE] [&_[data-slot=slider-thumb]]:border-[#22D3EE] [&_[data-slot=slider-track]]:bg-white/10"
        />
      </div>

      {/* Board actions */}
      <div className="grid grid-cols-3 gap-1.5">
        <ToolButton onClick={tree.randomFill} disabled={busy} icon={<Dice5 className="size-3.5" />}>
          Random
        </ToolButton>
        <ToolButton
          onClick={tree.stop}
          disabled={!busy}
          icon={<Square className="size-3.5" />}
        >
          Stop
        </ToolButton>
        <ToolButton
          onClick={tree.clear}
          disabled={busy || tree.size === 0}
          tone="danger"
          icon={<Trash2 className="size-3.5" />}
        >
          Clear
        </ToolButton>
      </div>
    </div>
  );
}
