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
    <div className="h-3.5 w-full rounded-full bg-gradient-to-r from-white/5 to-white/[0.02] dark:from-white/10 dark:to-white/5 border border-white/10 dark:border-white/20 overflow-hidden p-px backdrop-blur-sm">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass} shadow-lg`}
        style={{ width: `${Math.min(100, pct)}%`, boxShadow: `0 0 15px ${glowColor}, inset 0 0 8px ${glowColor}40` }}
      />
    </div>
  )
}

const STRATEGIES = [
  { id: "all",         label: "All Stats",   shortLabel: "ALL",  icon: Cpu,           activeClass: "bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/25" },
  { id: "matches",     label: "Matches",     shortLabel: "MTH",  icon: CheckSquare,   activeClass: "bg-[#00D4AA] text-white shadow-lg shadow-[#00D4AA]/25" },
  { id: "differs",     label: "Differs",     shortLabel: "DIF",  icon: XCircle,       activeClass: "bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/25" },
]

export function StatisticalAnalysis({ analysis, recentDigits, theme = "dark" }: StatisticalAnalysisProps) {
  const [activeStrategy, setActiveStrategy] = useState("all")
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

  // Color theme variables
  const isDark = theme === "dark"
  const textTitleClass = isDark ? "text-white" : "text-[#1A1A1A]"
  const textSubClass = isDark ? "text-gray-400" : "text-gray-600"
  const bgCardClass = isDark ? "bg-[#1A1A1A]/80 border-gray-800" : "bg-[#F5F5F5] border-gray-200"

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${isDark 
        ? "bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-blue-600/10 border-blue-400/30 shadow-lg shadow-blue-500/10" 
        : "bg-gradient-to-r from-blue-50/50 via-white to-purple-50/50 border-blue-200/50 shadow-sm"}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl backdrop-blur-md transition-all duration-300 ${isDark
            ? "bg-gradient-to-br from-blue-500/30 to-purple-500/20 border border-blue-400/50 shadow-lg shadow-blue-500/20"
            : "bg-gradient-to-br from-blue-100/50 to-purple-100/50 border border-blue-200/50"}`}>
            <Cpu className={`h-6 w-6 ${isDark ? "text-blue-300" : "text-blue-600"}`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-black uppercase tracking-tight flex items-center gap-2 ${textTitleClass}`}>
              Quantum Statistics
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isDark
                ? "bg-gradient-to-r from-emerald-500/30 to-emerald-500/20 border border-emerald-400/50 text-emerald-300 shadow-lg shadow-emerald-500/20"
                : "bg-gradient-to-r from-emerald-100/50 to-emerald-100/30 border border-emerald-300/50 text-emerald-700"}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </h3>
            <p className={`text-[11px] font-semibold mt-1 ${textSubClass}`}>
              Real-time distribution · <span className="text-blue-400 font-bold">{recentDigits.length}</span> digits analyzed
            </p>
          </div>
        </div>

        {/* Strategy selector */}
        <div className={`flex gap-1.5 p-1.5 rounded-xl border backdrop-blur-md transition-all ${isDark 
          ? "bg-black/30 border-white/10 shadow-lg shadow-black/20" 
          : "bg-white/40 border-white/60 shadow-sm"}`}>
          {STRATEGIES.map(s => {
            const Icon = s.icon
            const isActive = activeStrategy === s.id
            return (
              <button
                key={s.id}
                onClick={() => setActiveStrategy(s.id)}
                className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 transition-all duration-300 backdrop-blur-sm ${
                  isActive 
                    ? `${s.activeClass} scale-105 shadow-xl` 
                    : isDark 
                      ? "text-white/50 hover:text-white/80 hover:bg-white/10" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.shortLabel}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content panels ── */}
      <div className="min-h-[260px]">

        {/* ALL STATS - Over/Under + Even/Odd Unified View */}
        {activeStrategy === "all" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* OVER / UNDER SECTION */}
            <div className="space-y-3">
              <h3 className={`text-sm font-black uppercase tracking-widest px-6 ${textSubClass}`}>Over / Under Distribution</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Under card */}
                <div className={`relative overflow-hidden group p-6 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${isDark
                  ? "bg-gradient-to-br from-emerald-600/15 via-black/40 to-black/30 border-emerald-400/30 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:border-emerald-400/50"
                  : "bg-gradient-to-br from-emerald-50/60 via-white/40 to-white/30 border-emerald-200/50 shadow-sm hover:shadow-md"}`}>
                  <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-15 transition-opacity">
                    <TrendingDown className="h-24 w-24 text-[#00D4AA] -rotate-12" />
                  </div>
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-lg font-bold text-[#00D4AA] mb-1">Under (0-4)</div>
                      </div>
                      <span className="text-4xl font-black tabular-nums font-mono text-[#00D4AA]">
                        <LiveNumber value={overUnderStats.underPct} />%
                      </span>
                    </div>
                    <LiveBar pct={overUnderStats.underPct} colorClass="bg-[#00D4AA]" glowColor="rgba(0,212,170,0.4)" />
                    
                    {/* Per-digit mini bars */}
                    <div className="grid grid-cols-5 gap-1 pt-1">
                      {overUnderStats.underDigits.map(d => (
                        <div key={d.digit} className="flex flex-col items-center gap-1">
                          <div className={`w-full h-8 rounded-md overflow-hidden flex items-end ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                            <div
                              className="w-full bg-[#00D4AA]/70 rounded-md transition-all duration-700"
                              style={{ height: `${d.percentage * 1.8}%` }}
                            />
                          </div>
                          <span className={`text-[9px] font-black ${isDark ? "text-white/50" : "text-gray-500"}`}>{d.digit}</span>
                          <span className="text-[8px] text-[#00D4AA] font-mono font-bold">{d.percentage.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                    {/* Best */}
                    <div className={`flex items-center justify-between pt-1 border-t ${isDark ? "border-white/5" : "border-gray-200"}`}>
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Hottest digit</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-lg font-black tabular-nums ${textTitleClass}`}>{overUnderStats.bestUnderDigit}</span>
                        <span className="text-[9px] font-mono font-bold text-[#00D4AA]">{overUnderStats.bestUnderPct.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Over card */}
                <div className={`relative overflow-hidden group p-6 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${isDark
                  ? "bg-gradient-to-br from-blue-600/15 via-black/40 to-black/30 border-blue-400/30 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:border-blue-400/50"
                  : "bg-gradient-to-br from-blue-50/60 via-white/40 to-white/30 border-blue-200/50 shadow-sm hover:shadow-md"}`}>
                  <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-15 transition-opacity">
                    <TrendingUp className="h-24 w-24 text-[#0066FF] rotate-12" />
                  </div>
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-lg font-bold text-[#0066FF] mb-1">Over (5-9)</div>
                      </div>
                      <span className="text-4xl font-black tabular-nums font-mono text-[#0066FF]">
                        <LiveNumber value={overUnderStats.overPct} />%
                      </span>
                    </div>
                    <LiveBar pct={overUnderStats.overPct} colorClass="bg-[#0066FF]" glowColor="rgba(0,102,255,0.4)" />
                    
                    {/* Per-digit mini bars */}
                    <div className="grid grid-cols-5 gap-1 pt-1">
                      {overUnderStats.overDigits.map(d => (
                        <div key={d.digit} className="flex flex-col items-center gap-1">
                          <div className={`w-full h-8 rounded-md overflow-hidden flex items-end ${isDark ? "bg-white/5" : "bg-black/5"}`}>
                            <div
                              className="w-full bg-[#0066FF]/70 rounded-md transition-all duration-700"
                              style={{ height: `${d.percentage * 1.8}%` }}
                            />
                          </div>
                          <span className={`text-[9px] font-black ${isDark ? "text-white/50" : "text-gray-500"}`}>{d.digit}</span>
                          <span className="text-[8px] text-[#0066FF] font-mono font-bold">{d.percentage.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                    {/* Best */}
                    <div className={`flex items-center justify-between pt-1 border-t ${isDark ? "border-white/5" : "border-gray-200"}`}>
                      <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Hottest digit</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-lg font-black tabular-nums ${textTitleClass}`}>{overUnderStats.bestOverDigit}</span>
                        <span className="text-[9px] font-mono font-bold text-[#0066FF]">{overUnderStats.bestOverPct.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signal bar */}
              <div className={`flex items-center justify-between px-6 py-4 rounded-2xl border backdrop-blur-xl transition-all ${isDark
                ? "bg-gradient-to-r from-yellow-600/15 via-black/40 to-black/30 border-yellow-400/30 shadow-lg shadow-yellow-500/10"
                : "bg-gradient-to-r from-yellow-50/60 via-white/40 to-white/30 border-yellow-200/50 shadow-sm"}`}>
                <div className="flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${overUnderStats.underPct > overUnderStats.overPct ? "text-[#00D4AA]" : "text-[#0066FF]"}`} />
                  <span className={`text-xs font-black uppercase tracking-widest ${textTitleClass}`}>AI Bias Signal</span>
                </div>
                <span className={`text-sm font-black uppercase tracking-widest ${
                  overUnderStats.underPct > overUnderStats.overPct ? "text-[#00D4AA]" : "text-[#0066FF]"
                }`}>
                  {overUnderStats.underPct > overUnderStats.overPct ? "UNDER BIAS" : "OVER BIAS"}
                  <span className={`ml-2 text-[10px] font-mono opacity-60 ${textSubClass}`}>
                    +{Math.abs(overUnderStats.underPct - overUnderStats.overPct).toFixed(1)}%
                  </span>
                </span>
              </div>
            </div>

            {/* EVEN / ODD SECTION */}
            <div className="space-y-3">
              <h3 className={`text-sm font-black uppercase tracking-widest px-6 ${textSubClass}`}>Even / Odd Distribution</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Even */}
                <div className={`p-6 rounded-2xl border backdrop-blur-xl relative overflow-hidden group space-y-4 transition-all ${isDark
                  ? "bg-gradient-to-br from-blue-600/15 via-black/40 to-black/30 border-blue-400/30 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:border-blue-400/50"
                  : "bg-gradient-to-br from-blue-50/60 via-white/40 to-white/30 border-blue-200/50 shadow-sm hover:shadow-md"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-lg font-bold text-[#0066FF] mb-1">Even</div>
                    </div>
                    <span className="text-4xl font-black tabular-nums font-mono text-[#0066FF]">
                      <LiveNumber value={evenOddStats.evenPct} />%
                    </span>
                  </div>
                  <LiveBar pct={evenOddStats.evenPct} colorClass="bg-[#0066FF]" glowColor="rgba(0,102,255,0.4)" />
                  <div className={`flex items-center justify-between pt-1 border-t ${isDark ? "border-white/5" : "border-gray-200"}`}>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Top digit</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-lg font-black ${textTitleClass}`}>{evenOddStats.bestEvenDigit}</span>
                      <span className="text-[9px] font-mono font-bold text-[#0066FF]">{evenOddStats.bestEvenPct.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Odd */}
                <div className={`p-6 rounded-2xl border backdrop-blur-xl relative overflow-hidden group space-y-4 transition-all ${isDark
                  ? "bg-gradient-to-br from-orange-600/15 via-black/40 to-black/30 border-orange-400/30 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 hover:border-orange-400/50"
                  : "bg-gradient-to-br from-orange-50/60 via-white/40 to-white/30 border-orange-200/50 shadow-sm hover:shadow-md"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-lg font-bold text-[#FF6B35] mb-1">Odd</div>
                    </div>
                    <span className="text-4xl font-black tabular-nums font-mono text-[#FF6B35]">
                      <LiveNumber value={evenOddStats.oddPct} />%
                    </span>
                  </div>
                  <LiveBar pct={evenOddStats.oddPct} colorClass="bg-[#FF6B35]" glowColor="rgba(255,107,53,0.4)" />
                  <div className={`flex items-center justify-between pt-1 border-t ${isDark ? "border-white/5" : "border-gray-200"}`}>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Top digit</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-lg font-black ${textTitleClass}`}>{evenOddStats.bestOddDigit}</span>
                      <span className="text-[9px] font-mono font-bold text-[#FF6B35]">{evenOddStats.bestOddPct.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`flex items-center justify-between px-6 py-4 rounded-2xl border backdrop-blur-xl transition-all ${isDark
                ? "bg-gradient-to-r from-purple-600/15 via-black/40 to-black/30 border-purple-400/30 shadow-lg shadow-purple-500/10"
                : "bg-gradient-to-r from-purple-50/60 via-white/40 to-white/30 border-purple-200/50 shadow-sm"}`}>
                <div className="flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${evenOddStats.evenPct > evenOddStats.oddPct ? "text-[#0066FF]" : "text-[#FF6B35]"}`} />
                  <span className={`text-xs font-black uppercase tracking-widest ${textTitleClass}`}>AI Bias Signal</span>
                </div>
                <span className={`text-sm font-black uppercase tracking-widest ${evenOddStats.evenPct > evenOddStats.oddPct ? "text-[#0066FF]" : "text-[#FF6B35]"}`}>
                  {evenOddStats.evenPct > evenOddStats.oddPct ? "EVEN BIAS" : "ODD BIAS"}
                  <span className={`ml-2 text-[10px] font-mono opacity-60 ${textSubClass}`}>
                    +{Math.abs(evenOddStats.evenPct - evenOddStats.oddPct).toFixed(1)}%
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MATCHES */}
        {activeStrategy === "matches" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Digit frequency grid */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {matchesStats.sorted.map((f, rank) => {
                const isBest = f.digit === matchesStats.bestDigit
                const barH = Math.max(8, (f.percentage / Math.max(...matchesStats.sorted.map(d => d.percentage))) * 60)
                return (
                  <div key={f.digit} className={`flex flex-col items-center gap-1 p-2 rounded-xl border backdrop-blur-sm transition-all ${
                    isBest
                      ? isDark 
                        ? "bg-emerald-500/20 border-emerald-400/60 shadow-lg shadow-emerald-500/30 scale-105"
                        : "bg-emerald-100/50 border-emerald-400/50 shadow-md"
                      : isDark 
                        ? "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]" 
                        : "bg-white/50 border-gray-300/50 hover:bg-white/70"
                  }`}>
                    {/* Bar */}
                    <div className="w-full flex items-end justify-center" style={{ height: "56px" }}>
                      <div
                        className={`w-3/4 rounded-sm transition-all duration-700 ${isBest ? "bg-[#00D4AA]" : isDark ? "bg-white/20" : "bg-black/10"}`}
                        style={{ height: `${barH}px`, boxShadow: isBest ? "0 0 8px rgba(0,212,170,0.6)" : "none" }}
                      />
                    </div>
                    <span className={`text-sm font-black tabular-nums ${isBest ? "text-[#00D4AA]" : textTitleClass}`}>{f.digit}</span>
                    <span className={`text-[8px] font-mono font-bold ${textSubClass}`}>{f.percentage.toFixed(0)}%</span>
                    {isBest && <span className="text-[7px] font-black text-[#00D4AA] uppercase tracking-wider">HOT</span>}
                  </div>
                )
              })}
            </div>
            {/* Recommendation */}
            <div className={`flex items-center gap-5 p-6 rounded-2xl border backdrop-blur-xl transition-all ${isDark
              ? "bg-gradient-to-r from-emerald-600/15 via-black/40 to-black/30 border-emerald-400/30 shadow-lg shadow-emerald-500/15"
              : "bg-gradient-to-r from-emerald-50/60 via-white/40 to-white/30 border-emerald-200/50 shadow-sm"}`}>
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 backdrop-blur-sm transition-all ${isDark
                ? "bg-emerald-500/20 border-emerald-400/50 shadow-lg shadow-emerald-500/20"
                : "bg-emerald-100/50 border-emerald-300/50"}`}>
                <Star className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black text-[#00D4AA] uppercase tracking-widest mb-0.5">Best Match Target</p>
                <p className={`text-xl font-black ${textTitleClass}`}>Digit <span className="text-[#00D4AA]">{matchesStats.bestDigit}</span></p>
                <p className={`text-[10px] mt-0.5 ${textSubClass}`}>Highest frequency — {matchesStats.bestPct.toFixed(1)}% occurrence in last {recentDigits.length} digits</p>
              </div>
            </div>
          </div>
        )}

        {/* DIFFERS */}
        {activeStrategy === "differs" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Safety grid */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {differsStats.sorted.map(f => {
                const safety = 100 - f.percentage
                const isSafest = f.digit === differsStats.safestDigit
                const barH = Math.max(8, (safety / 100) * 60)
                return (
                  <div key={f.digit} className={`flex flex-col items-center gap-1 p-2 rounded-xl border backdrop-blur-sm transition-all ${
                    isSafest
                      ? isDark
                        ? "bg-orange-500/20 border-orange-400/60 shadow-lg shadow-orange-500/30 scale-105"
                        : "bg-orange-100/50 border-orange-400/50 shadow-md"
                      : isDark
                        ? "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"
                        : "bg-white/50 border-gray-300/50 hover:bg-white/70"
                  }`}>
                    <div className="w-full flex items-end justify-center" style={{ height: "56px" }}>
                      <div
                        className={`w-3/4 rounded-sm transition-all duration-700 ${isSafest ? "bg-[#FF6B35]" : isDark ? "bg-white/20" : "bg-black/10"}`}
                        style={{ height: `${barH}px`, boxShadow: isSafest ? "0 0 8px rgba(255,107,53,0.6)" : "none" }}
                      />
                    </div>
                    <span className={`text-sm font-black tabular-nums ${isSafest ? "text-[#FF6B35]" : textTitleClass}`}>{f.digit}</span>
                    <span className={`text-[8px] font-mono font-bold ${textSubClass}`}>{safety.toFixed(0)}%</span>
                    {isSafest && <span className="text-[7px] font-black text-[#FF6B35] uppercase tracking-wider">SAFE</span>}
                  </div>
                )
              })}
            </div>
            {/* Recommendation */}
            <div className={`flex items-center gap-5 p-6 rounded-2xl border backdrop-blur-xl transition-all ${isDark
              ? "bg-gradient-to-r from-orange-600/15 via-black/40 to-black/30 border-orange-400/30 shadow-lg shadow-orange-500/15"
              : "bg-gradient-to-r from-orange-50/60 via-white/40 to-white/30 border-orange-200/50 shadow-sm"}`}>
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 backdrop-blur-sm transition-all ${isDark
                ? "bg-orange-500/20 border-orange-400/50 shadow-lg shadow-orange-500/20"
                : "bg-orange-100/50 border-orange-300/50"}`}>
                <ShieldAlert className="h-6 w-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black text-[#FF6B35] uppercase tracking-widest mb-0.5">Safest Differs Target</p>
                <p className={`text-xl font-black ${textTitleClass}`}>Digit <span className="text-[#FF6B35]">{differsStats.safestDigit}</span></p>
                <p className={`text-[10px] mt-0.5 ${textSubClass}`}>Lowest frequency — {differsStats.safetyPct.toFixed(1)}% safety threshold in last {recentDigits.length} digits</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
