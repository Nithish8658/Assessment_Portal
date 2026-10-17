import React, { useState } from 'react';
import { HardwareComponentItem } from '../../../../../types/assessment';
import { HardwareModuleIllustration } from './HardwareModuleIllustration';
import { Search, Cpu, Radio, Zap, Activity, Monitor, Package, Check, Info, GripVertical } from 'lucide-react';

interface ComponentPaletteProps {
  components: HardwareComponentItem[];
  placements: Record<string, string>;
  onSelectComponent: (comp: HardwareComponentItem | null) => void;
  selectedComponent: HardwareComponentItem | null;
  onStartDragComponent?: (componentId: string) => void;
  onEndDragComponent?: () => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  components,
  placements,
  onSelectComponent,
  selectedComponent,
  onStartDragComponent,
  onEndDragComponent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const placedComponentIds = React.useMemo(() => {
    return new Set(Object.values(placements).filter(Boolean));
  }, [placements]);

  const categories = [
    { id: 'ALL', label: 'All Parts' },
    { id: 'MICROCONTROLLER', label: 'MCUs' },
    { id: 'SENSOR', label: 'Sensors' },
    { id: 'COMMUNICATION', label: 'Comms' },
    { id: 'ACTUATOR', label: 'Actuators' },
    { id: 'POWER', label: 'Power' }
  ];

  const filteredComponents = React.useMemo(() => {
    return components.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.specifications.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeCategory === 'ALL') return true;
      if (activeCategory === 'SENSOR') {
        return item.category.includes('SENSOR') || item.category.includes('AFE') || item.category.includes('DIGITAL_SENSOR');
      }
      if (activeCategory === 'ACTUATOR') {
        return item.category.includes('ACTUATOR') || item.category.includes('SSR') || item.category.includes('AC');
      }
      if (activeCategory === 'POWER') {
        return item.category.includes('POWER') || item.category.includes('BMS');
      }
      if (activeCategory === 'COMMUNICATION') {
        return item.category.includes('COMMUNICATION') || item.category.includes('DISPLAY');
      }
      return item.category === activeCategory;
    });
  }, [components, searchQuery, activeCategory]);

  const handleDragStart = (e: React.DragEvent, item: HardwareComponentItem) => {
    e.dataTransfer.setData('text/plain', item.component_id);
    e.dataTransfer.setData('component_id', item.component_id);
    (window as any).__activeDraggedHardwareComponent = item.component_id;
    e.dataTransfer.effectAllowed = 'copyMove';
    onSelectComponent(item);
    if (onStartDragComponent) onStartDragComponent(item.component_id);
  };

  const handleDragEnd = () => {
    (window as any).__activeDraggedHardwareComponent = null;
    if (onEndDragComponent) onEndDragComponent();
  };

  const getCategoryIcon = (category: string) => {
    const c = (category || '').toUpperCase();
    if (c.includes('MICROCONTROLLER') || c.includes('MCU')) return <Cpu className="w-3.5 h-3.5 text-cyan-600" />;
    if (c.includes('COMMUNICATION') || c.includes('COMMS')) return <Radio className="w-3.5 h-3.5 text-amber-600" />;
    if (c.includes('SENSOR') || c.includes('AFE')) return <Activity className="w-3.5 h-3.5 text-emerald-600" />;
    if (c.includes('ACTUATOR') || c.includes('RELAY')) return <Zap className="w-3.5 h-3.5 text-rose-600" />;
    if (c.includes('DISPLAY')) return <Monitor className="w-3.5 h-3.5 text-indigo-600" />;
    return <Package className="w-3.5 h-3.5 text-[#FF5500]" />;
  };

  return (
    <div className="w-80 lg:w-[380px] flex flex-col h-full bg-white border-l border-[#E2E8F0] shadow-sm z-20">
      {/* Header */}
      <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#FF5500]" />
            <h2 className="font-semibold text-sm text-[#0F172A]">Hardware Bin / Inventory</h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-[#FF5500] border border-[#FF5500]/25 font-semibold">
            {components.length} Available
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search chips, modules, sensors, buses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF5500] focus:ring-1 focus:ring-[#FF5500] transition-colors font-mono"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#FF5500] text-white font-bold shadow-xs'
                  : 'bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F0F3F6] border border-[#E2E8F0]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Component Cards List with Real Hardware Illustrations */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#F6F8FA]">
        {filteredComponents.length === 0 ? (
          <div className="text-center py-12 text-[#64748B]">
            <Info className="w-8 h-8 mx-auto mb-2 opacity-50 text-[#FF5500]" />
            <p className="text-xs font-mono">No matching hardware modules found.</p>
          </div>
        ) : (
          filteredComponents.map((item) => {
            const isMounted = placedComponentIds.has(item.component_id);
            const isSelected = selectedComponent?.component_id === item.component_id;

            return (
              <div
                key={item.component_id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
                onClick={() => onSelectComponent(isSelected ? null : item)}
                className={`group relative p-3 rounded-xl border-2 transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                  isSelected
                    ? 'border-[#FF5500] bg-[#FFF8F5] shadow-sm scale-[1.01] ring-1 ring-[#FF5500]'
                    : isMounted
                    ? 'border-[#E2E8F0] bg-white/70 opacity-60'
                    : 'border-[#E2E8F0] bg-white hover:border-[#FF5500]/60 hover:bg-[#FFF8F5] shadow-xs'
                }`}
              >
                {/* Header: Grip Handle, Category & Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <GripVertical className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#FF5500] transition-colors shrink-0" />
                    {getCategoryIcon(item.category)}
                    <span className="text-[10px] font-mono font-medium text-[#64748B] uppercase tracking-wider truncate">
                      {item.category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {isMounted ? (
                    <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      <Check className="w-3 h-3 text-emerald-600" /> MOUNTED
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#F0F3F6] text-[#64748B] border border-[#E2E8F0] shrink-0 font-medium">
                      READY
                    </span>
                  )}
                </div>

                {/* Card Body: Real Hardware Module Graphic + Info */}
                <div className="flex items-center gap-3">
                  {/* Module CAD / Physical Graphic */}
                  <div className="shrink-0 p-1 rounded-lg bg-[#F0F3F6] border border-[#E2E8F0] flex items-center justify-center">
                    <HardwareModuleIllustration componentId={item.component_id} category={item.category} size="md" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#0F172A] group-hover:text-[#FF5500] transition-colors leading-snug">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                      {item.specifications}
                    </p>
                  </div>
                </div>

                {/* Footer: ID & Drag hint */}
                <div className="mt-2.5 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
                  <span className="text-[9px] truncate max-w-[120px] text-[#64748B]">{item.component_id}</span>
                  <span className="text-[#FF5500] font-bold group-hover:translate-x-0.5 transition-transform">
                    {isMounted ? 'Mounted on Board' : 'Drag to Mount →'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
