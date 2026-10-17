import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea
} from 'recharts';
import { TrendingUp, BarChart3, Target } from 'lucide-react';
import apiClient from '../../api/client';

// Every score here is the latest published attempt per student and round (see the
// /dashboard/hod-analytics endpoint); earlier attempts are never averaged in.

interface TrendPoint { month: string; avg: number | null; results: number }
interface ClassTrend { id: number; name: string; code: string; trend: TrendPoint[] }
// counts follow the order of Analytics.bands (Excellent first)
interface Distribution { class_id: number; name: string; counts: number[]; students: number }
interface Skill { code: string; name: string; avg: number; students: number }
interface Analytics {
  months: string[];
  month_labels: string[];
  bands: { label: string; min: number }[];
  classes: ClassTrend[];
  distribution: Distribution[];
  skills: Skill[];
  skill_target: number;
}

// Class colours in a fixed order (validated for colour-blind separation on the card surface).
// Colour follows the class, never its rank.
const CLASS_COLORS = ['#3987e5', '#d95926', '#199e70', '#9085e9', '#FF5500', '#d55181', '#008300', '#e66767'];
const ABOVE = '#FF5500';
const BELOW = '#EF4444';
// Grade bands, Bad to Excellent
const BAND_COLORS: Record<string, string> = {
  Bad: '#EF4444', Average: '#F59E0B', Good: '#93C5FD', 'V Good': '#3B82F6', Excellent: '#FF5500',
};
const MUTED = '#64748B';
const GRID = '#E2E8F0';

const bandOf = (v: number, bands: Analytics['bands']) => bands.find((b) => v >= b.min)?.label ?? '';

const Panel: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode; className?: string }> = ({ icon, title, subtitle, children, className = '' }) => (
  <section className={`bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-3 sm:p-3.5 space-y-2 min-w-0 shadow-sm ${className}`}>
    <div className="flex items-start gap-2.5">
      <div className="p-1.5 bg-[#F0F3F6] rounded-lg text-[#FF5500] border border-[#E2E8F0] shrink-0">{icon}</div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-[#0F172A]">{title}</h3>
        <p className="text-[11px] text-[#64748B]">{subtitle}</p>
      </div>
    </div>
    {children}
  </section>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="h-28 flex items-center justify-center text-center text-xs text-[#64748B] bg-[#F0F3F6] rounded-xl border border-dashed border-[#E2E8F0] px-4">
    {text}
  </div>
);

const TipBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-lg px-3 py-2 text-[11px] shadow-xl space-y-1">{children}</div>
);

