import React, { useState, useRef } from 'react';
import { MotherboardSlot, HardwareComponentItem } from '../../../../../types/assessment';
import { HardwareModuleIllustration } from './HardwareModuleIllustration';
import { X, Zap, Layers, Sparkles, CheckCircle2, GripVertical } from 'lucide-react';

interface SlotSnapTargetProps {
  slot: MotherboardSlot;
  placedComponent?: HardwareComponentItem | null;
  onDropComponent: (slotId: string, componentId: string) => void;
  onRemoveComponent: (slotId: string) => void;
  onClickSlot?: (slotId: string) => void;
  selectedComponentToPlace?: HardwareComponentItem | null;
  onStartDragPlaced?: (componentId: string) => void;
}

export const SlotSnapTarget: React.FC<SlotSnapTargetProps> = ({
  slot,
  placedComponent,
  onDropComponent,
  onRemoveComponent,
  onClickSlot,
  selectedComponentToPlace,
  onStartDragPlaced
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragEnterCounter = useRef(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragEnterCounter.current += 1;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragEnterCounter.current -= 1;
    if (dragEnterCounter.current <= 0) {
      dragEnterCounter.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragEnterCounter.current = 0;
    setIsDragOver(false);

    // Read dropped component ID with global fallback
    const componentId =
      (window as any).__activeDraggedHardwareComponent ||
      e.dataTransfer.getData('component_id') ||
      e.dataTransfer.getData('text/plain') ||
      e.dataTransfer.getData('text');

    if (componentId) {
      onDropComponent(slot.slot_id, componentId);
    }
    (window as any).__activeDraggedHardwareComponent = null;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedComponentToPlace) {
      onDropComponent(slot.slot_id, selectedComponentToPlace.component_id);
    } else if (onClickSlot) {
      onClickSlot(slot.slot_id);
    }
  };

  const isHighlighted = isDragOver || (selectedComponentToPlace && !placedComponent);

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`relative group rounded-2xl p-4 transition-all duration-200 border-2 cursor-pointer flex flex-col justify-between min-h-[175px] select-none ${
        placedComponent
          ? 'border-emerald-500/80 bg-gradient-to-b from-[#0B2117] to-[#071710] shadow-[0_8px_24px_rgba(0,0,0,0.85)] ring-1 ring-emerald-400/40'
          : isHighlighted
          ? 'border-emerald-400 bg-emerald-950/60 shadow-[0_0_30px_rgba(52,211,153,0.45)] scale-[1.02] ring-2 ring-emerald-400'
          : 'border-[#173D2A] bg-gradient-to-b from-[#091D13] to-[#06140D] hover:border-emerald-500/60 hover:bg-[#0C2418] shadow-md'
      }`}
    >
      {/* Authentic PCB White Silkscreen Border & Pin 1 Indicator */}
      <div className="absolute top-2 left-2 flex items-center gap-1 opacity-70 pointer-events-none">
        {/* Pin 1 Triangle Mark */}
        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-amber-300" />
        <span className="text-[8px] font-mono text-amber-300/80 font-bold">PIN 1</span>
      </div>

      {/* Top Header: Silkscreen Reference Designator & Status */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 pt-1 pl-12 relative z-10">
        <div className="flex items-center gap-2 min-w-0 pointer-events-none">
          <span className="text-[11px] font-mono tracking-wider font-bold text-white uppercase drop-shadow truncate">
            {slot.label}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0A2619] text-emerald-300 border border-emerald-500/30 shrink-0">
            {slot.slot_id}
          </span>
        </div>

        {placedComponent ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onRemoveComponent(slot.slot_id);
            }}
            title={`Unmount ${placedComponent.name} from socket`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 hover:text-white text-[10px] font-mono font-bold transition-all border border-rose-500/40 hover:border-rose-400 cursor-pointer shadow-sm active:scale-95 shrink-0 z-20"
          >
            <X className="w-3.5 h-3.5 text-rose-300" />
            <span>Unmount</span>
          </button>
        ) : (
          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#071911] text-emerald-400 font-medium border border-emerald-500/25 tracking-wide shrink-0 pointer-events-none">
            VACANT
          </span>
        )}
      </div>

      {/* Center Socket Physical Representation */}
      <div className="my-2.5 flex-1 flex flex-col justify-center items-center">
        {placedComponent ? (
          /* Realistic Mounted Hardware Module plugged into header socket */
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', placedComponent.component_id);
              e.dataTransfer.setData('component_id', placedComponent.component_id);
              (window as any).__activeDraggedHardwareComponent = placedComponent.component_id;
              e.dataTransfer.effectAllowed = 'copyMove';
              if (onStartDragPlaced) onStartDragPlaced(placedComponent.component_id);
            }}
            onDragEnd={() => {
              (window as any).__activeDraggedHardwareComponent = null;
            }}
            className="w-full flex items-center gap-3.5 bg-[#05110B] p-3 rounded-xl border border-emerald-500/40 shadow-inner cursor-grab active:cursor-grabbing hover:border-emerald-400 transition-all group/card"
            title="Drag to move to another socket, or click Unmount above"
          >
            <div className="shrink-0 relative">
              <HardwareModuleIllustration componentId={placedComponent.component_id} size="md" isMounted={true} />
              {/* Green Mounted LED Indicator */}
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white shadow-[0_0_8px_#34D399]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-white truncate drop-shadow">
                  {placedComponent.name}
                </span>
                <GripVertical className="w-3.5 h-3.5 text-slate-500 group-hover/card:text-emerald-400 shrink-0" />
              </div>

              <div className="text-[10px] text-emerald-300 font-mono truncate mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>SEATED & POWERED • {placedComponent.category.replace(/_/g, ' ')}</span>
              </div>

              <div className="text-[10px] text-slate-400 line-clamp-1 italic mt-1">
                {placedComponent.specifications}
              </div>
            </div>
          </div>
        ) : (
          /* Authentic Dual-Row Female Pin Header Socket Graphic */
          <div className="w-full flex flex-col items-center justify-center py-2 space-y-2 pointer-events-none">
            {/* Top Row: Black Thermoplastic Socket Strip with Gold Receptacle Contacts */}
            <div className="w-full max-w-[280px] h-4 bg-[#11151A] rounded border border-slate-700 shadow-inner flex items-center justify-around px-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-xs bg-[#07090C] border border-amber-400/80 shadow-inner flex items-center justify-center">
                  <div className="w-0.5 h-0.5 bg-amber-400" />
                </div>
              ))}
            </div>

            <div className="text-center py-0.5">
              <span className={`text-[11px] font-mono tracking-tight font-medium ${isHighlighted ? 'text-emerald-300 font-bold' : 'text-emerald-400/70'}`}>
                {selectedComponentToPlace ? 'Click to Seat Selected Module' : 'Drop Compatible Module Here'}
              </span>
            </div>

            {/* Bottom Row: Black Thermoplastic Socket Strip */}
            <div className="w-full max-w-[280px] h-4 bg-[#11151A] rounded border border-slate-700 shadow-inner flex items-center justify-around px-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-xs bg-[#07090C] border border-amber-400/80 shadow-inner flex items-center justify-center">
                  <div className="w-0.5 h-0.5 bg-amber-400" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Silkscreen Pinout Wiring Specs */}
      <div className="border-t border-white/10 pt-2 flex items-center justify-between text-[10px] font-mono text-[#7CAE93] pointer-events-none">
        <div className="flex items-center gap-1.5 truncate max-w-[70%]">
          <Zap className="w-3 h-3 text-amber-400 shrink-0" />
          <span className="truncate">{slot.pin_bus}</span>
        </div>

        <div className="flex items-center gap-1 text-[9px] text-[#A0CEB5] uppercase font-bold shrink-0">
          <Layers className="w-2.5 h-2.5" />
          <span>{slot.supported_types.join(' / ')}</span>
        </div>
      </div>
    </div>
  );
};
