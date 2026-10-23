import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  Calendar,
  Zap,
  TrendingDown,
  Info,
  Clock,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { WolSchedule, Weekday } from '../types';
import { triggerHapticFeedback } from '../services/hapticService';

interface WolEnergyWeeklyChartProps {
  schedules?: WolSchedule[];
  hostCount?: number;
  activeHoursPerDay?: number;
  daysPerWeek?: number;
  activeWatts?: number;
  standbyWatts?: number;
  kwhRate?: number;
  currencySymbol?: string;
}

interface DayDataPoint {
  dayKey: Weekday;
  dayShort: string;
  dayFull: string;
  isScheduled: boolean;
  scheduledEvents: string[];
  activeHours: number;
  standbyHours: number;
  baselineKwh: number;
  scheduledKwh: number;
  savedKwh: number;
  percentSaved: number;
  baselineCost: number;
  scheduledCost: number;
  savedCost: number;
}

const WEEKDAY_DEFS: { key: Weekday; short: string; full: string }[] = [
  { key: 'mon', short: 'Пон', full: 'Понеделник (Mon)' },
  { key: 'tue', short: 'Вто', full: 'Вторник (Tue)' },
  { key: 'wed', short: 'Сря', full: 'Сряда (Wed)' },
  { key: 'thu', short: 'Чет', full: 'Четвъртък (Thu)' },
  { key: 'fri', short: 'Пет', full: 'Петък (Fri)' },
  { key: 'sat', short: 'Съб', full: 'Събота (Sat)' },
  { key: 'sun', short: 'Нед', full: 'Неделя (Sun)' }
];

