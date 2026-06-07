"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { ArrowUpDown, Hash, CheckSquare, XCircle, Cpu, TrendingUp, TrendingDown, Star, ShieldAlert, Zap } from "lucide-react"

interface AnalysisResult {
  digitFrequencies?: Record<number, { count: number; percentage: number }>
  powerIndex?: { strongest: number; weakest: number }
}

interface StatisticalAnalysisProps {
  analysis: AnalysisResult
  recentDigits: number[]
  theme?: "light" | "dark"
}

// Animated number counter
function LiveNumber({ value, decimals = 1 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    if (value === prev.current) return
    const start = prev.current
    const diff = value - start
    const startTime = Date.now()
    const dur = 500

    const tick = () => {
      const elapsed = Math.min((Date.now() - startTime) / dur, 1)
      const eased = 1 - Math.pow(1 - elapsed, 3)
      setDisplay(start + diff * eased)
      if (elapsed < 1) requestAnimationFrame(tick)
      else { prev.current = value; setDisplay(value) }
    }
    requestAnimationFrame(tick)
  }, [value])

  return <>{display.toFixed(decimals)}</>
}

// Animated progress bar
function LiveBar({ pct, colorClass, glowColor }: { pct: number; colorClass: string; glowColor: string }) {
  return (
    <div className="h-3 w-full rounded-full bg-white/5 border border-white/5 overflow-hidden p-px">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
        style={{ width: `${Math.min(100, pct)}%`, boxShadow: `0 0 10px ${glowColor}` }}
      />
    </div>
  )
}

const STRATEGIES = [
  { id: "over-under",  label: "Over/Under",  shortLabel: "O/U",  icon: ArrowUpDown,  activeClass: "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25" },
  { id: "even-odd",    label: "Even/Odd",    shortLabel: "E/O",  icon: Hash,          activeClass: "bg-cyan-600 text-white shadow-lg shadow-cyan-600/25" },
  { id: "matches",     label: "Matches",     shortLabel: "MTH",  icon: CheckSquare,   activeClass: "bg-violet-600 text-white shadow-lg shadow-violet-600/25" },
  { id: "differs",     label: "Differs",     shortLabel: "DIF",  icon: XCircle,       activeClass: "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" },
]

