"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { TreeLayout } from "@/entities/tree";

const NODE_R = 17;
const H_GAP = 46;
const V_GAP = 76;
const PAD = 30;

type NodeStatus = "idle" | "active" | "miss" | "visited" | "found" | "new";

interface TreeCanvasProps {
  layout: TreeLayout;
  activeIds: ReadonlySet<number>;
  visitedIds: ReadonlySet<number>;
  foundId: number | null;
  missing: boolean;
  pulseId: number | null;
  /** Clicking a node deletes it (BST/AVL only). Pass null to disable. */
  onNodeClick: ((id: number) => void) | null;
  empty: boolean;
}

const STATUS_STYLES: Record<
  NodeStatus,
  { fill: string; stroke: string; text: string; glow?: string }
> = {
  idle: { fill: "#121723", stroke: "rgba(255,255,255,0.16)", text: "#E7ECF3" },
  visited: { fill: "rgba(34,211,238,0.16)", stroke: "rgba(34,211,238,0.55)", text: "#9EEBFB" },
  active: { fill: "#FFB627", stroke: "#FFCB5E", text: "#0B0E14", glow: "rgba(255,182,39,0.55)" },
  found: { fill: "#34D399", stroke: "#6EE7B7", text: "#06281C", glow: "rgba(52,211,153,0.6)" },
  miss: { fill: "#FF4D6D", stroke: "#FF8098", text: "#2B0710", glow: "rgba(255,77,109,0.5)" },
  new: { fill: "rgba(34,211,238,0.9)", stroke: "#5BE8FF", text: "#04222A", glow: "rgba(34,211,238,0.6)" },
};

export function TreeCanvas({
  layout,
  activeIds,
  visitedIds,
  foundId,
  missing,
  pulseId,
  onNodeClick,
  empty,
}: TreeCanvasProps) {
  const reduce = useReducedMotion();
  const { nodes, edges, columns, levels } = layout;

  const px = (x: number) => PAD + NODE_R + x * H_GAP;
  const py = (y: number) => PAD + NODE_R + y * V_GAP;

  const width = Math.max(PAD * 2 + NODE_R * 2 + (columns - 1) * H_GAP, 320);
  const height = Math.max(PAD * 2 + NODE_R * 2 + (levels - 1) * V_GAP, 220);

  const statusOf = (id: number): NodeStatus => {
    if (foundId === id) return "found";
    if (activeIds.has(id)) return missing ? "miss" : "active";
    if (visitedIds.has(id)) return "visited";
    if (pulseId === id) return "new";
    return "idle";
  };

  const transition = useMemo(
    () =>
      reduce
        ? { duration: 0 }
        : ({ type: "spring", stiffness: 260, damping: 26 } as const),
    [reduce],
  );

  if (empty) {
    return (
      <div className="flex h-[340px] flex-col items-center justify-center gap-2 text-center">
        <div className="font-mono text-sm text-white/40">The structure is empty</div>
        <p className="max-w-xs text-xs text-white/30">
          Insert a value or hit <span className="text-white/60">Random</span> to grow a tree.
        </p>
      </div>
    );
  }

  return (
    <div className="custom-scrollbar w-full overflow-auto">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="mx-auto block"
        role="img"
        aria-label="Tree visualization"
      >
        {/* Edges first so nodes paint on top. */}
        <g>
          <AnimatePresence>
            {edges.map((e) => {
              const childActive = activeIds.has(Number(e.id.split("-")[1]));
              return (
                <motion.line
                  key={e.id}
                  initial={{ opacity: 0 }}
                  animate={{
                    x1: px(e.x1),
                    y1: py(e.y1),
                    x2: px(e.x2),
                    y2: py(e.y2),
                    opacity: 1,
                  }}
                  exit={{ opacity: 0 }}
                  transition={transition}
                  stroke={childActive ? "rgba(255,182,39,0.6)" : "rgba(255,255,255,0.14)"}
                  strokeWidth={childActive ? 2.5 : 1.5}
                  strokeLinecap="round"
                />
              );
            })}
          </AnimatePresence>
        </g>

        {/* Nodes */}
        <AnimatePresence>
          {nodes.map((n) => {
            const status = statusOf(n.id);
            const s = STATUS_STYLES[status];
            const x = px(n.x);
            const y = py(n.y);
            const interactive = !!onNodeClick;
            return (
              <motion.g
                key={n.id}
                initial={{ scale: 0, opacity: 0, x, y }}
                animate={{
                  scale: status === "active" || status === "new" ? 1.12 : 1,
                  opacity: 1,
                  x,
                  y,
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={transition}
                onClick={interactive ? () => onNodeClick(n.id) : undefined}
                className={cn(interactive && "cursor-pointer")}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              >
                {s.glow && (
                  <circle r={NODE_R + 5} fill="none" stroke={s.glow} strokeWidth={2} opacity={0.5} />
                )}
                <circle
                  r={NODE_R}
                  fill={s.fill}
                  stroke={s.stroke}
                  strokeWidth={2}
                  style={s.glow ? { filter: `drop-shadow(0 0 8px ${s.glow})` } : undefined}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={n.value > 99 ? 11 : 13}
                  fontWeight={600}
                  fill={s.text}
                  fontFamily="var(--font-mono), monospace"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {n.value}
                </text>
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>
    </div>
  );
}
