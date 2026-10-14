import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea,
  LabelList
} from 'recharts';
import { TrendingUp, Repeat, Target } from 'lucide-react';
import apiClient from '../../api/client';

// Every score here is the latest published attempt per student and round (see the
// /dashboard/hod-analytics endpoint); earlier attempts are never averaged in.

interface TrendPoint { month: string; avg: number | null; results: number }
interface ClassTrend { id: number; name: string; code: string; trend: TrendPoint[] }
interface Reattempt { class_id: number; name: string; pairs: number; first_avg: number; latest_avg: number }
interface Skill { code: string; name: string; avg: number; students: number }
interface Analytics {
  months: string[];
  month_labels: string[];
  bands: { label: string; min: number }[];
  classes: ClassTrend[];
  reattempts: Reattempt[];
  skills: Skill[];
  skill_target: number;
}

// Class colours in a fixed order (validated for colour-blind separation on the card surface).
// Colour follows the class, never its rank.
const CLASS_COLORS = ['#3987e5', '#d95926', '#199e70', '#9085e9', '#c98500', '#d55181', '#008300', '#e66767'];
const ABOVE = '#3987e5';
const BELOW = '#ec835a';
const INK = '#F8F5ED';
const INK_2 = '#D8D2C5';
const MUTED = '#9E988A';
const GRID = '#2A2824';

const bandOf = (v: number, bands: Analytics['bands']) => bands.find((b) => v >= b.min)?.label ?? '';

