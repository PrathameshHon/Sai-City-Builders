"use client";

import { useRef, useState, useCallback } from "react";
import { RotateCcw, MousePointer2, Layers } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { BookingUnit } from "@/lib/booking-shared";
import { cn } from "@/lib/utils";

export interface FloorGroup {
  floor: number;
  floorLabel: string;
  units: BookingUnit[];
}

interface Tower3DProps {
  floors: FloorGroup[];
  towerName: string;
  selectedUnitId: string | null;
  selectedFloor: number | null;
  onSelectUnit: (unit: BookingUnit) => void;
  onSelectFloor: (floor: number) => void;
}

const FLOOR_GAP = 34;

/** Status → cell styling */
function cellClass(unit: BookingUnit, isSelected: boolean) {
  return cn(
    "relative flex items-center justify-center rounded-[4px] border text-[9px] font-bold leading-none transition-all duration-150 select-none",
    unit.status === "AVAILABLE" && "bg-sage border-pine/40 text-pine hover:bg-leaf hover:text-white hover:scale-110 cursor-pointer",
    unit.status === "LOCKED" && unit.isMine && "bg-gold border-gold-deep text-forest cursor-pointer hover:scale-105",
    unit.status === "LOCKED" && !unit.isMine && "bg-gold/60 border-gold-deep/60 text-forest/70 cursor-not-allowed",
    unit.status === "SOLD" && "bg-stone-300/70 border-stone-400/60 text-stone-500 cursor-not-allowed line-through decoration-stone-500/70",
    isSelected && "ring-2 ring-brick ring-offset-1 z-10 scale-110"
  );
}

