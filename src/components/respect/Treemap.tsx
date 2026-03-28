'use client';

import { useState, useRef, useEffect } from 'react';

export interface TreemapEntry {
  rank: number;
  name: string;
  wallet: string;
  fid: number | null;
  totalRespect: number;
  mindshare: number; // percentage 0-100
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  entry: TreemapEntry;
}

// Squarify algorithm helpers
function worstRatio(row: number[], w: number): number {
  const s = row.reduce((a, b) => a + b, 0);
  const rmax = Math.max(...row);
  const rmin = Math.min(...row);
  return Math.max((w * w * rmax) / (s * s), (s * s) / (w * w * rmin));
}

function squarify(
  entries: TreemapEntry[],
  x: number,
  y: number,
  width: number,
  height: number,
  total: number,
): Rect[] {
  if (entries.length === 0) return [];

  const rects: Rect[] = [];
  let remaining = [...entries];
  let cx = x;
  let cy = y;
  let cw = width;
  let ch = height;

  while (remaining.length > 0) {
    const isHorizontal = cw >= ch;
    const stripLen = isHorizontal ? ch : cw;

    let row: number[] = [];
    let rowEntries: TreemapEntry[] = [];
    let bestWorst = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i];
      const area = (item.totalRespect / total) * (cw * ch);
      const next = [...row, area];
      const w = worstRatio(next, stripLen);
      if (w > bestWorst && row.length > 0) break;
      bestWorst = w;
      row = next;
      rowEntries = [...rowEntries, item];
    }

    // Lay out the row
    const rowSum = row.reduce((a, b) => a + b, 0);
    const stripWidth = rowSum / stripLen;

    let offset = 0;
    for (let i = 0; i < rowEntries.length; i++) {
      const entryArea = row[i];
      const entryLen = (entryArea / rowSum) * stripLen;

      if (isHorizontal) {
        rects.push({
          x: cx,
          y: cy + offset,
          w: stripWidth,
          h: entryLen,
          entry: rowEntries[i],
        });
      } else {
        rects.push({
          x: cx + offset,
          y: cy,
          w: entryLen,
          h: stripWidth,
          entry: rowEntries[i],
        });
      }
      offset += entryLen;
    }

    // Advance cursor
    if (isHorizontal) {
      cx += stripWidth;
      cw -= stripWidth;
    } else {
      cy += stripWidth;
      ch -= stripWidth;
    }

    remaining = remaining.slice(rowEntries.length);
  }

  return rects;
}

// Gold palette — rank 1 is brightest, fades down
function getColor(rank: number, selected: boolean, hovered: boolean): string {
  if (selected || hovered) return '#f5a623';
  if (rank === 1) return '#d4891c';
  if (rank <= 3) return '#1e3a5f';
  if (rank <= 7) return '#162d4a';
  return '#0d1b2a';
}

function getBorderColor(rank: number, selected: boolean): string {
  if (selected) return '#f5a623';
  if (rank === 1) return '#f5a623';
  if (rank <= 3) return '#f5a623aa';
  return '#1e3a5f';
}

interface TreemapProps {
  entries: TreemapEntry[];
  onSelect?: (entry: TreemapEntry | null) => void;
  selected?: string | null; // wallet
}

export function Treemap({ entries, onSelect, selected }: TreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 600, height: 380 });
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ width: Math.max(width, 100), height: Math.max(height, 100) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const total = entries.reduce((s, e) => s + e.totalRespect, 0);
  const rects =
    total > 0
      ? squarify(entries, 0, 0, dims.width, dims.height, total)
      : [];

  return (
    <div
      ref={containerRef}
      className="w-full relative"
      style={{ height: '380px' }}
    >
      <svg
        width={dims.width}
        height={dims.height}
        className="absolute inset-0"
        style={{ display: 'block' }}
      >
        {rects.map((r) => {
          const isSelected = selected === r.entry.wallet;
          const isHovered = hovered === r.entry.wallet;
          const fill = getColor(r.entry.rank, isSelected, isHovered);
          const stroke = getBorderColor(r.entry.rank, isSelected);
          const GAP = 2;
          const rx = r.x + GAP / 2;
          const ry = r.y + GAP / 2;
          const rw = Math.max(r.w - GAP, 1);
          const rh = Math.max(r.h - GAP, 1);
          const showLabel = rw > 60 && rh > 40;
          const showPct = rw > 80 && rh > 60;

          return (
            <g
              key={r.entry.wallet || r.entry.name}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (onSelect) onSelect(isSelected ? null : r.entry);
              }}
              onMouseEnter={() => setHovered(r.entry.wallet)}
              onMouseLeave={() => setHovered(null)}
            >
              <rect
                x={rx}
                y={ry}
                width={rw}
                height={rh}
                rx={4}
                fill={fill}
                stroke={stroke}
                strokeWidth={isSelected ? 2 : 1}
                style={{ transition: 'fill 0.15s, stroke 0.15s' }}
              />
              {showLabel && (
                <>
                  <text
                    x={rx + rw / 2}
                    y={ry + rh / 2 - (showPct ? 10 : 0)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected || isHovered ? '#0a1628' : '#ffffff'}
                    fontSize={Math.min(13, Math.max(9, rw / 8))}
                    fontWeight="600"
                    style={{ userSelect: 'none', pointerEvents: 'none' }}
                  >
                    {r.entry.name.length > 14
                      ? r.entry.name.slice(0, 12) + '…'
                      : r.entry.name}
                  </text>
                  {showPct && (
                    <text
                      x={rx + rw / 2}
                      y={ry + rh / 2 + 12}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isSelected || isHovered ? '#0a1628aa' : '#f5a623aa'}
                      fontSize={Math.min(11, Math.max(8, rw / 10))}
                      fontWeight="400"
                      style={{ userSelect: 'none', pointerEvents: 'none' }}
                    >
                      {r.entry.mindshare.toFixed(1)}%
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
