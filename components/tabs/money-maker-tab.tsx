"use client"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Settings,
  BarChart3,
  Zap,
  Sparkles,
  Radar,
  Activity,
  Flame,
  Shield,
  Target,
  Lock,
  Unlock,
} from "lucide-react"
import { QuantumEdgeEngine, type TickData, type Signal, type MarketAnalysis, type DigitDistribution } from "@/lib/quantum-edge-engine"

interface MoneyMakerTabProps {
  theme?: "light" | "dark"
  recentDigits?: number[]
  symbol?: string
  availableSymbols?: any[]
  onSymbolChange?: (symbol: string) => void
}

export function MoneyMakerTab({
  theme = "dark",
  recentDigits = [],
  symbol,
  availableSymbols,
  onSymbolChange,
}: MoneyMakerTabProps) {
  const [activeTab, setActiveTab] = useState("market-scanner")
  const [autoScanning, setAutoScanning] = useState(true)
  const [selectedStrategy, setSelectedStrategy] = useState("over-under")
  
  // Trading state
  const [stake, setStake] = useState(10)
  const [ticks, setTicks] = useState(5)
  const [martingaleEnabled, setMartingaleEnabled] = useState(false)
  const [autoTrading, setAutoTrading] = useState(false)
  const [trades, setTrades] = useState<any[]>([])
  
  // Recovery settings
  const [consecutiveLossesLimit, setConsecutiveLossesLimit] = useState(3)
  const [consecutiveLosses, setConsecutiveLosses] = useState(0)
  
  // Smart24 settings
  const [smart24Enabled, setSmart24Enabled] = useState(false)
  const [tradingHours, setTradingHours] = useState(24)
  const [riskPercent, setRiskPercent] = useState(2)
  const [accountBalance, setAccountBalance] = useState(10000)

  // Generate tick data from digits
  const tickData: TickData[] = useMemo(() => {
    return recentDigits.map((digit, idx) => ({
      digit,
      timestamp: Date.now() - (recentDigits.length - idx) * 1000,
      price: digit,
    }))
  }, [recentDigits])

  // Analyze markets
  const marketPower = useMemo(() => {
    if (tickData.length < 60) return QuantumEdgeEngine.analyzeMarketPower(tickData, tickData.length)
    return QuantumEdgeEngine.analyzeMarketPower(tickData, 60)
  }, [tickData])

  const digitDistribution = useMemo(() => {
    if (tickData.length < 60) return QuantumEdgeEngine.analyzeDigitDistribution(tickData, tickData.length)
    return QuantumEdgeEngine.analyzeDigitDistribution(tickData, 60)
  }, [tickData])

  const overUnderSignal = useMemo(() => {
    if (tickData.length < 60) return QuantumEdgeEngine.analyzeOverUnder(tickData, tickData.length)
    return QuantumEdgeEngine.analyzeOverUnder(tickData, 60)
  }, [tickData])

  const evenOddSignal = useMemo(() => {
    if (tickData.length < 60) return QuantumEdgeEngine.analyzeEvenOdd(tickData, tickData.length)
    return QuantumEdgeEngine.analyzeEvenOdd(tickData, 60)
  }, [tickData])

  const matchesSignal = useMemo(() => {
    if (tickData.length < 60) return QuantumEdgeEngine.analyzeMatches(tickData, tickData.length)
    return QuantumEdgeEngine.analyzeMatches(tickData, 60)
  }, [tickData])

  const differsSignal = useMemo(() => {
    if (tickData.length < 60) return QuantumEdgeEngine.analyzeDigitDiffers(tickData, tickData.length)
    return QuantumEdgeEngine.analyzeDigitDiffers(tickData, 60)
  }, [tickData])

  // Last 7 digits
  const lastSevenDigits = recentDigits.slice(-7).reverse()

  // Chart data for last 100 digits
  const chartData = useMemo(() => {
    return recentDigits.slice(-100).map((digit, idx) => ({
      tick: idx + 1,
      digit,
    }))
  }, [recentDigits])

  // Get signal color
  const getSignalColor = (signal: Signal) => {
    switch (signal.type) {
      case "OVER":
        return "text-green-400"
      case "UNDER":
        return "text-blue-400"
      case "EVEN":
        return "text-yellow-400"
      case "ODD":
        return "text-purple-400"
      case "MATCHES":
        return "text-pink-400"
      case "DIFFERS":
        return "text-orange-400"
      default:
        return "text-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-2xl p-6 border backdrop-blur-md ${
        theme === "dark"
          ? "bg-gradient-to-br from-slate-900/80 to-slate-950/80 border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]"
          : "bg-white/80 border-gray-300"
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Quantum Edge AI
            </h1>
          </div>
          <Badge className={`text-lg px-4 py-2 ${theme === "dark" ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50" : "bg-cyan-100 text-cyan-700"}`}>
            Live Trading Engine
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Multi-window analysis • Real-time signals • AI-powered market scanning
          </p>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              Auto Scanning
            </span>
            <Switch checked={autoScanning} onCheckedChange={setAutoScanning} />
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className={`flex gap-2 overflow-x-auto pb-2 rounded-lg p-2 ${theme === "dark" ? "bg-slate-900/30" : "bg-slate-100"}`}>
          {[
            { id: "market-scanner", label: "Market Scanner", icon: Radar },
            { id: "trading-console", label: "Trading Console", icon: Target },
            { id: "recovery", label: "Recovery Engine", icon: Shield },
            { id: "smart24", label: "24H Smart Trader", icon: Zap },
            { id: "analytics", label: "Performance", icon: BarChart3 },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? theme === "dark"
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                      : "bg-cyan-500 text-white"
                    : theme === "dark"
                    ? "bg-white/5 text-gray-400 hover:bg-white/10"
                    : "bg-white text-gray-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab 1: Market Scanner */}
        <TabsContent value="market-scanner" className="space-y-6">
          {/* Market Power Cards */}
          <div>
            <h2 className={`text-2xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Market Power Analysis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Over/Under Card */}
              <div className={`rounded-xl p-6 border backdrop-blur-md ${
                theme === "dark"
                  ? "bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                  : "bg-emerald-50 border-emerald-300"
              }`}>
                <h3 className={`text-lg font-bold mb-4 ${theme === "dark" ? "text-emerald-300" : "text-emerald-700"}`}>
                  Over/Under Signal
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-emerald-400">Over (5-9)</span>
                      <span className="text-sm font-bold text-emerald-300">{marketPower.bullishPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                        style={{ width: `${marketPower.bullishPercent}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-blue-400">Under (0-4)</span>
                      <span className="text-sm font-bold text-blue-300">{marketPower.bearishPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{ width: `${marketPower.bearishPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className={`mt-4 p-3 rounded-lg ${theme === "dark" ? "bg-white/5" : "bg-white/50"}`}>
                  <p className={`text-sm font-semibold ${getSignalColor(overUnderSignal)}`}>
                    {overUnderSignal.type === "NONE" ? "Neutral" : `${overUnderSignal.type} Signal`} ({overUnderSignal.strength})
                  </p>
                  <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    Confidence: {overUnderSignal.confidence.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Even/Odd Card */}
              <div className={`rounded-xl p-6 border backdrop-blur-md ${
                theme === "dark"
                  ? "bg-gradient-to-br from-yellow-900/40 to-yellow-950/40 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.15)]"
                  : "bg-yellow-50 border-yellow-300"
              }`}>
                <h3 className={`text-lg font-bold mb-4 ${theme === "dark" ? "text-yellow-300" : "text-yellow-700"}`}>
                  Even/Odd Signal
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-yellow-400">Even (0,2,4,6,8)</span>
                      <span className="text-sm font-bold text-yellow-300">
                        {tickData.filter(t => t.digit % 2 === 0).length / Math.max(tickData.length, 1) * 100 | 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-amber-400"
                        style={{ width: `${tickData.filter(t => t.digit % 2 === 0).length / Math.max(tickData.length, 1) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-purple-400">Odd (1,3,5,7,9)</span>
                      <span className="text-sm font-bold text-purple-300">
                        {tickData.filter(t => t.digit % 2 === 1).length / Math.max(tickData.length, 1) * 100 | 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-400"
                        style={{ width: `${tickData.filter(t => t.digit % 2 === 1).length / Math.max(tickData.length, 1) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className={`mt-4 p-3 rounded-lg ${theme === "dark" ? "bg-white/5" : "bg-white/50"}`}>
                  <p className={`text-sm font-semibold ${getSignalColor(evenOddSignal)}`}>
                    {evenOddSignal.type === "NONE" ? "Neutral" : `${evenOddSignal.type} Signal`} ({evenOddSignal.strength})
                  </p>
                  <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    Confidence: {evenOddSignal.confidence.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Digit Distribution Cards */}
          <div>
            <h2 className={`text-2xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Premium Digit Distribution
            </h2>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {Array.from({ length: 10 }).map((_, digit) => {
                const dist = digitDistribution[digit]
                return (
                  <div
                    key={digit}
                    className={`rounded-lg p-3 border backdrop-blur-sm text-center transition-all hover:scale-105 ${
                      theme === "dark"
                        ? "bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-600/40 hover:border-cyan-500/60"
                        : "bg-white/60 border-gray-300 hover:border-cyan-400"
                    }`}
                  >
                    <div className={`text-2xl font-bold mb-1 ${dist.heatScore > 70 ? "text-red-400" : dist.heatScore > 40 ? "text-yellow-400" : "text-blue-400"}`}>
                      {digit}
                    </div>
                    <div className={`text-xs font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      {dist.frequency}x
                    </div>
                    <div className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      {dist.powerPercent.toFixed(0)}%
                    </div>
                    <div className="mt-2 h-1 bg-black/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        style={{ width: `${dist.heatScore}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Last 7 Digits */}
          <div>
            <h2 className={`text-2xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Last 7 Digits
            </h2>
            <div className="flex gap-2 justify-center">
              {lastSevenDigits.map((digit, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-4 border backdrop-blur-sm text-center min-w-[80px] transition-all ${
                    theme === "dark"
                      ? "bg-gradient-to-br from-slate-800/60 to-slate-900/60 border-slate-600/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                      : "bg-white/60 border-gray-300"
                  }`}
                >
                  <div className="text-4xl font-bold text-cyan-400">{digit}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Last 100 Digits Chart */}
          <div className={`rounded-xl p-6 border backdrop-blur-md ${
            theme === "dark"
              ? "bg-gradient-to-br from-slate-900/60 to-slate-950/60 border-slate-700/40"
              : "bg-white/60 border-gray-300"
          }`}>
            <h2 className={`text-lg font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Last 100 Digits - Live Chart
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                <XAxis dataKey="tick" stroke={theme === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} />
                <YAxis stroke={theme === "dark" ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"} domain={[0, 9]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "rgba(15,22,41,0.95)" : "rgba(255,255,255,0.95)",
                    border: `1px solid ${theme === "dark" ? "rgba(34,211,238,0.5)" : "rgba(34,211,238,0.3)"}`,
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="digit"
                  stroke="url(#colorGradient)"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={true}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="100%" y2="0">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* Tab 2: Trading Console */}
        <TabsContent value="trading-console" className="space-y-6">
          <div className={`rounded-2xl p-6 border backdrop-blur-md ${
            theme === "dark"
              ? "bg-gradient-to-br from-slate-900/80 to-slate-950/80 border-blue-500/20"
              : "bg-white/80 border-gray-300"
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Trading Console
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className={`text-sm font-semibold block mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Strategy
                  </label>
                  <select
                    value={selectedStrategy}
                    onChange={(e) => setSelectedStrategy(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 font-semibold transition-all ${
                      theme === "dark"
                        ? "bg-slate-800/50 border border-slate-700 text-white hover:border-cyan-500"
                        : "bg-white border border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="over-under">Over/Under</option>
                    <option value="even-odd">Even/Odd</option>
                    <option value="matches">Matches</option>
                    <option value="differs">Differs</option>
                  </select>
                </div>

                <div>
                  <label className={`text-sm font-semibold block mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Stake ($): {stake}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={stake}
                    onChange={(e) => setStake(parseInt(e.target.value) || 1)}
                    className={theme === "dark" ? "bg-slate-800 border-slate-700" : ""}
                  />
                </div>

                <div>
                  <label className={`text-sm font-semibold block mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Ticks: {ticks}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={ticks}
                    onChange={(e) => setTicks(parseInt(e.target.value) || 1)}
                    className={theme === "dark" ? "bg-slate-800 border-slate-700" : ""}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${theme === "dark" ? "bg-slate-800/30 border-slate-700" : "bg-gray-100 border-gray-300"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Martingale
                    </span>
                    <Switch checked={martingaleEnabled} onCheckedChange={setMartingaleEnabled} />
                  </div>
                  {martingaleEnabled && (
                    <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                      Over 3 / Under 6: 1.5x | Over 2 / Under 7: 2.1x | Over 1 / Under 8: 3.1x
                    </p>
                  )}
                </div>

                <div className={`p-4 rounded-lg border ${theme === "dark" ? "bg-slate-800/30 border-slate-700" : "bg-gray-100 border-gray-300"}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Auto Trading
                    </span>
                    <Switch checked={autoTrading} onCheckedChange={setAutoTrading} />
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full mt-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-6 text-lg">
              <Zap className="w-5 h-5 mr-2" />
              Execute Trade Now
            </Button>
          </div>
        </TabsContent>

        {/* Tab 3: Recovery Engine */}
        <TabsContent value="recovery" className="space-y-6">
          <div className={`rounded-2xl p-6 border backdrop-blur-md ${
            theme === "dark"
              ? "bg-gradient-to-br from-orange-900/40 to-orange-950/40 border-orange-500/20"
              : "bg-orange-50 border-orange-300"
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-orange-300" : "text-orange-700"}`}>
              Recovery Engine
            </h2>

            <div className="space-y-6">
              <div>
                <label className={`text-sm font-semibold block mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Consecutive Losses Before Recovery: {consecutiveLossesLimit}
                </label>
                <div className="flex gap-2">
                  {[3, 4, 5].map(val => (
                    <Button
                      key={val}
                      onClick={() => setConsecutiveLossesLimit(val)}
                      className={`flex-1 ${
                        consecutiveLossesLimit === val
                          ? "bg-orange-600 text-white"
                          : theme === "dark"
                          ? "bg-slate-800 text-gray-300 hover:bg-slate-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {val} Losses
                    </Button>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${theme === "dark" ? "bg-slate-800/30 border-slate-700" : "bg-gray-100 border-gray-300"}`}>
                <p className={`text-sm font-semibold mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Recovery Priority:
                </p>
                <ol className={`text-sm space-y-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  <li>1. Over 0 - Highest Probability</li>
                  <li>2. Even - Balanced Risk</li>
                  <li>3. Under 9 - Alternative Entry</li>
                </ol>
              </div>

              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4">
                <Shield className="w-5 h-5 mr-2" />
                Activate Recovery Mode
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: 24H Smart Trader */}
        <TabsContent value="smart24" className="space-y-6">
          <div className={`rounded-2xl p-6 border backdrop-blur-md ${
            theme === "dark"
              ? "bg-gradient-to-br from-violet-900/40 to-violet-950/40 border-violet-500/20"
              : "bg-violet-50 border-violet-300"
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${theme === "dark" ? "text-violet-300" : "text-violet-700"}`}>
                24H Smart Trading Mode
              </h2>
              <Switch checked={smart24Enabled} onCheckedChange={setSmart24Enabled} />
            </div>

            {smart24Enabled && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`text-sm font-semibold block mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Trading Duration
                    </label>
                    <select
                      value={tradingHours}
                      onChange={(e) => setTradingHours(parseInt(e.target.value))}
                      className={`w-full rounded-lg px-3 py-2 ${
                        theme === "dark"
                          ? "bg-slate-800/50 border border-slate-700 text-white"
                          : "bg-white border border-gray-300"
                      }`}
                    >
                      <option value={1}>1 Hour</option>
                      <option value={6}>6 Hours</option>
                      <option value={12}>12 Hours</option>
                      <option value={24}>24 Hours</option>
                    </select>
                  </div>

                  <div>
                    <label className={`text-sm font-semibold block mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      Risk Per Trade: {riskPercent}%
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 5].map(val => (
                        <Button
                          key={val}
                          onClick={() => setRiskPercent(val)}
                          className={`flex-1 text-xs ${
                            riskPercent === val
                              ? "bg-violet-600 text-white"
                              : theme === "dark"
                              ? "bg-slate-800 text-gray-300"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {val}%
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg border ${theme === "dark" ? "bg-slate-800/30 border-slate-700" : "bg-gray-100 border-gray-300"}`}>
                  <p className={`text-sm font-semibold mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Recommended Stake Calculation:
                  </p>
                  <p className={`text-lg font-bold ${theme === "dark" ? "text-cyan-400" : "text-cyan-600"}`}>
                    ${(accountBalance * riskPercent / 100).toFixed(2)} per trade
                  </p>
                  <p className={`text-xs mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    Based on {riskPercent}% risk of ${accountBalance} account balance
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-bold py-4">
                    <Unlock className="w-4 h-4 mr-2" />
                    Start 24H Trading
                  </Button>
                  <Button variant="outline" className="font-bold py-4">
                    <Lock className="w-4 h-4 mr-2" />
                    Stop Trading
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 5: Performance Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className={`rounded-2xl p-6 border backdrop-blur-md ${
            theme === "dark"
              ? "bg-gradient-to-br from-slate-900/80 to-slate-950/80 border-slate-700/40"
              : "bg-white/80 border-gray-300"
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Performance Analytics
            </h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Trades", value: trades.length, color: "blue" },
                { label: "Win Rate", value: `${(trades.filter(t => t.result === "win").length / Math.max(trades.length, 1) * 100).toFixed(1)}%`, color: "green" },
                { label: "Total Profit", value: `$${trades.reduce((sum, t) => sum + (t.profit || 0), 0).toFixed(2)}`, color: "emerald" },
                { label: "Account Balance", value: `$${accountBalance}`, color: "cyan" },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-4 border backdrop-blur-sm ${
                    theme === "dark"
                      ? `bg-gradient-to-br from-${stat.color}-900/40 to-${stat.color}-950/40 border-${stat.color}-500/30`
                      : `bg-${stat.color}-50 border-${stat.color}-300`
                  }`}
                >
                  <p className={`text-xs font-semibold mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-bold ${theme === "dark" ? `text-${stat.color}-400` : `text-${stat.color}-600`}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Placeholder for charts */}
            <p className={`text-sm text-center py-8 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Performance charts will display here once trades are executed
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className={`p-4 border ${theme === "dark" ? "bg-cyan-900/20 border-cyan-500/20" : "bg-cyan-50 border-cyan-300"}`}>
        <p className={`text-sm ${theme === "dark" ? "text-cyan-300" : "text-cyan-700"}`}>
          <span className="font-bold">Quantum Edge AI</span> - Advanced AI trading engine with multi-window analysis, statistical signal generation, and intelligent market scanning. Real-time risk management with recovery protocols and 24-hour automated trading capabilities.
        </p>
      </Card>
    </div>
  )
}