export function Tower3D({
  floors,
  towerName,
  selectedUnitId,
  selectedFloor,
  onSelectUnit,
  onSelectFloor,
}: Tower3DProps) {
  const [rotZ, setRotZ] = useState(-38);
  const [tiltX, setTiltX] = useState(58);
  const [mode, setMode] = useState<"3d" | "2d">("3d");
  const isMobile = useIsMobile();
  const dragRef = useRef<{ startX: number; startY: number; rotZ0: number; tiltX0: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, rotZ0: rotZ, tiltX0: tiltX, moved: false };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [rotZ, tiltX]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    if (d.moved) {
      setRotZ(d.rotZ0 + dx * 0.35);
      setTiltX(Math.min(75, Math.max(30, d.tiltX0 - dy * 0.25)));
    }
  }, []);

  const onPointerUp = useCallback(() => {
    const d = dragRef.current;
    suppressClick.current = !!d?.moved;
    dragRef.current = null;
  }, []);

  const handleUnitClick = useCallback((unit: BookingUnit) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    onSelectUnit(unit);
  }, [onSelectUnit]);

  const handleFloorClick = useCallback((floor: number) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    onSelectFloor(floor);
  }, [onSelectFloor]);

  const resetView = () => {
    setRotZ(-38);
    setTiltX(58);
  };

  const maxUnits = Math.max(8, ...floors.map((f) => f.units.length));
  const cols = Math.ceil(Math.sqrt(maxUnits));
  const planeSize = mode === "3d" ? (isMobile ? 225 : 300) : 340;
  const top = [...floors].sort((a, b) => b.floor - a.floor);

  return (
    <div className="rounded-3xl bg-white border border-border shadow-[0_18px_44px_-26px_rgba(15,61,42,0.4)] overflow-hidden flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-forest to-pine">
        <div className="flex items-center gap-2.5 min-w-0">
          <Layers className="h-5 w-5 text-gold shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <div className="text-white font-semibold text-sm truncate">{towerName}</div>
            <div className="text-[10px] text-sage/70 uppercase tracking-widest">
              {mode === "3d" ? "3D Tower View · drag to rotate" : "2D Stack View"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex rounded-full bg-white/10 p-0.5 border border-white/20">
            <button
              onClick={() => setMode("3d")}
              className={cn("rounded-full px-3 py-1 text-[11px] font-bold transition-colors", mode === "3d" ? "bg-gold text-forest" : "text-sage/70 hover:text-white")}
              aria-pressed={mode === "3d"}
            >
              3D
            </button>
            <button
              onClick={() => setMode("2d")}
              className={cn("rounded-full px-3 py-1 text-[11px] font-bold transition-colors", mode === "2d" ? "bg-gold text-forest" : "text-sage/70 hover:text-white")}
              aria-pressed={mode === "2d"}
            >
              2D
            </button>
          </div>
          {mode === "3d" && (
            <button
              onClick={resetView}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 border border-white/20 text-sage hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Reset view"
              title="Reset view"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Scene */}
      <div
        className={cn(
          "relative h-[420px] sm:h-[460px] bg-gradient-to-b from-sage/60 via-cream to-sand overflow-hidden touch-none",
          mode === "3d" ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        )}
        onPointerDown={mode === "3d" ? onPointerDown : undefined}
        onPointerMove={mode === "3d" ? onPointerMove : undefined}
        onPointerUp={mode === "3d" ? onPointerUp : undefined}
        onPointerLeave={mode === "3d" ? onPointerUp : undefined}
        role="application"
        aria-label={`Tower layout — ${towerName}`}
      >
        {/* compass / hint */}
        {mode === "3d" && (
          <div className="absolute top-3 left-4 z-10 flex items-center gap-1.5 text-[10px] font-semibold text-moss bg-white/70 backdrop-blur rounded-full px-2.5 py-1 border border-border">
            <MousePointer2 className="h-3 w-3" aria-hidden="true" />
            Drag to rotate · Click a unit
          </div>
        )}

        {mode === "3d" ? (
          <div className="absolute inset-0" style={{ perspective: "1100px" }}>
            <div
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `translate(-50%, -38%) rotateX(${tiltX}deg) rotateZ(${rotZ}deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              {top.map((f) => {
                const isSel = selectedFloor === f.floor;
                const avail = f.units.filter((u) => u.status === "AVAILABLE").length;
                return (
                  <div
                    key={f.floor}
                    className="absolute"
                    style={{
                      transform: `translateZ(${(f.floor - Math.min(...floors.map((x) => x.floor))) * FLOOR_GAP}px)`,
                      width: planeSize,
                      height: planeSize,
                      marginLeft: -planeSize / 2,
                      marginTop: -planeSize / 2,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {/* floor plate */}
                    <button
                      onClick={() => handleFloorClick(f.floor)}
                      aria-label={`Floor ${f.floorLabel} — ${avail} available`}
                      className={cn(
                        "absolute inset-0 rounded-lg border-2 transition-colors",
                        isSel
                          ? "border-gold bg-forest/15 shadow-[0_0_0_2px_rgba(192,160,84,0.35)]"
                          : "border-pine/30 bg-forest/5 hover:border-gold/60"
                      )}
                    />
                    {/* units grid on the plane */}
                    <div
                      className="absolute inset-2 grid gap-1.5"
                      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                    >
                      {f.units.map((u) => (
                        <button
                          key={u.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnitClick(u);
                          }}
                          className={cellClass(u, selectedUnitId === u.id)}
                          title={`${u.unitNumber} · ${u.unitType} · ${u.areaSqft} sq.ft · ${
                            u.status === "AVAILABLE" ? "Available" : u.status === "SOLD" ? "Sold" : u.isMine ? "Your hold" : "Held by another buyer"
                          }`}
                          aria-label={`Unit ${u.unitNumber}, ${u.unitType}, ${u.status}`}
                        >
                          <span className="truncate px-0.5">{u.unitNumber}</span>
                        </button>
                      ))}
                    </div>
                    {/* floor tag */}
                    <div
                      className={cn(
                        "absolute -left-9 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-[10px] font-bold leading-tight text-center border",
                        isSel ? "bg-gold text-forest border-gold-deep" : "bg-white/85 text-forest border-pine/30"
                      )}
                    >
                      {f.floorLabel}
                      <div className="text-[8px] font-medium opacity-75">{avail} free</div>
                    </div>
                  </div>
                );
              })}
              {/* ground plate */}
              <div
                className="absolute rounded-xl border-2 border-dashed border-pine/25 bg-sage/50"
                style={{
                  width: planeSize + 10,
                  height: planeSize + 10,
                  marginLeft: -(planeSize + 10) / 2,
                  marginTop: -(planeSize + 10) / 2,
                  transform: "translateZ(-8px)",
                }}
                aria-hidden="true"
              />
            </div>
          </div>
        ) : (
          /* 2D stack (elevation) view */
          <div className="absolute inset-0 overflow-auto scroll-area-thin p-4">
            <div className="flex flex-col gap-3 max-w-md mx-auto">
              {top.map((f) => {
                const isSel = selectedFloor === f.floor;
                const avail = f.units.filter((u) => u.status === "AVAILABLE").length;
                return (
                  <button
                    key={f.floor}
                    onClick={() => handleFloorClick(f.floor)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-2.5 text-left transition-colors",
                      isSel ? "border-gold bg-forest/10" : "border-pine/25 bg-white/60 hover:border-gold/50"
                    )}
                    aria-label={`Floor ${f.floorLabel} — ${avail} of ${f.units.length} available`}
                  >
                    <span className={cn(
                      "shrink-0 w-11 rounded-lg text-center py-1.5 text-xs font-bold",
                      isSel ? "bg-gold text-forest" : "bg-sage text-forest"
                    )}>
                      {f.floorLabel}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {f.units.map((u) => (
                        <span
                          key={u.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnitClick(u);
                          }}
                          className={cn(cellClass(u, selectedUnitId === u.id), "h-7 w-11 cursor-pointer")}
                          title={`${u.unitNumber} · ${u.unitType} · ${u.areaSqft} sq.ft`}
                          role="button"
                          aria-label={`Unit ${u.unitNumber}`}
                        >
                          {u.unitNumber}
                        </span>
                      ))}
                    </span>
                    <span className="ml-auto shrink-0 text-[11px] font-semibold text-moss">
                      {avail}/{f.units.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-semibold text-forest bg-white/80 backdrop-blur rounded-xl px-3 py-2 border border-border">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-sage border border-pine/50" aria-hidden="true" />Available</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-gold border border-gold-deep" aria-hidden="true" />Held / Your Hold</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-stone-300 border border-stone-400" aria-hidden="true" />Sold</span>
          <span className="flex items-center gap-1.5 ml-auto text-moss">{floors.length} {floors.length > 1 ? "floors" : "level"}</span>
        </div>
      </div>
    </div>
  );
}
