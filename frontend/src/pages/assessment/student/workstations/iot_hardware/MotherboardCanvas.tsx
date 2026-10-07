import React from 'react';
import { MotherboardConfig, HardwareComponentItem } from '../../../../../types/assessment';
import { SlotSnapTarget } from './SlotSnapTarget';
import { RotateCcw, Sparkles, Cpu, Layers, Zap, Radio, Activity } from 'lucide-react';

interface MotherboardCanvasProps {
  boardConfig: MotherboardConfig;
  placements: Record<string, string>; // { slot_id: component_id }
  palette: HardwareComponentItem[];
  onDropComponent: (slotId: string, componentId: string) => void;
  onRemoveComponent: (slotId: string) => void;
  onResetBoard: () => void;
  selectedComponentToPlace?: HardwareComponentItem | null;
  onStartDragPlaced?: (componentId: string) => void;
}

export const MotherboardCanvas: React.FC<MotherboardCanvasProps> = ({
  boardConfig,
  placements,
  palette,
  onDropComponent,
  onRemoveComponent,
  onResetBoard,
  selectedComponentToPlace,
  onStartDragPlaced
}) => {
  const componentMap = React.useMemo(() => {
    const map = new Map<string, HardwareComponentItem>();
    palette.forEach((item) => map.set(item.component_id, item));
    return map;
  }, [palette]);

  const totalSlots = boardConfig.slots.length;
  const occupiedCount = Object.keys(placements).filter(
    (slotId) => Boolean(placements[slotId])
  ).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#040A07] p-2.5 sm:p-4">
      {/* Real Physical Motherboard PCB Substrate */}
      <div className="relative flex-1 flex flex-col rounded-3xl border-4 border-[#0F3521] bg-gradient-to-br from-[#0A2618] via-[#071F13] to-[#04150D] shadow-[0_16px_50px_rgba(0,0,0,0.95)] overflow-hidden">
        
        {/* Authentic FR-4 PCB Solder Mask Traces & Copper Vias (SVG Texture) */}
        <div className="absolute inset-0 pointer-events-none opacity-35">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="industrial-pcb-traces" width="80" height="80" patternUnits="userSpaceOnUse">
                {/* 45-degree Routed Copper Bus Traces */}
                <path d="M 0 40 L 25 40 L 45 60 L 80 60" fill="none" stroke="#D4AF37" strokeWidth="1.2" opacity="0.6" />
                <path d="M 15 0 L 15 25 L 35 45 L 65 45 L 65 80" fill="none" stroke="#C8963E" strokeWidth="1" opacity="0.5" />
                <path d="M 0 15 L 45 15 L 60 30 L 80 30" fill="none" stroke="#D4AF37" strokeWidth="0.9" opacity="0.4" />
                <path d="M 30 80 L 50 60 L 80 60" fill="none" stroke="#D4AF37" strokeWidth="0.8" opacity="0.3" />
                {/* PCB Vias (Gold annular rings with dark drill holes) */}
                <circle cx="25" cy="40" r="3" fill="#D4AF37" />
                <circle cx="25" cy="40" r="1.5" fill="#04150D" />
                <circle cx="45" cy="60" r="3" fill="#D4AF37" />
                <circle cx="45" cy="60" r="1.5" fill="#04150D" />
                <circle cx="35" cy="45" r="2.5" fill="#D4AF37" />
                <circle cx="35" cy="45" r="1.2" fill="#04150D" />
                <circle cx="60" cy="30" r="2.5" fill="#D4AF37" />
                <circle cx="60" cy="30" r="1.2" fill="#04150D" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#industrial-pcb-traces)" />
          </svg>
        </div>

        {/* 4 Heavy-Duty Brass Corner Standoff Mounts with Star Lock Washers */}
        <div className="absolute top-3.5 left-3.5 w-7 h-7 rounded-full border-2 border-amber-400 bg-slate-900 shadow-md flex items-center justify-center z-10 pointer-events-none">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border border-slate-700 flex items-center justify-center shadow-inner">
            <div className="w-2.5 h-0.5 bg-slate-800" />
          </div>
        </div>
        <div className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full border-2 border-amber-400 bg-slate-900 shadow-md flex items-center justify-center z-10 pointer-events-none">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border border-slate-700 flex items-center justify-center shadow-inner">
            <div className="w-2.5 h-0.5 bg-slate-800" />
          </div>
        </div>
        <div className="absolute bottom-3.5 left-3.5 w-7 h-7 rounded-full border-2 border-amber-400 bg-slate-900 shadow-md flex items-center justify-center z-10 pointer-events-none">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border border-slate-700 flex items-center justify-center shadow-inner">
            <div className="w-2.5 h-0.5 bg-slate-800" />
          </div>
        </div>
        <div className="absolute bottom-3.5 right-3.5 w-7 h-7 rounded-full border-2 border-amber-400 bg-slate-900 shadow-md flex items-center justify-center z-10 pointer-events-none">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border border-slate-700 flex items-center justify-center shadow-inner">
            <div className="w-2.5 h-0.5 bg-slate-800" />
          </div>
        </div>

        {/* REAL PHYSICAL BOARD PERIPHERALS STRIP (Top Edge Hardware Section) */}
        <div className="relative z-10 px-8 py-2.5 border-b-2 border-[#123E27] bg-[#06180F]/95 backdrop-blur flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: Power Stage & Peripheral Ports */}
          <div className="flex items-center gap-4">
            
            {/* 1. Metal USB-C Power/Programming Port */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-3 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 rounded-sm border border-slate-500 shadow-sm flex items-center justify-center">
                <div className="w-4 h-1 bg-slate-800 rounded-xs" />
              </div>
              <span className="text-[7px] font-mono text-slate-400 font-bold mt-0.5">J1: USB-C</span>
            </div>

            {/* 2. 5.5mm DC Barrel Jack */}
            <div className="flex flex-col items-center">
              <div className="w-5 h-4 bg-slate-900 rounded border-2 border-slate-600 flex items-center justify-center shadow-sm">
                <div className="w-2 h-2 rounded-full bg-amber-400 border border-slate-700" />
              </div>
              <span className="text-[7px] font-mono text-slate-400 font-bold mt-0.5">DC 9-12V</span>
            </div>

            {/* 3. SOT-223 AMS1117-3.3V LDO Voltage Regulator */}
            <div className="flex flex-col items-center">
              <div className="w-5 h-3.5 bg-[#14171A] rounded-xs border border-slate-700 relative flex items-center justify-center shadow-xs">
                {/* Metal Cooling Tab */}
                <div className="absolute -top-1 w-3 h-1 bg-slate-300 rounded-xs border border-slate-500" />
                <span className="text-[6px] font-mono text-slate-300 font-bold">3.3V</span>
              </div>
              <span className="text-[7px] font-mono text-slate-400 font-bold mt-0.5">U1: REG</span>
            </div>

            {/* 4. Aluminum Electrolytic SMD Capacitors */}
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 border border-slate-500 flex items-center justify-center shadow-xs">
                <div className="w-full h-1 bg-slate-800 opacity-60 rounded-xs" />
              </div>
              <div className="w-3 h-3 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 border border-slate-500 flex items-center justify-center shadow-xs">
                <div className="w-full h-0.5 bg-slate-800 opacity-60 rounded-xs" />
              </div>
            </div>

            {/* 5. 16.000 MHz Metal Crystal Oscillator */}
            <div className="flex flex-col items-center">
              <div className="w-6 h-2.5 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-400 rounded-full border border-slate-500 shadow-xs flex items-center justify-center">
                <span className="text-[5px] font-mono font-bold text-slate-700">16.000M</span>
              </div>
              <span className="text-[7px] font-mono text-slate-400 font-bold mt-0.5">Y1: XTAL</span>
            </div>

            {/* 6. Hardware Reset Button (Red Tactile Plunger) */}
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 bg-slate-800 rounded border border-slate-600 flex items-center justify-center shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-400 shadow-xs active:scale-90" />
              </div>
              <span className="text-[7px] font-mono text-red-400 font-bold mt-0.5">RST</span>
            </div>

            {/* 7. Gold Copper Test Points */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-amber-400 border border-amber-600 shadow-xs" />
                <span className="text-[6px] font-mono text-amber-300">GND</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-amber-400 border border-amber-600 shadow-xs" />
                <span className="text-[6px] font-mono text-amber-300">3V3</span>
              </div>
            </div>
          </div>

          {/* Right: Board Name, Populated Sockets & Reset Control */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="font-bold text-xs text-white tracking-wide font-mono drop-shadow">
                  {boardConfig.board_name.toUpperCase()}
                </h3>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[#092215] text-emerald-300 border border-emerald-500/40">
                  {boardConfig.board_id}
                </span>
              </div>
            </div>

            {/* Socket Counter */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#081F13] border border-emerald-500/30 text-xs font-mono">
              <span className="text-[#8BBDA1]">Mounted:</span>
              <span className={`font-bold ${occupiedCount > 0 ? 'text-emerald-300' : 'text-slate-400'}`}>
                {occupiedCount} / {totalSlots} Sockets
              </span>
            </div>

            {/* Reset Board */}
            <button
              onClick={onResetBoard}
              disabled={occupiedCount === 0}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold text-[#8BBDA1] hover:text-white bg-[#0A2618] hover:bg-[#113824] border border-emerald-600/40 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Board</span>
            </button>
          </div>
        </div>

        {/* Board Main Workspace Canvas with Real Female Header Sockets */}
        <div className="relative z-10 flex-1 p-5 sm:p-7 overflow-y-auto">
          {selectedComponentToPlace && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200 text-xs font-mono flex items-center justify-between shadow-lg shadow-emerald-950/60 animate-pulse">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  SELECTED FOR MOUNTING: <strong className="text-white underline">{selectedComponentToPlace.name}</strong>. Click any target socket below or drag it directly.
                </span>
              </div>
            </div>
          )}

          {/* Sockets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
            {boardConfig.slots.map((slot) => {
              const compId = placements[slot.slot_id];
              const placedComp = compId
                ? componentMap.get(compId) || {
                    component_id: compId,
                    name: compId.replace(/^COMP_/, '').replace(/_/g, ' '),
                    category: slot.supported_types?.[0] || 'HARDWARE_MODULE',
                    image_url: '',
                    specifications: 'Mounted hardware module'
                  }
                : null;
              return (
                <SlotSnapTarget
                  key={slot.slot_id}
                  slot={slot}
                  placedComponent={placedComp}
                  onDropComponent={onDropComponent}
                  onRemoveComponent={onRemoveComponent}
                  selectedComponentToPlace={selectedComponentToPlace}
                  onStartDragPlaced={onStartDragPlaced}
                />
              );
            })}
          </div>
        </div>

        {/* Board Bottom Solder Mask Legend & Certification Marks */}
        <div className="relative z-10 px-8 py-2 border-t-2 border-[#123E27] bg-[#05160E] flex flex-wrap items-center justify-between text-[10px] font-mono text-[#588C71]">
          <div>FABRICATED BY: INDUSTRIAL IoT HARDWARE SYSTEMS LAB • CARRIER v2.4</div>
          <div className="hidden sm:block">ROHS COMPLIANT LEAD-FREE SOLDER • 50Ω MATCHED IMPEDANCE</div>
          <div className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>PCB POWER BUS ACTIVE (3.3V / 5.0V)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
