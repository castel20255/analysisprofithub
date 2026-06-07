"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { 
  Percent, ArrowUpDown, Hash, CheckSquare, XCircle, 
  TrendingUp, Star, ShieldAlert, Zap, Cpu
} from "lucide-react"

interface AnalysisResult {
  digitFrequencies?: Record<number, { count: number; percentage: number }>
  powerIndex?: { strongest: number; weakest: number }
}

interface StatisticalAnalysisProps {
  analysis: AnalysisResult
  recentDigits: number[]
  theme?: "light" | "dark"
}

export function StatisticalAnalysis({ analysis, recentDigits, theme = "dark" }: StatisticalAnalysisProps) {
  // Strategy state: 'over-under' | 'differs' | 'matches' | 'even-odd'
  const [activeStrategy, setActiveStrategy] = useState<string>("over-under")

  // Calculate individual digit frequencies (0-9) dynamically from the recent digits array
  const digitFrequencies = useMemo(() => {
    const counts = Array.from({ length: 10 }, () => 0)
    recentDigits.forEach(digit => {
      if (digit >= 0 && digit <= 9) {
        counts[digit]++
      }
    })
    
    const total = recentDigits.length || 1
    return counts.map((count, digit) => ({
      digit,
      count,
      percentage: (count / total) * 100
    }))
  }, [recentDigits])

  // Over/Under metrics
  const overUnderStats = useMemo(() => {
    const underGroup = digitFrequencies.filter(f => f.digit <= 4)
    const overGroup = digitFrequencies.filter(f => f.digit >= 5)

    const totalUnder = underGroup.reduce((s, f) => s + f.percentage, 0)
    const totalOver = overGroup.reduce((s, f) => s + f.percentage, 0)

    // Highest digit in Under (0-4)
    const highestUnder = [...underGroup].sort((a, b) => b.count - a.count)[0]
    // Highest digit in Over (5-9)
    const highestOver = [...overGroup].sort((a, b) => b.count - a.count)[0]

    return {
      underPercentage: totalUnder,
      overPercentage: totalOver,
      highestUnderDigit: highestUnder?.digit ?? 0,
      highestUnderPercentage: highestUnder?.percentage ?? 0,
      highestOverDigit: highestOver?.digit ?? 5,
      highestOverPercentage: highestOver?.percentage ?? 0,
    }
  }, [digitFrequencies])

  // Even/Odd metrics
  const evenOddStats = useMemo(() => {
    const evenGroup = digitFrequencies.filter(f => f.digit % 2 === 0)
    const oddGroup = digitFrequencies.filter(f => f.digit % 2 !== 0)

    const totalEven = evenGroup.reduce((s, f) => s + f.percentage, 0)
    const totalOdd = oddGroup.reduce((s, f) => s + f.percentage, 0)

    // Highest Even digit
    const highestEven = [...evenGroup].sort((a, b) => b.count - a.count)[0]
    // Highest Odd digit
    const highestOdd = [...oddGroup].sort((a, b) => b.count - a.count)[0]

    return {
      evenPercentage: totalEven,
      oddPercentage: totalOdd,
      highestEvenDigit: highestEven?.digit ?? 0,
      highestEvenPercentage: highestEven?.percentage ?? 0,
      highestOddDigit: highestOdd?.digit ?? 1,
      highestOddPercentage: highestOdd?.percentage ?? 0,
    }
  }, [digitFrequencies])

  // Matches metrics (most frequent overall)
  const matchesStats = useMemo(() => {
    const sorted = [...digitFrequencies].sort((a, b) => b.count - a.count)
    return {
      bestTarget: sorted[0]?.digit ?? 0,
      bestPercentage: sorted[0]?.percentage ?? 0,
      sortedFrequencies: sorted
    }
  }, [digitFrequencies])

  // Differs metrics (least frequent overall)
  const differsStats = useMemo(() => {
    const sorted = [...digitFrequencies].sort((a, b) => a.count - b.count)
    return {
      safestTarget: sorted[0]?.digit ?? 0,
      safetyPercentage: 100 - (sorted[0]?.percentage ?? 0),
      sortedFrequencies: sorted
    }
  }, [digitFrequencies])

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-400" /> Quantum Statistics
          </h3>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">
            Realtime probability distribution of last {recentDigits.length} digits
          </p>
        </div>
        
        {/* Strategy Selection Buttons */}
        <div className="flex flex-wrap gap-1 bg-black/45 p-1 rounded-xl border border-white/5">
          {[
            { id: "over-under", label: "Over/Under", icon: <ArrowUpDown className="h-3 w-3" /> },
            { id: "even-odd", label: "Even/Odd", icon: <Hash className="h-3 w-3" /> },
            { id: "matches", label: "Matches", icon: <CheckSquare className="h-3 w-3" /> },
            { id: "differs", label: "Differs", icon: <XCircle className="h-3 w-3" /> },
          ].map(strat => (
            <button
              key={strat.id}
              onClick={() => setActiveStrategy(strat.id)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                activeStrategy === strat.id 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              {strat.icon}
              {strat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Content Panels based on Strategy selection */}
      <div className="min-h-[220px]">
        <AnimatePresence mode="wait">
          {activeStrategy === "over-under" && (
            <motion.div
              key="over-under"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 animate-in fade-in"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Under Indicator */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Under (0 - 4)</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">{overUnderStats.underPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      style={{ width: `${overUnderStats.underPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Over Indicator */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Over (5 - 9)</span>
                    <span className="text-lg font-black text-indigo-400 font-mono">{overUnderStats.overPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                      style={{ width: `${overUnderStats.overPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Recommendations Box - Highest digits in each class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-500/[0.02] border border-emerald-500/10 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest">Highest Under Digit</span>
                    <h4 className="text-xl font-black text-white italic mt-0.5">DIGIT {overUnderStats.highestUnderDigit}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-emerald-400">{overUnderStats.highestUnderPercentage.toFixed(1)}%</span>
                    <p className="text-[8px] text-slate-500 font-black uppercase mt-0.5">Occurrence</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-500/[0.02] border border-indigo-500/10 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-black text-indigo-500/60 uppercase tracking-widest">Highest Over Digit</span>
                    <h4 className="text-xl font-black text-white italic mt-0.5">DIGIT {overUnderStats.highestOverDigit}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-indigo-400">{overUnderStats.highestOverPercentage.toFixed(1)}%</span>
                    <p className="text-[8px] text-slate-500 font-black uppercase mt-0.5">Occurrence</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeStrategy === "even-odd" && (
            <motion.div
              key="even-odd"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 animate-in fade-in"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Even Indicator */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Even (0, 2, 4, 6, 8)</span>
                    <span className="text-lg font-black text-cyan-400 font-mono">{evenOddStats.evenPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      style={{ width: `${evenOddStats.evenPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Odd Indicator */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Odd (1, 3, 5, 7, 9)</span>
                    <span className="text-lg font-black text-purple-400 font-mono">{evenOddStats.oddPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                      style={{ width: `${evenOddStats.oddPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Recommendations Box - Highest digits in Even/Odd classes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-cyan-500/[0.02] border border-cyan-500/10 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-black text-cyan-500/60 uppercase tracking-widest">Highest Even Digit</span>
                    <h4 className="text-xl font-black text-white italic mt-0.5">DIGIT {evenOddStats.highestEvenDigit}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-cyan-400">{evenOddStats.highestEvenPercentage.toFixed(1)}%</span>
                    <p className="text-[8px] text-slate-500 font-black uppercase mt-0.5">Occurrence</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-500/[0.02] border border-purple-500/10 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-black text-purple-500/60 uppercase tracking-widest">Highest Odd Digit</span>
                    <h4 className="text-xl font-black text-white italic mt-0.5">DIGIT {evenOddStats.highestOddDigit}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-black text-purple-400">{evenOddStats.highestOddPercentage.toFixed(1)}%</span>
                    <p className="text-[8px] text-slate-500 font-black uppercase mt-0.5">Occurrence</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeStrategy === "matches" && (
            <motion.div
              key="matches"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 animate-in fade-in"
            >
              {/* Digit Frequency Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {digitFrequencies.map((f) => (
                  <div key={f.digit} className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    matchesStats.bestTarget === f.digit
                      ? "bg-indigo-500/10 border-indigo-500/40 shadow-inner"
                      : "bg-white/[0.01] border-white/5"
                  }`}>
                    <span className={`text-sm font-black ${
                      matchesStats.bestTarget === f.digit ? "text-indigo-400 animate-pulse" : "text-white"
                    }`}>{f.digit}</span>
                    <span className="text-[8px] font-mono text-slate-500 mt-1 leading-none">{f.percentage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>

              {/* Match target recommendation card */}
              <div className="p-4 rounded-2xl bg-indigo-500/[0.03] border border-indigo-500/15 flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                  <Star className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <span className="text-[8px] font-black text-indigo-400 tracking-[0.2em] uppercase">Best Match Target</span>
                  <h4 className="text-lg font-black text-white italic leading-tight mt-0.5">
                    DIGIT {matchesStats.bestTarget}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    This digit represents the highest frequency node overall ({matchesStats.bestPercentage.toFixed(1)}%).
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeStrategy === "differs" && (
            <motion.div
              key="differs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 animate-in fade-in"
            >
              {/* Differs Safety Grid */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {digitFrequencies.map((f) => {
                  const safety = 100 - f.percentage
                  const isSafest = differsStats.safestTarget === f.digit
                  return (
                    <div key={f.digit} className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isSafest
                        ? "bg-emerald-500/10 border-emerald-500/40 shadow-inner"
                        : "bg-white/[0.01] border-white/5"
                    }`}>
                      <span className={`text-sm font-black ${
                        isSafest ? "text-emerald-400 animate-pulse" : "text-white"
                      }`}>{f.digit}</span>
                      <span className="text-[8px] font-mono text-slate-500 mt-1 leading-none">{safety.toFixed(0)}%</span>
                    </div>
                  )
                })}
              </div>

              {/* Safety target recommendation card */}
              <div className="p-4 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/15 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                  <ShieldAlert className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[8px] font-black text-emerald-400 tracking-[0.2em] uppercase">Safest Differs Target</span>
                  <h4 className="text-lg font-black text-white italic leading-tight mt-0.5">
                    DIGIT {differsStats.safestTarget}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    This digit has the lowest frequency overall, yielding a differs safety threshold of {differsStats.safetyPercentage.toFixed(1)}%.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
