import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { CompetencyRadarItem } from '../../types/assessment';

interface CompetencyRadarProps {
  data: CompetencyRadarItem[];
  accentColor?: string;
}

export const CompetencyRadar: React.FC<CompetencyRadarProps> = ({
  data,
  accentColor = '#C9A227'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs font-mono text-[#9E988A] bg-[#141311] rounded-2xl border border-[#2A2824]">
        Awaiting evaluated competency scores...
      </div>
    );
  }

  const formatAxisSubject = (name: string, code?: string) => {
    if (code === 'IOT_MCU_ARCH' || name.includes('Microcontroller')) return 'MCU Architecture';
    if (code === 'IOT_BUS_PROTOCOLS' || name.includes('Bus Interfacing') || name.includes('Serial')) return 'Bus Protocols';
    if (code === 'IOT_SENSOR_AFE' || name.includes('Sensor Front-End') || name.includes('Transducers')) return 'Sensors & AFE';
    if (code === 'IOT_POWER_ISOLATION' || name.includes('Power Domain') || name.includes('Galvanic')) return 'Power & Isolation';
    if (code === 'IOT_ACTUATOR_DRIVE' || name.includes('Actuator Interfacing')) return 'Actuator Drive';
    if (name.length > 24) return name.substring(0, 22) + '…';
    return name;
  };

  const chartData = data.map((item) => ({
    subject: formatAxisSubject(item.competency_name, item.competency_code),
    fullName: item.competency_name,
    score: item.percentage,
    fullMark: 100,
    readiness: item.readiness_level,
    category: item.category
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-[#1C1B18] border border-[#C9A227]/40 p-3 rounded-xl shadow-2xl text-xs font-mono">
          <p className="font-bold text-[#F8F5ED] leading-snug">{d.fullName}</p>
          <p className="text-[#9E988A] text-[10px] uppercase mt-0.5">{d.category}</p>
          <p className="text-[#C9A227] font-semibold mt-1.5">Proficiency: {d.score}%</p>
          <p className="text-[#D8D2C5] text-[11px] mt-0.5">Readiness: {d.readiness}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72 sm:h-80 relative select-none">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={chartData}>
          <PolarGrid stroke="#2A2824" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#D8D2C5', fontSize: 10, fontFamily: 'monospace' }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#6B665E', fontSize: 9 }}
            stroke="#2A2824"
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Competency Score"
            dataKey="score"
            stroke={accentColor}
            fill={accentColor}
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