export const WolEnergyWeeklyChart: React.FC<WolEnergyWeeklyChartProps> = ({
  schedules = [],
  hostCount = 15,
  activeHoursPerDay,
  daysPerWeek,
  activeWatts = 115,
  standbyWatts = 1.8,
  kwhRate = 0.28,
  currencySymbol = 'лв.'
}) => {
  const initialScheduledHours = activeHoursPerDay ?? 8;
  const [scheduledDayActiveHours, setScheduledDayActiveHours] = useState<number>(initialScheduledHours);
  const [activeMetricView, setActiveMetricView] = useState<'kwh' | 'cost'>('kwh');

  useEffect(() => {
    if (typeof activeHoursPerDay === 'number' && Number.isFinite(activeHoursPerDay)) {
      setScheduledDayActiveHours(activeHoursPerDay);
    }
  }, [activeHoursPerDay]);

  const effectiveActiveHoursPerDay = activeHoursPerDay ?? scheduledDayActiveHours;
  const effectiveDaysPerWeek = daysPerWeek ?? 5;

  // Compute daily data points based on saved WoL schedules
  const weeklyData = useMemo(() => {
    const enabledSchedules = schedules.filter(s => s.enabled);

    return WEEKDAY_DEFS.map(dayDef => {
      // Check which schedules match this day
      const matchingSchedules = enabledSchedules.filter(s =>
        s.days && s.days.includes(dayDef.key)
      );

      const isScheduled = matchingSchedules.length > 0;
      const scheduledEvents = matchingSchedules.map(s => `${s.name} (${s.time})`);

      // Active vs Standby hours for this 24-hour day
      const activeHours = isScheduled ? effectiveActiveHoursPerDay : 0;
      const standbyHours = Math.max(0, 24 - activeHours);

      // Baseline: Running 24 hours constantly at active idle wattage (no WoL)
      const baselineKwh = (hostCount * activeWatts * 24) / 1000;

      // Scheduled WoL: Active during scheduled hours + ultra-low Standby sleep during the rest
      const scheduledKwh =
        (hostCount * activeWatts * activeHours + hostCount * standbyWatts * standbyHours) /
        1000;

      const savedKwh = Math.max(0, baselineKwh - scheduledKwh);
      const percentSaved = baselineKwh > 0 ? (savedKwh / baselineKwh) * 100 : 0;

      const baselineCost = baselineKwh * kwhRate;
      const scheduledCost = scheduledKwh * kwhRate;
      const savedCost = savedKwh * kwhRate;

      return {
        dayKey: dayDef.key,
        dayShort: dayDef.short,
        dayFull: dayDef.full,
        isScheduled,
        scheduledEvents,
        activeHours,
        standbyHours,
        baselineKwh: Number(baselineKwh.toFixed(2)),
        scheduledKwh: Number(scheduledKwh.toFixed(2)),
        savedKwh: Number(savedKwh.toFixed(2)),
        percentSaved: Number(percentSaved.toFixed(1)),
        baselineCost: Number(baselineCost.toFixed(2)),
        scheduledCost: Number(scheduledCost.toFixed(2)),
        savedCost: Number(savedCost.toFixed(2))
      } as DayDataPoint;
    });
  }, [schedules, hostCount, activeWatts, standbyWatts, kwhRate, effectiveActiveHoursPerDay, effectiveDaysPerWeek]);

  // Aggregate weekly totals
  const weeklyTotals = useMemo(() => {
    let totalBaselineKwh = 0;
    let totalScheduledKwh = 0;
    let totalSavedKwh = 0;
    let totalBaselineCost = 0;
    let totalScheduledCost = 0;
    let totalSavedCost = 0;
    let totalScheduledDays = 0;

    weeklyData.forEach(d => {
      totalBaselineKwh += d.baselineKwh;
      totalScheduledKwh += d.scheduledKwh;
      totalSavedKwh += d.savedKwh;
      totalBaselineCost += d.baselineCost;
      totalScheduledCost += d.scheduledCost;
      totalSavedCost += d.savedCost;
      if (d.isScheduled) totalScheduledDays += 1;
    });

    const overallPercentSaved =
      totalBaselineKwh > 0 ? ((totalSavedKwh / totalBaselineKwh) * 100).toFixed(1) : '0';

    return {
      totalBaselineKwh: totalBaselineKwh.toFixed(1),
      totalScheduledKwh: totalScheduledKwh.toFixed(1),
      totalSavedKwh: totalSavedKwh.toFixed(1),
      totalBaselineCost: totalBaselineCost.toFixed(2),
      totalScheduledCost: totalScheduledCost.toFixed(2),
      totalSavedCost: totalSavedCost.toFixed(2),
      totalScheduledDays,
      overallPercentSaved
    };
  }, [weeklyData]);

  // Custom Dark Cyberpunk Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayDataPoint = payload[0].payload;
      return (
        <div className="bg-[#0A1628]/95 border border-cyan-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-sans max-w-xs z-50">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5 mb-2">
            <span className="font-bold text-white font-display text-sm">{data.dayFull}</span>
            {data.isScheduled ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                WOL АКТИВЕН
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                24ч В STANDBY
              </span>
            )}
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/80 inline-block" />
                Базов 24/7 Idle:
              </span>
              <span className="font-bold">
                {data.baselineKwh} kWh ({data.baselineCost} {currencySymbol})
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" />
                WoL График ({data.activeHours}ч активност):
              </span>
              <span className="font-bold text-cyan-300">
                {data.scheduledKwh} kWh ({data.scheduledCost} {currencySymbol})
              </span>
            </div>

            <div className="border-t border-slate-700/60 pt-1.5 mt-1 flex justify-between items-center text-emerald-400 font-bold">
              <span>Спестена Енергия:</span>
              <span>
                +{data.savedKwh} kWh (-{data.percentSaved}%)
              </span>
            </div>
          </div>

          {data.scheduledEvents.length > 0 && (
            <div className="mt-2 pt-1.5 border-t border-cyan-500/10 text-[10px] text-slate-400">
              <span className="text-slate-500 font-mono">Графици: </span>
              {data.scheduledEvents.join(', ')}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full rounded-2xl bg-[#06101D] border border-cyan-500/20 p-4 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/10 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider">
              Седмично Сравнение на Енергията (Weekly Recharts Analysis)
            </h4>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-bold">
              {weeklyTotals.totalScheduledDays} ДНИ С ГРАФИК
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Консумация по дни от седмицата на база запазените Wake-on-LAN графици ({hostCount} компютъра @ {activeWatts}W)
          </p>
        </div>

        {/* Metric Switcher (kWh vs Currency) */}
        <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
          <div className="flex bg-[#0A1628] border border-cyan-500/30 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('light');
                setActiveMetricView('kwh');
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition ${
                activeMetricView === 'kwh'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Енергия (kWh)
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHapticFeedback('light');
                setActiveMetricView('cost');
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition ${
                activeMetricView === 'cost'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Стойност ({currencySymbol})
            </button>
          </div>
        </div>
      </div>

      {/* Weekly KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-[#0A1628]/80 border border-slate-800 rounded-xl p-2.5">
          <div className="text-[10px] text-slate-400 font-mono uppercase">Базова консумация 24/7</div>
          <div className="text-base font-bold text-rose-400 font-mono mt-0.5">
            {activeMetricView === 'kwh'
              ? `${weeklyTotals.totalBaselineKwh} kWh`
              : `${weeklyTotals.totalBaselineCost} ${currencySymbol}`}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">168 часа непрекъснат ход</div>
        </div>

        <div className="bg-[#0A1628]/80 border border-cyan-500/30 rounded-xl p-2.5">
          <div className="text-[10px] text-cyan-400 font-mono uppercase">WoL График Енергия</div>
          <div className="text-base font-bold text-cyan-300 font-mono mt-0.5">
            {activeMetricView === 'kwh'
              ? `${weeklyTotals.totalScheduledKwh} kWh`
              : `${weeklyTotals.totalScheduledCost} ${currencySymbol}`}
          </div>
          <div className="text-[10px] text-cyan-400/70 font-mono">
            {weeklyTotals.totalScheduledDays} дни активни + Standby
          </div>
        </div>

        <div className="bg-[#0A1628]/80 border border-emerald-500/30 rounded-xl p-2.5">
          <div className="text-[10px] text-emerald-400 font-mono uppercase">Седмично спестени</div>
          <div className="text-base font-bold text-emerald-300 font-mono mt-0.5">
            {activeMetricView === 'kwh'
              ? `-${weeklyTotals.totalSavedKwh} kWh`
              : `-${weeklyTotals.totalSavedCost} ${currencySymbol}`}
          </div>
          <div className="text-[10px] text-emerald-400/80 font-mono">
            -{weeklyTotals.overallPercentSaved}% редукция
          </div>
        </div>

        <div className="bg-[#0A1628]/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono uppercase">
            <span>Активни часове/ден:</span>
            <span className="text-amber-300 font-bold">{scheduledDayActiveHours}ч</span>
          </div>
          <input
            type="range"
            min={2}
            max={18}
            step={1}
            value={scheduledDayActiveHours}
            onChange={e => setScheduledDayActiveHours(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 mt-1"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
            <span>4ч</span>
            <span>8ч (Лаборатория)</span>
            <span>16ч</span>
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart Container */}
      <div className="w-full h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={weeklyData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1E293B"
              vertical={false}
            />
            <XAxis
              dataKey="dayShort"
              stroke="#64748B"
              tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748B"
              tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#334155' }}
              unit={activeMetricView === 'kwh' ? 'k' : currencySymbol}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 8, fontSize: 11, fontFamily: 'monospace' }}
              formatter={(value: string) => {
                if (value === 'baselineVal') return 'Базов 24/7 Idle';
                if (value === 'scheduledVal') return 'Scheduled WoL Мощност';
                return value;
              }}
            />
            <Bar
              name="baselineVal"
              dataKey={activeMetricView === 'kwh' ? 'baselineKwh' : 'baselineCost'}
              fill="#F43F5E"
              opacity={0.4}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              name="scheduledVal"
              dataKey={activeMetricView === 'kwh' ? 'scheduledKwh' : 'scheduledCost'}
              fill="#00F0FF"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Dynamic Schedule Badges / Status */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800">
        <span className="text-[10px] text-slate-500 font-mono uppercase mr-1">Статус на дните:</span>
        {weeklyData.map(d => (
          <span
            key={d.dayKey}
            className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border ${
              d.isScheduled
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={d.scheduledEvents.join(', ') || 'Няма насрочено събуждане'}
          >
            {d.isScheduled && <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400" />}
            {d.dayShort}: {d.isScheduled ? `${d.activeHours}ч активен` : 'Standby'}
          </span>
        ))}
      </div>
    </div>
  );
};