export function StatisticalAnalysis({ analysis, recentDigits, theme = "dark" }: StatisticalAnalysisProps) {
  const [activeStrategy, setActiveStrategy] = useState("over-under")
  const [tick, setTick] = useState(0)

  // Live pulse every 1.5 s to simulate "live" feel
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1500)
    return () => clearInterval(t)
  }, [])

  /* ── Per-digit frequencies ── */
  const digitFrequencies = useMemo(() => {
    const counts = Array.from({ length: 10 }, () => 0)
    recentDigits.forEach(d => { if (d >= 0 && d <= 9) counts[d]++ })
    const total = recentDigits.length || 1
    return counts.map((count, digit) => ({ digit, count, percentage: (count / total) * 100 }))
  }, [recentDigits])

  /* ── Over/Under ── */
  const overUnderStats = useMemo(() => {
    const under = digitFrequencies.filter(f => f.digit <= 4)
    const over  = digitFrequencies.filter(f => f.digit >= 5)
    const totalUnder = under.reduce((s, f) => s + f.percentage, 0)
    const totalOver  = over.reduce((s, f) => s + f.percentage, 0)
    const highUnder  = [...under].sort((a, b) => b.count - a.count)[0]
    const highOver   = [...over].sort((a, b) => b.count - a.count)[0]
    return {
      underPct: totalUnder, overPct: totalOver,
      bestUnderDigit: highUnder?.digit ?? 0, bestUnderPct: highUnder?.percentage ?? 0,
      bestOverDigit: highOver?.digit ?? 5,   bestOverPct:  highOver?.percentage ?? 0,
      underDigits: under, overDigits: over,
    }
  }, [digitFrequencies])

  /* ── Even/Odd ── */
  const evenOddStats = useMemo(() => {
    const even = digitFrequencies.filter(f => f.digit % 2 === 0)
    const odd  = digitFrequencies.filter(f => f.digit % 2 !== 0)
    const totalEven = even.reduce((s, f) => s + f.percentage, 0)
    const totalOdd  = odd.reduce((s, f) => s + f.percentage, 0)
    const highEven  = [...even].sort((a, b) => b.count - a.count)[0]
    const highOdd   = [...odd].sort((a, b) => b.count - a.count)[0]
    return {
      evenPct: totalEven, oddPct: totalOdd,
      bestEvenDigit: highEven?.digit ?? 0, bestEvenPct: highEven?.percentage ?? 0,
      bestOddDigit: highOdd?.digit ?? 1,   bestOddPct:  highOdd?.percentage ?? 0,
    }
  }, [digitFrequencies])

  /* ── Matches ── */
  const matchesStats = useMemo(() => {
    const sorted = [...digitFrequencies].sort((a, b) => b.count - a.count)
    return { bestDigit: sorted[0]?.digit ?? 0, bestPct: sorted[0]?.percentage ?? 0, sorted }
  }, [digitFrequencies])

  /* ── Differs ── */
  const differsStats = useMemo(() => {
    const sorted = [...digitFrequencies].sort((a, b) => a.count - b.count)
    return { safestDigit: sorted[0]?.digit ?? 0, safetyPct: 100 - (sorted[0]?.percentage ?? 0), sorted }
  }, [digitFrequencies])

  const activeDef = STRATEGIES.find(s => s.id === activeStrategy)!

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <Cpu className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              Quantum Statistics
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </h3>
            <p className="text-[10px] text-white/30 font-bold mt-0.5">
              Real-time distribution · <span className="text-indigo-400">{recentDigits.length}</span> digits sampled
            </p>
          </div>
        </div>

        {/* Strategy selector */}
        <div className="flex gap-1 p-1 bg-black/40 rounded-xl border border-white/[0.06]">
          {STRATEGIES.map(s => {
            const Icon = s.icon
            const isActive = activeStrategy === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActiveStrategy(s.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 transition-all duration-200 ${
                  isActive ? s.activeClass : "text-white/40 hover:text-white/70 hover:bg-white/5"
                }`}
              >
                <Icon className="h-3 w-3 shrink-0" />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.shortLabel}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content panels ── */}
      <div className="min-h-[260px]">

        {/* OVER / UNDER */}
        {activeStrategy === "over-under" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Dual gauge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Under card */}
              <div className="group relative rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-5 overflow-hidden transition-all hover:border-emerald-500/30">
                <div className="absolute top-0 right-0 p-3 opacity-5 rotate-12 scale-150"><TrendingDown className="h-12 w-12 text-emerald-400" /></div>
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-emerald-400/60 uppercase tracking-widest">Under</p>
                      <p className="text-xs font-bold text-white/30">Digits 0 – 4</p>
                    </div>
                    <span className="text-3xl font-black text-emerald-400 tabular-nums font-mono">
                      <LiveNumber value={overUnderStats.underPct} />%
                    </span>
                  </div>
                  <LiveBar pct={overUnderStats.underPct} colorClass="bg-gradient-to-r from-emerald-600 to-teal-400" glowColor="rgba(16,185,129,0.4)" />
                  {/* Per-digit mini bars */}
                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {overUnderStats.underDigits.map(d => (
                      <div key={d.digit} className="flex flex-col items-center gap-1">
                        <div className="w-full h-8 bg-white/5 rounded-md overflow-hidden flex items-end">
                          <div
                            className="w-full bg-emerald-500/60 rounded-md transition-all duration-700"
                            style={{ height: `${d.percentage * 1.8}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-black text-white/50">{d.digit}</span>
                        <span className="text-[8px] text-emerald-400/70 font-mono">{d.percentage.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                  {/* Best */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Hottest digit</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-black text-white tabular-nums">{overUnderStats.bestUnderDigit}</span>
                      <span className="text-[9px] font-mono text-emerald-400">{overUnderStats.bestUnderPct.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Over card */}
              <div className="group relative rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.03] p-5 overflow-hidden transition-all hover:border-indigo-500/30">
                <div className="absolute top-0 right-0 p-3 opacity-5 rotate-12 scale-150"><TrendingUp className="h-12 w-12 text-indigo-400" /></div>
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest">Over</p>
                      <p className="text-xs font-bold text-white/30">Digits 5 – 9</p>
                    </div>
                    <span className="text-3xl font-black text-indigo-400 tabular-nums font-mono">
                      <LiveNumber value={overUnderStats.overPct} />%
                    </span>
                  </div>
                  <LiveBar pct={overUnderStats.overPct} colorClass="bg-gradient-to-r from-indigo-500 to-cyan-400" glowColor="rgba(99,102,241,0.4)" />
                  {/* Per-digit mini bars */}
                  <div className="grid grid-cols-5 gap-1 pt-1">
                    {overUnderStats.overDigits.map(d => (
                      <div key={d.digit} className="flex flex-col items-center gap-1">
                        <div className="w-full h-8 bg-white/5 rounded-md overflow-hidden flex items-end">
                          <div
                            className="w-full bg-indigo-500/60 rounded-md transition-all duration-700"
                            style={{ height: `${d.percentage * 1.8}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-black text-white/50">{d.digit}</span>
                        <span className="text-[8px] text-indigo-400/70 font-mono">{d.percentage.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                  {/* Best */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Hottest digit</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-black text-white tabular-nums">{overUnderStats.bestOverDigit}</span>
                      <span className="text-[9px] font-mono text-indigo-400">{overUnderStats.bestOverPct.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Signal bar */}
            <div className={`flex items-center justify-between px-5 py-3 rounded-xl border ${
              overUnderStats.underPct > overUnderStats.overPct
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-indigo-500/5 border-indigo-500/20"
            }`}>
              <div className="flex items-center gap-2">
                <Zap className={`h-4 w-4 ${overUnderStats.underPct > overUnderStats.overPct ? "text-emerald-400" : "text-indigo-400"}`} />
                <span className="text-xs font-black text-white uppercase tracking-widest">Signal</span>
              </div>
              <span className={`text-sm font-black uppercase tracking-widest ${
                overUnderStats.underPct > overUnderStats.overPct ? "text-emerald-400" : "text-indigo-400"
              }`}>
                {overUnderStats.underPct > overUnderStats.overPct ? "UNDER BIAS" : "OVER BIAS"}
                <span className="ml-2 text-[10px] font-mono opacity-60">
                  +{Math.abs(overUnderStats.underPct - overUnderStats.overPct).toFixed(1)}%
                </span>
              </span>
            </div>
          </div>
        )}

        {/* EVEN / ODD */}
        {activeStrategy === "even-odd" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Even */}
              <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.03] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-cyan-400/60 uppercase tracking-widest">Even</p>
                    <p className="text-xs font-bold text-white/30">0, 2, 4, 6, 8</p>
                  </div>
                  <span className="text-3xl font-black text-cyan-400 tabular-nums font-mono">
                    <LiveNumber value={evenOddStats.evenPct} />%
                  </span>
                </div>
                <LiveBar pct={evenOddStats.evenPct} colorClass="bg-gradient-to-r from-cyan-500 to-blue-400" glowColor="rgba(6,182,212,0.4)" />
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Top digit</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-white">{evenOddStats.bestEvenDigit}</span>
                    <span className="text-[9px] font-mono text-cyan-400">{evenOddStats.bestEvenPct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              {/* Odd */}
              <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.03] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-violet-400/60 uppercase tracking-widest">Odd</p>
                    <p className="text-xs font-bold text-white/30">1, 3, 5, 7, 9</p>
                  </div>
                  <span className="text-3xl font-black text-violet-400 tabular-nums font-mono">
                    <LiveNumber value={evenOddStats.oddPct} />%
                  </span>
                </div>
                <LiveBar pct={evenOddStats.oddPct} colorClass="bg-gradient-to-r from-violet-500 to-pink-400" glowColor="rgba(139,92,246,0.4)" />
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Top digit</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-white">{evenOddStats.bestOddDigit}</span>
                    <span className="text-[9px] font-mono text-violet-400">{evenOddStats.bestOddPct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={`flex items-center justify-between px-5 py-3 rounded-xl border ${
              evenOddStats.evenPct > evenOddStats.oddPct ? "bg-cyan-500/5 border-cyan-500/20" : "bg-violet-500/5 border-violet-500/20"
            }`}>
              <div className="flex items-center gap-2">
                <Zap className={`h-4 w-4 ${evenOddStats.evenPct > evenOddStats.oddPct ? "text-cyan-400" : "text-violet-400"}`} />
                <span className="text-xs font-black text-white uppercase tracking-widest">Signal</span>
              </div>
              <span className={`text-sm font-black uppercase tracking-widest ${evenOddStats.evenPct > evenOddStats.oddPct ? "text-cyan-400" : "text-violet-400"}`}>
                {evenOddStats.evenPct > evenOddStats.oddPct ? "EVEN BIAS" : "ODD BIAS"}
                <span className="ml-2 text-[10px] font-mono opacity-60">
                  +{Math.abs(evenOddStats.evenPct - evenOddStats.oddPct).toFixed(1)}%
                </span>
              </span>
            </div>
          </div>
        )}

        {/* MATCHES */}
        {activeStrategy === "matches" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Digit frequency grid */}
            <div className="grid grid-cols-10 gap-1.5">
              {matchesStats.sorted.map((f, rank) => {
                const isBest = f.digit === matchesStats.bestDigit
                const barH = Math.max(8, (f.percentage / Math.max(...matchesStats.sorted.map(d => d.percentage))) * 60)
                return (
                  <div key={f.digit} className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                    isBest
                      ? "bg-violet-500/10 border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                      : "bg-white/[0.02] border-white/[0.06]"
                  }`}>
                    {/* Bar */}
                    <div className="w-full flex items-end justify-center" style={{ height: "56px" }}>
                      <div
                        className={`w-3/4 rounded-sm transition-all duration-700 ${isBest ? "bg-violet-500" : "bg-white/20"}`}
                        style={{ height: `${barH}px`, boxShadow: isBest ? "0 0 8px rgba(139,92,246,0.6)" : "none" }}
                      />
                    </div>
                    <span className={`text-sm font-black tabular-nums ${isBest ? "text-violet-300" : "text-white/70"}`}>{f.digit}</span>
                    <span className="text-[8px] font-mono text-white/30">{f.percentage.toFixed(0)}%</span>
                    {isBest && <span className="text-[7px] font-black text-violet-400 uppercase">TOP</span>}
                  </div>
                )
              })}
            </div>
            {/* Recommendation */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-violet-500/[0.04] border border-violet-500/15">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Star className="h-6 w-6 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest mb-0.5">Best Match Target</p>
                <p className="text-xl font-black text-white">Digit <span className="text-violet-400">{matchesStats.bestDigit}</span></p>
                <p className="text-[10px] text-white/30 mt-0.5">Highest frequency — {matchesStats.bestPct.toFixed(1)}% occurrence in last {recentDigits.length} digits</p>
              </div>
            </div>
          </div>
        )}

        {/* DIFFERS */}
        {activeStrategy === "differs" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Safety grid */}
            <div className="grid grid-cols-10 gap-1.5">
              {differsStats.sorted.map(f => {
                const safety = 100 - f.percentage
                const isSafest = f.digit === differsStats.safestDigit
                const barH = Math.max(8, (safety / 100) * 60)
                return (
                  <div key={f.digit} className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                    isSafest
                      ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                      : "bg-white/[0.02] border-white/[0.06]"
                  }`}>
                    <div className="w-full flex items-end justify-center" style={{ height: "56px" }}>
                      <div
                        className={`w-3/4 rounded-sm transition-all duration-700 ${isSafest ? "bg-emerald-500" : "bg-white/20"}`}
                        style={{ height: `${barH}px`, boxShadow: isSafest ? "0 0 8px rgba(16,185,129,0.6)" : "none" }}
                      />
                    </div>
                    <span className={`text-sm font-black tabular-nums ${isSafest ? "text-emerald-300" : "text-white/70"}`}>{f.digit}</span>
                    <span className="text-[8px] font-mono text-white/30">{safety.toFixed(0)}%</span>
                    {isSafest && <span className="text-[7px] font-black text-emerald-400 uppercase">SAFE</span>}
                  </div>
                )
              })}
            </div>
            {/* Recommendation */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/15">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Safest Differs Target</p>
                <p className="text-xl font-black text-white">Digit <span className="text-emerald-400">{differsStats.safestDigit}</span></p>
                <p className="text-[10px] text-white/30 mt-0.5">Lowest frequency — {differsStats.safetyPct.toFixed(1)}% safety threshold in last {recentDigits.length} digits</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