const Panel: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode; className?: string }> = ({ icon, title, subtitle, children, className = '' }) => (
  <section className={`bg-[#1C1B18] border border-[#2A2824] rounded-2xl p-4 sm:p-5 space-y-3 min-w-0 ${className}`}>
    <div className="flex items-start gap-2.5">
      <div className="p-2 bg-[#24231F] rounded-lg text-[#C9A227] border border-[#2A2824] shrink-0">{icon}</div>
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-[#F8F5ED]">{title}</h3>
        <p className="text-[11px] text-[#9E988A]">{subtitle}</p>
      </div>
    </div>
    {children}
  </section>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="h-40 flex items-center justify-center text-center text-xs text-[#9E988A] bg-[#141311] rounded-xl border border-dashed border-[#2A2824] px-4">
    {text}
  </div>
);

const TipBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-[#141311] border border-[#2A2824] rounded-lg px-3 py-2 text-[11px] shadow-xl space-y-1">{children}</div>
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
  const trendRows = data.months.map((m, i) => {
    const row: Record<string, any> = { month: data.month_labels[i] };
    data.classes.forEach((c) => { row[`c${c.id}`] = c.trend[i]?.avg; row[`n${c.id}`] = c.trend[i]?.results; });
    return row;
  });
  const withResults = data.classes.filter((c) => c.trend.some((p) => p.avg != null));
  const bandTicks = data.bands.filter((b) => b.min > 0).map((b) => b.min);

  // ---- J. Reattempt gain ----
  const slopeRows = [
    { stage: 'First attempt', ...Object.fromEntries(data.reattempts.map((r) => [`c${r.class_id}`, r.first_avg])) },
    { stage: 'Latest attempt', ...Object.fromEntries(data.reattempts.map((r) => [`c${r.class_id}`, r.latest_avg])) },
  ];

  // ---- L. Skills: strongest and weakest against the target ----
  const target = data.skill_target;
  // skills arrive sorted strongest first
  const strengths = data.skills.filter((s) => s.avg >= target).slice(0, 4);
  const gapsList = data.skills.filter((s) => s.avg < target).slice(-4).reverse();

  return (
    <div className="space-y-4">
      <Panel
        icon={<TrendingUp className="w-4 h-4" />}
        title="Class performance by month"
        subtitle="Class average at the end of each month, from each student's latest result per round"
      >
        {withResults.length === 0 ? (
          <Empty text="No evaluated results for your department's classes this academic year yet." />
        ) : (
          <>
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendRows} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                  {data.bands.map((b, i) => i % 2 === 0 && (
                    <ReferenceArea key={b.label} y1={b.min} y2={i === 0 ? 100 : data.bands[i - 1].min} fill="#F8F5ED" fillOpacity={0.03} strokeOpacity={0} />
                  ))}
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, ...bandTicks, 100]}
                    tickFormatter={(v: number) => (v === 100 ? '' : `${bandOf(v + 0.1, data.bands)} ${v}`)}
                    tick={{ fill: MUTED, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={78}
                  />
                  <Tooltip
                    cursor={{ stroke: '#C9A227', strokeOpacity: 0.4 }}
                    content={({ active, payload, label }: any) => active && payload?.length ? (
                      <TipBox>
                        <div className="font-bold text-[#F8F5ED]">{label}</div>
                        {payload.filter((p: any) => p.value != null).map((p: any) => {
                          const id = Number(String(p.dataKey).slice(1));
                          const cls = data.classes.find((c) => c.id === id);
                          return (
                            <div key={p.dataKey} className="flex items-center gap-2 text-[#D8D2C5]">
                              <span className="w-2 h-2 rounded-full" style={{ background: p.stroke }} />
                              <span className="truncate max-w-[160px]">{cls?.name}</span>
                              <span className="ml-auto font-mono text-[#F8F5ED]">{p.value}%</span>
                              <span className="text-[#9E988A]">{bandOf(p.value, data.bands)} · {p.payload[`n${id}`]} results</span>
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
                      dot={{ r: 4, fill: color(c.id), stroke: '#1C1B18', strokeWidth: 2 }}
                      activeDot={{ r: 5, stroke: '#1C1B18', strokeWidth: 2 }}
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
                    className={`inline-flex items-center gap-1.5 ${has ? 'text-[#D8D2C5] cursor-default' : 'text-[#9E988A]'}`}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel
          icon={<Repeat className="w-4 h-4" />}
          title="Reattempt improvement"
          subtitle="Students who reattempted a round: first score against latest score, per class"
        >
          {data.reattempts.length === 0 ? (
            <Empty text="No reattempts yet. This fills in once students retake a round." />
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={slopeRows} margin={{ top: 12, right: 48, bottom: 0, left: 48 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="stage" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} padding={{ left: 10, right: 10 }} />
                    <YAxis domain={[0, 100]} ticks={[0, 40, 60, 75, 90, 100]} tick={{ fill: MUTED, fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip
                      cursor={{ stroke: '#C9A227', strokeOpacity: 0.4 }}
                      content={({ active, payload, label }: any) => active && payload?.length ? (
                        <TipBox>
                          <div className="font-bold text-[#F8F5ED]">{label}</div>
                          {payload.map((p: any) => {
                            const r = data.reattempts.find((x) => `c${x.class_id}` === p.dataKey);
                            return (
                              <div key={p.dataKey} className="flex items-center gap-2 text-[#D8D2C5]">
                                <span className="w-2 h-2 rounded-full" style={{ background: p.stroke }} />
                                <span className="truncate max-w-[160px]">{r?.name}</span>
                                <span className="ml-auto font-mono text-[#F8F5ED]">{p.value}%</span>
                              </div>
                            );
                          })}
                        </TipBox>
                      ) : null}
                    />
                    {data.reattempts.map((r) => (
                      <Line key={r.class_id} dataKey={`c${r.class_id}`} stroke={color(r.class_id)} strokeWidth={2}
                        dot={{ r: 4, fill: color(r.class_id), stroke: '#1C1B18', strokeWidth: 2 }} isAnimationActive={false}>
                        <LabelList dataKey={`c${r.class_id}`} position="right" formatter={(v: any) => `${v}%`} style={{ fill: INK_2, fontSize: 10 }} />
                      </Line>
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {data.reattempts.map((r) => {
                  const gain = Math.round((r.latest_avg - r.first_avg) * 10) / 10;
                  return (
                    <div key={r.class_id} className="flex items-center gap-2 text-[11px] text-[#D8D2C5]">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color(r.class_id) }} />
                      <span className="truncate">{r.name}</span>
                      <span className="ml-auto font-mono" style={{ color: INK }}>{gain > 0 ? '+' : ''}{gain} pts</span>
                      <span className="text-[#9E988A] shrink-0">{r.pairs} reattempt{r.pairs === 1 ? '' : 's'}</span>
                    </div>
                  );
                })}
              </div>
            </>
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
            <div className="space-y-4">
              {[
                { label: 'Strengths', hint: `at or above ${target}%`, rows: strengths },
                { label: 'Gaps', hint: `below ${target}%`, rows: gapsList },
              ].map((group) => (
                <div key={group.label} className="space-y-2">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#9E988A]">
                    {group.label} <span className="normal-case tracking-normal font-normal">· {group.hint}</span>
                  </div>
                  {group.rows.length === 0 ? (
                    <div className="text-[11px] text-[#9E988A]">None yet.</div>
                  ) : group.rows.map((s) => (
                    <div key={s.code} className="space-y-1" title={`${s.name}: ${s.avg}% average, ${s.students} student${s.students === 1 ? '' : 's'}`}>
                      <div className="flex items-baseline justify-between gap-3 text-[11.5px]">
                        <span className="text-[#D8D2C5] min-w-0 leading-snug">{s.name}</span>
                        <span className="shrink-0 font-mono text-[#F8F5ED]">
                          {s.avg}% <span className="text-[#9E988A]">· {s.students} student{s.students === 1 ? '' : 's'}</span>
                        </span>
                      </div>
                      {/* 0-100% track; the dashed tick marks the target */}
                      <div className="relative h-2 rounded-full bg-[#141311] border border-[#2A2824]">
                        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(s.avg, 1.5)}%`, background: s.avg >= target ? ABOVE : BELOW }} />
                        <div className="absolute -top-1 -bottom-1 border-l border-dashed border-[#C9A227]" style={{ left: `${target}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div className="flex items-center gap-2 text-[10.5px] text-[#9E988A]">
                <span className="inline-block h-3 border-l border-dashed border-[#C9A227]" /> {target}% target
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};
