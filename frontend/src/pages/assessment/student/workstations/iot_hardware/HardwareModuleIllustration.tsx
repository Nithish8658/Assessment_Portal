import React from 'react';

interface HardwareModuleIllustrationProps {
  componentId: string;
  category?: string;
  size?: 'sm' | 'md' | 'lg';
  isMounted?: boolean;
}

export const HardwareModuleIllustration: React.FC<HardwareModuleIllustrationProps> = ({
  componentId,
  category = '',
  size = 'md',
  isMounted = false
}) => {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';
  const widthClass = isLarge ? 'w-24 h-24' : isSmall ? 'w-10 h-10' : 'w-16 h-16';

  const cId = (componentId || '').toUpperCase();

  // 1. ESP32 / ESP32-S3 / NodeMCU (Silver RF shield + Black Matte PCB + Gold Trace Antenna)
  if (cId.includes('ESP32') || cId.includes('NODEMCU') || cId.includes('ESP8266')) {
    return (
      <div className={`${widthClass} relative flex items-center justify-center`}>
        <div className="w-full h-full bg-[#12161C] rounded-md border border-[#2B3542] p-1 shadow-lg flex flex-col justify-between items-center relative overflow-hidden">
          {/* Top Gold Trace Antenna */}
          <div className="w-full h-2.5 bg-[#0A0E13] rounded-t flex items-center justify-center border-b border-amber-500/40">
            <div className="w-3/4 h-1 border-t-2 border-r-2 border-l-2 border-amber-400" />
          </div>
          {/* Metal RF Shield Can with Laser Etching */}
          <div className="w-4/5 h-3/5 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 rounded border border-slate-400 shadow-inner flex flex-col items-center justify-center p-0.5">
            <span className="text-[7px] font-mono font-bold text-slate-800 tracking-tighter leading-none">
              {cId.includes('S3') ? 'ESP32-S3' : 'ESP32'}
            </span>
            <span className="text-[5px] font-mono text-slate-600 leading-none mt-0.5">WROOM-32</span>
            <div className="w-2 h-2 rounded-full border border-slate-500/40 mt-0.5 opacity-60 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-slate-500" />
            </div>
          </div>
          {/* Bottom Micro-USB / Type-C Metal Port */}
          <div className="w-3.5 h-1.5 bg-slate-300 rounded-t border border-slate-500 shadow-xs" />
          {/* Left/Right Gold Plated Header Pins */}
          <div className="absolute left-0.5 top-3 bottom-3 flex flex-col justify-between">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-0.5 h-1 bg-amber-400 shadow-xs" />
            ))}
          </div>
          <div className="absolute right-0.5 top-3 bottom-3 flex flex-col justify-between">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-0.5 h-1 bg-amber-400 shadow-xs" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. STM32 Nucleo / ARM Cortex Board (White/Blue PCB + LQFP-64 IC + Blue ST-LINK Header)
  if (cId.includes('STM32') || cId.includes('NUCLEO') || cId.includes('ARM') || cId.includes('SAMD21') || cId.includes('RP2040')) {
    return (
      <div className={`${widthClass} relative flex items-center justify-center`}>
        <div className="w-full h-full bg-[#EBF2F7] rounded-md border-2 border-[#1E4A7A] p-1 shadow-lg flex flex-col justify-between items-center relative overflow-hidden">
          {/* Blue ST-LINK / Debugger section */}
          <div className="w-full h-2 bg-[#004B87] rounded-t flex items-center justify-between px-1">
            <span className="text-[5px] font-mono text-white font-bold">ST-LINK</span>
            <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          {/* Central Square LQFP-64 Microcontroller IC */}
          <div className="w-3/5 h-3/5 bg-slate-900 rounded border border-slate-700 shadow flex flex-col items-center justify-center p-0.5 relative">
            <div className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-white/40" />
            <span className="text-[6px] font-mono font-bold text-slate-100 leading-tight">STM32</span>
            <span className="text-[5px] font-mono text-[#00E5FF] leading-tight">CORTEX-M4</span>
            {/* SMD Pin leads */}
            <div className="absolute -left-1 top-1 bottom-1 flex flex-col justify-around">
              <div className="w-0.5 h-0.5 bg-slate-400" /><div className="w-0.5 h-0.5 bg-slate-400" /><div className="w-0.5 h-0.5 bg-slate-400" />
            </div>
            <div className="absolute -right-1 top-1 bottom-1 flex flex-col justify-around">
              <div className="w-0.5 h-0.5 bg-slate-400" /><div className="w-0.5 h-0.5 bg-slate-400" /><div className="w-0.5 h-0.5 bg-slate-400" />
            </div>
          </div>
          {/* Bottom Dual Row Morpho Pins */}
          <div className="w-full flex justify-between px-1">
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-amber-500 rounded-xs" /><div className="w-1 h-1 bg-amber-500 rounded-xs" />
            </div>
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-amber-500 rounded-xs" /><div className="w-1 h-1 bg-amber-500 rounded-xs" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Capacitive Soil Moisture Sensor (White/Black PCB + Immersion Gold Sensor Blades)
  if (cId.includes('SOIL') || cId.includes('CAP_SOIL')) {
    return (
      <div className={`${widthClass} relative flex items-center justify-center`}>
        <div className="w-3/5 h-full flex flex-col items-center">
          {/* Top Electronics Head */}
          <div className="w-full h-1/3 bg-slate-100 rounded-t border border-slate-300 p-0.5 flex flex-col items-center justify-center shadow">
            <div className="w-2 h-1 bg-slate-800 rounded-xs mb-0.5" />
            <div className="flex gap-0.5">
              <div className="w-1 h-1 bg-amber-400 rounded-full" />
              <div className="w-1 h-1 bg-amber-400 rounded-full" />
              <div className="w-1 h-1 bg-amber-400 rounded-full" />
            </div>
          </div>
          {/* Two Immersion Gold Sensor Prongs */}
          <div className="w-full h-2/3 flex justify-between px-0.5 pt-0.5 bg-slate-800 rounded-b">
            <div className="w-2/5 h-full bg-gradient-to-b from-amber-400 via-amber-300 to-amber-500 rounded-b border border-amber-600/40 shadow-inner" />
            <div className="w-2/5 h-full bg-gradient-to-b from-amber-400 via-amber-300 to-amber-500 rounded-b border border-amber-600/40 shadow-inner" />
          </div>
        </div>
      </div>
    );
  }

  // 4. 5V / 12V Relay Module (Blue Songle Cube + Optocoupler + Green Screw Terminals)
  if (cId.includes('RELAY') || cId.includes('SSR') || cId.includes('VALVE') || cId.includes('TRIAC') || cId.includes('MOSFET') || cId.includes('SOLENOID')) {
    return (
      <div className={`${widthClass} relative flex items-center justify-center`}>
        <div className="w-full h-full bg-[#102235] rounded-md border border-[#1D3B60] p-1 shadow-lg flex flex-col justify-between relative">
          {/* Blue Songle Electromechanical Cube */}
          <div className="w-full h-3/5 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded border border-blue-400/80 shadow flex flex-col items-center justify-center p-0.5">
            <span className="text-[7px] font-mono font-bold text-white tracking-widest drop-shadow">SONGLE</span>
            <span className="text-[5px] font-mono text-blue-200">10A 250VAC</span>
          </div>
          {/* Green 3-Pin Screw Terminal Block */}
          <div className="w-full h-2/5 bg-[#1B633C] rounded border border-[#2EB86F] mt-1 flex items-center justify-around px-0.5">
            <div className="w-1.5 h-1.5 rounded-full border border-slate-800 bg-amber-400 flex items-center justify-center">
              <div className="w-1 h-0.5 bg-slate-800" />
            </div>
            <div className="w-1.5 h-1.5 rounded-full border border-slate-800 bg-amber-400 flex items-center justify-center">
              <div className="w-1 h-0.5 bg-slate-800" />
            </div>
            <div className="w-1.5 h-1.5 rounded-full border border-slate-800 bg-amber-400 flex items-center justify-center">
              <div className="w-1 h-0.5 bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. 0.96" OLED Display (Dark Glass Screen + Blue Breakout PCB Header)
  if (cId.includes('OLED') || cId.includes('DISPLAY')) {
    return (
      <div className={`${widthClass} relative flex items-center justify-center`}>
        <div className="w-full h-full bg-[#0B1E36] rounded-md border border-[#1D3B60] p-1 flex flex-col justify-between items-center shadow-lg">
          {/* 4 Gold Header Pins */}
          <div className="flex gap-1 mb-0.5">
            <div className="w-1 h-1 bg-amber-400 rounded-xs" />
            <div className="w-1 h-1 bg-amber-400 rounded-xs" />
            <div className="w-1 h-1 bg-amber-400 rounded-xs" />
            <div className="w-1 h-1 bg-amber-400 rounded-xs" />
          </div>
          {/* Black Glass OLED Panel with glowing cyan telemetry */}
          <div className="w-full flex-1 bg-[#020408] rounded border border-cyan-500/40 p-1 flex flex-col justify-center items-center overflow-hidden shadow-inner">
            <div className="w-3/4 h-1 bg-cyan-400/80 rounded-full mb-0.5" />
            <span className="text-[6px] font-mono text-cyan-300 font-bold tracking-tight">128x64 I2C</span>
            <div className="w-1/2 h-0.5 bg-cyan-500/50 mt-0.5" />
          </div>
        </div>
      </div>
    );
  }

  // 6. DHT22 / DHT11 Digital Temperature & Humidity Sensor (White Vented Plastic Grill)
  if (cId.includes('DHT22') || cId.includes('DHT11')) {
    return (
      <div className={`${widthClass} relative flex items-center justify-center`}>
        <div className="w-4/5 h-full flex flex-col items-center justify-between">
          <div className="w-full flex-1 bg-slate-100 rounded-md border border-slate-300 p-1 flex flex-col justify-around items-center shadow-md">
            {/* Vented Grill Slits */}
            <div className="w-3/4 h-0.5 bg-slate-300 rounded" />
            <div className="w-3/4 h-0.5 bg-slate-300 rounded" />
            <div className="w-3/4 h-0.5 bg-slate-300 rounded" />
            <span className="text-[6px] font-mono font-bold text-slate-700">DHT22</span>
          </div>
          {/* 4 Gold Connector Pins */}
          <div className="flex gap-1 pt-1">
            <div className="w-0.5 h-2 bg-amber-400" />
            <div className="w-0.5 h-2 bg-amber-400" />
            <div className="w-0.5 h-2 bg-amber-400" />
            <div className="w-0.5 h-2 bg-amber-400" />
          </div>
        </div>
      </div>
    );
  }

  // 7. BME680 / BME280 Environmental Sensor (Purple Breakout PCB with Metallic MEMS Can)
  if (cId.includes('BME680') || cId.includes('BME280') || cId.includes('BMP280')) {
    return (
      <div className={`${widthClass} relative flex items-center justify-center`}>
        <div className="w-full h-full bg-[#3B144E] rounded-md border-2 border-[#5E227C] p-1 flex flex-col justify-between items-center shadow-md">
          {/* Silver MEMS Sensor Chamber */}
          <div className="w-3/5 h-3/5 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 rounded-sm border border-slate-400 shadow flex items-center justify-center relative">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-600" />
            <span className="absolute bottom-0.5 text-[5px] font-mono text-slate-800 font-bold">BOSCH</span>
          </div>
          <span className="text-[6px] font-mono text-purple-200 font-bold">BME680</span>
          {/* I2C/SPI Pin Headers */}
          <div className="flex gap-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-amber-400 rounded-xs" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 8. Ultrasonic Distance Sensor HC-SR04 (Dual Metallic Transducer Cylinders)
  if (cId.includes('HCSR04') || cId.includes('SONAR')) {
    return (
      <div className={`${widthClass} relative flex items-center justify-center`}>
        <div className="w-full h-4/5 bg-[#122238] rounded-md border border-[#1D3B60] p-1 flex items-center justify-around shadow-md">
          {/* Left Transducer Cylinder */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 border-2 border-slate-500 flex items-center justify-center shadow">
            <div className="w-2.5 h-2.5 rounded-full border border-slate-600 bg-slate-700/80" />
          </div>
          {/* Right Receiver Cylinder */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 border-2 border-slate-500 flex items-center justify-center shadow">
            <div className="w-2.5 h-2.5 rounded-full border border-slate-600 bg-slate-700/80" />
          </div>
        </div>
      </div>
    );
  }

  // 9. LoRa SX1276 / SX1262 Transceiver (Blue PCB + Gold SMA Brass Bulkhead Connector)
  if (cId.includes('LORA') || cId.includes('SX1276') || cId.includes('SX1262')) {
    return (
      <div className={`${widthClass} relative flex items-center justify-center`}>
        <div className="w-full h-full bg-[#0D2B45] rounded-md border border-[#1D4568] p-1 shadow-lg flex flex-col justify-between items-center relative">
          {/* Gold SMA Antenna Connector */}
          <div className="w-4 h-3 bg-gradient-to-b from-amber-400 via-amber-300 to-amber-500 rounded-t border border-amber-600 flex items-center justify-center">
            <div className="w-2 h-1.5 rounded-full bg-slate-900" />
          </div>
          {/* Metal RF Shield Can */}
          <div className="w-4/5 h-2/5 bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 rounded border border-slate-500 shadow-inner flex items-center justify-center">
            <span className="text-[6px] font-mono text-slate-900 font-bold">LoRa 868M</span>
          </div>
          {/* SPI Pin Headers */}
          <div className="flex gap-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-amber-400 rounded-xs" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 10. RS-485 / Industrial Fieldbus Transceiver (SOIC-8 IC + Green Screw Terminals)
  if (cId.includes('485') || cId.includes('CAN') || cId.includes('DALI') || cId.includes('SDI12')) {
    return (
      <div className={`${widthClass} relative flex items-center justify-center`}>
        <div className="w-full h-full bg-[#122A1E] rounded-md border border-[#1E4A35] p-1 flex flex-col justify-between items-center shadow-lg">
          {/* Green 2-Pin Screw Terminal Block */}
          <div className="w-3/4 h-3 bg-[#1F6E43] rounded border border-[#2EB86F] flex items-center justify-around">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex items-center justify-center">
              <div className="w-1 h-0.5 bg-slate-700" />
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex items-center justify-center">
              <div className="w-1 h-0.5 bg-slate-700" />
            </div>
          </div>
          {/* Black Transceiver IC */}
          <div className="w-3/5 h-2.5 bg-slate-900 rounded border border-slate-700 flex items-center justify-center">
            <span className="text-[6px] font-mono text-slate-300 font-bold">
              {cId.includes('CAN') ? 'CAN-BUS' : 'MAX485'}
            </span>
          </div>
          {/* Header Pins */}
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-amber-400 rounded-full" />
            <div className="w-1 h-1 bg-amber-400 rounded-full" />
            <div className="w-1 h-1 bg-amber-400 rounded-full" />
            <div className="w-1 h-1 bg-amber-400 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // 11. Precision ADC ADS1115 / AFE Module (Purple Breakout PCB)
  if (cId.includes('ADC') || cId.includes('ADS1115') || cId.includes('AFE') || cId.includes('PT100')) {
    return (
      <div className={`${widthClass} relative flex items-center justify-center`}>
        <div className="w-full h-full bg-[#2E153B] rounded-md border border-[#4A205E] p-1 flex flex-col justify-between items-center shadow-md">
          <div className="w-full flex justify-between px-1">
            <div className="w-1 h-1 bg-amber-400 rounded-full" />
            <div className="w-1 h-1 bg-amber-400 rounded-full" />
          </div>
          {/* Delta-Sigma 16-bit IC */}
          <div className="w-3/4 h-3 bg-slate-950 rounded border border-purple-500/40 flex items-center justify-center">
            <span className="text-[6px] font-mono text-purple-300 font-bold">16-BIT ADC</span>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-1 h-1 bg-amber-400 rounded-xs" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 12. Power Management & Solar MPPT / DC-DC Buck-Boost (Blue PCB + Inductor + Pots)
  if (cId.includes('BUCK') || cId.includes('BOOST') || cId.includes('POWER') || cId.includes('MPPT') || cId.includes('BMS') || cId.includes('DCDC') || cId.includes('SMPS')) {
    return (
      <div className={`${widthClass} relative flex items-center justify-center`}>
        <div className="w-full h-full bg-[#152438] rounded-md border border-[#233F60] p-1 flex flex-col justify-between items-center shadow-lg">
          <div className="w-full flex justify-between items-center">
            {/* Blue Brass Trimmer Potentiometer */}
            <div className="w-3 h-3 bg-blue-600 rounded border border-blue-400 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
            {/* Black Toroidal Power Inductor */}
            <div className="w-4 h-4 rounded-full border-2 border-amber-600 bg-slate-950 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
            </div>
          </div>
          <span className="text-[6px] font-mono text-amber-300 font-bold">
            {cId.includes('MPPT') ? 'MPPT BMS' : 'DC-DC REG'}
          </span>
          <div className="w-full flex justify-between px-0.5">
            <div className="w-1 h-1 bg-amber-400 rounded-xs" />
            <div className="w-1 h-1 bg-amber-400 rounded-xs" />
          </div>
        </div>
      </div>
    );
  }

  // 13. Default General Electronics Breakout Module
  return (
    <div className={`${widthClass} relative flex items-center justify-center`}>
      <div className="w-full h-full bg-[#121A24] rounded-md border border-[#223244] p-1 flex flex-col justify-between items-center shadow-md">
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-amber-400 rounded-full" />
          <div className="w-1 h-1 bg-amber-400 rounded-full" />
        </div>
        <div className="w-3/4 h-2.5 bg-slate-900 rounded border border-slate-700 flex items-center justify-center">
          <span className="text-[6px] font-mono text-emerald-400 font-bold">MODULE</span>
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-amber-400 rounded-full" />
          <div className="w-1 h-1 bg-amber-400 rounded-full" />
        </div>
      </div>
    </div>
  );
};