export const HodAnalytics: React.FC = () => {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    apiClient.get('/dashboard/hod-analytics')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Department analytics could not be loaded.'));
  }, []);

  if (error) return <Empty text={error} />;
  if (!data) return <Empty text="Loading department analytics…" />;

  const color = (classId: number) => CLASS_COLORS[Math.max(0, data.classes.findIndex((c) => c.id === classId)) % CLASS_COLORS.length];

  // ---- I. Class trends ----
  // Only months in which at least one class has a result
  const trendRows = data.months.map((m, i) => {
    const row: Record<string, any> = { month: data.month_labels[i] };
    data.classes.forEach((c) => { row[`c${c.id}`] = c.trend[i]?.avg; row[`n${c.id}`] = c.trend[i]?.results; });
    return row;
  }).filter((_, i) => data.classes.some((c) => c.trend[i]?.avg != null));
  const withResults = data.classes.filter((c) => c.trend.some((p) => p.avg != null));
  const bandTicks = data.bands.filter((b) => b.min > 0).map((b) => b.min);

  // ---- J. Score distribution: bands shown low to high, left to right ----
  const bandsAsc = data.bands.map((b, i) => ({
    ...b,
    index: i,
    range: i === data.bands.length - 1 ? `<${data.bands[i - 1].min}` : i === 0 ? `${b.min}+` : `${b.min}–${data.bands[i - 1].min - 1}`,
  })).reverse();

  // ---- L. Skills: strongest and weakest against the target ----
  const target = data.skill_target;
  // skills arrive sorted strongest first
  const strengths = data.skills.filter((s) => s.avg >= target).slice(0, 4);
  const gapsList = data.skills.filter((s) => s.avg < target).slice(-4).reverse();

  return (
    <div className="space-y-3">
      <Panel
        icon={<TrendingUp className="w-4 h-4" />}
        title="Class performance by month"
        subtitle="Class average at the end of each month, from each student's latest result per round"
      >
        {withResults.length === 0 ? (
          <Empty text="No evaluated results for your department's classes this academic year yet." />
        ) : (
          <>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendRows} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                  {data.bands.map((b, i) => i % 2 === 0 && (
                    <ReferenceArea key={b.label} y1={b.min} y2={i === 0 ? 100 : data.bands[i - 1].min} fill="#0F172A" fillOpacity={0.02} strokeOpacity={0} />
                  ))}
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, ...bandTicks]}
                    interval={0}
                    tickFormatter={(v: number) => `${bandOf(v + 0.1, data.bands)} ${v}`}
                    tick={{ fill: MUTED, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={92}
                  />
                  <Tooltip
                    cursor={{ stroke: '#FF5500', strokeOpacity: 0.4 }}
                    content={({ active, payload, label }: any) => active && payload?.length ? (
                      <TipBox>
                        <div className="font-bold text-[#0F172A]">{label}</div>
                        {payload.filter((p: any) => p.value != null).map((p: any) => {
                          const id = Number(String(p.dataKey).slice(1));
                          const cls = data.classes.find((c) => c.id === id);
                          return (
                            <div key={p.dataKey} className="flex items-center gap-2 text-[#475569]">
                              <span className="w-2 h-2 rounded-full" style={{ background: p.stroke }} />
                              <span className="truncate max-w-[160px]">{cls?.name}</span>
                              <span className="ml-auto font-mono text-[#0F172A] font-semibold">{p.value}%</span>
                              <span className="text-[#64748B]">{bandOf(p.value, data.bands)} · {p.payload[`n${id}`]} results</span>
                            </div>
                          );
                        })}
                      </TipBox>
                    ) : null}
                  />
                  {withResults.map((c) => (
                    <Line
                      key={c.id}
                      type="monotone"
                      dataKey={`c${c.id}`}
                      stroke={color(c.id)}
                      strokeWidth={hovered === null || hovered === c.id ? 2 : 1}
                      strokeOpacity={hovered === null || hovered === c.id ? 1 : 0.3}
                      dot={{ r: 4, fill: color(c.id), stroke: '#FFFFFF', strokeWidth: 2 }}
                      activeDot={{ r: 5, stroke: '#FFFFFF', strokeWidth: 2 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
              {data.classes.map((c) => {
                const has = c.trend.some((p) => p.avg != null);
                return (
                  <span
                    key={c.id}
                    onMouseEnter={() => has && setHovered(c.id)}
                    onMouseLeave={() => setHovered(null)}
                    className={`inline-flex items-center gap-1.5 ${has ? 'text-[#0F172A] cursor-default' : 'text-[#64748B]'}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: has ? color(c.id) : 'transparent', border: has ? 'none' : `1px solid ${MUTED}` }} />
                    {c.name}{!has && ' · no results yet'}
                  </span>
                );
              })}
            </div>
          </>
        )}
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel
          icon={<BarChart3 className="w-4 h-4" />}
          title="Score distribution"
          subtitle="Students per grade band, from each student's latest result"
        >
          {data.distribution.every((d) => d.students === 0) ? (
            <Empty text="No evaluated results yet. Students appear here once their rounds are evaluated." />
          ) : (
            <div className="space-y-2.5">
              {data.distribution.map((d) => (
                <div key={d.class_id} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-3 text-[11.5px]">
                    <span className="text-[#0F172A] min-w-0 truncate font-medium">{d.name}</span>
                    <span className="shrink-0 font-mono text-[#64748B]">{d.students} student{d.students === 1 ? '' : 's'}</span>
                  </div>
                  {d.students === 0 ? (
                    <div className="h-6 flex items-center justify-center text-[11px] text-[#64748B] rounded-md border border-dashed border-[#E2E8F0]">
                      No results yet
                    </div>
                  ) : (
                    <div className="flex h-6 gap-0.5 rounded-md overflow-hidden">
                      {bandsAsc.filter((b) => d.counts[b.index] > 0).map((b) => {
                        const n = d.counts[b.index];
                        return (
                          <div
                            key={b.label}
                            className="flex items-center justify-center text-[11px] font-mono font-semibold text-white min-w-[18px]"
                            style={{ flexGrow: n, flexBasis: 0, background: BAND_COLORS[b.label] }}
                            title={`${d.name}: ${n} student${n === 1 ? '' : 's'} ${b.label} (${b.range}%), ${Math.round((n / d.students) * 100)}% of class`}
                          >
                            {n}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-[#64748B]">
                {bandsAsc.map((b) => (
                  <span key={b.label} className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: BAND_COLORS[b.label] }} />
                    {b.label} {b.range}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel
          icon={<Target className="w-4 h-4" />}
          title="Skill strengths and gaps"
          subtitle={`Department average per skill against the ${target}% target${data.skills.length > 8 ? ` · top 4 each of ${data.skills.length} skills` : ''}`}
        >
          {data.skills.length === 0 ? (
            <Empty text="No skill scores yet. These appear once rounds are evaluated." />
          ) : (
            <div className="space-y-2">
              {[
                { label: 'Strengths', hint: `at or above ${target}%`, rows: strengths },
                { label: 'Gaps', hint: `below ${target}%`, rows: gapsList },
              ].map((group) => (
                <div key={group.label} className="space-y-1.5">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#64748B]">
                    {group.label} <span className="normal-case tracking-normal font-normal">· {group.hint}</span>
                  </div>
                  {group.rows.length === 0 ? (
                    <div className="text-[11px] text-[#64748B]">None yet.</div>
                  ) : group.rows.map((s) => (
                    <div key={s.code} className="space-y-0.5" title={`${s.name}: ${s.avg}% average, ${s.students} student${s.students === 1 ? '' : 's'}`}>
                      <div className="flex items-baseline justify-between gap-3 text-[11.5px]">
                        <span className="text-[#0F172A] min-w-0 leading-snug font-medium">{s.name}</span>
                        <span className="shrink-0 font-mono text-[#0F172A]">
                          {s.avg}% <span className="text-[#64748B]">· {s.students} student{s.students === 1 ? '' : 's'}</span>
                        </span>
                      </div>
                      {/* 0-100% track; the dashed tick marks the target */}
                      <div className="relative h-1.5 rounded-full bg-[#F0F3F6] border border-[#E2E8F0]">
                        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(s.avg, 1.5)}%`, background: s.avg >= target ? ABOVE : BELOW }} />
                        <div className="absolute -top-1 -bottom-1 border-l border-dashed border-[#FF5500]" style={{ left: `${target}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div className="flex items-center gap-2 text-[10.5px] text-[#64748B]">
                <span className="inline-block h-3 border-l border-dashed border-[#FF5500]" /> {target}% target
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};
