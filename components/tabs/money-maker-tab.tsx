"use client"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { LastDigitsChart } from "@/components/charts/last-digits-chart"
import { TrendingUp, TrendingDown, AlertCircle, Settings, BarChart3, Zap } from "lucide-react"

interface StrategyAnalysis {
  type: "over-under" | "even-odd" | "rise-fall" | "differs" | "matches" | "recovery"
  signal: string | null
  confidence: number
  entryPoint: string | null
  warning: string | null
  distribution: Record<number, number>
}

interface TradeHistory {
  id: string
  strategy: string
  direction: string
  stake: number
  result: "win" | "loss" | "pending"
  profit: number
  timestamp: number
}

interface MoneyMakerTabProps {
  theme?: "light" | "dark"
  recentDigits?: number[]
  symbol?: string
  availableSymbols?: any[]
  onSymbolChange?: (symbol: string) => void
}

export function MoneyMakerTab({ theme = "dark", recentDigits = [], symbol, availableSymbols, onSymbolChange }: MoneyMakerTabProps) {
  const [activeStrategy, setActiveStrategy] = useState("over-under")
  const [activeTabs, setActiveTabs] = useState("analysis")
  const [marketToggle, setMarketToggle] = useState(true)
  
  // Trading Console State
  const [tradeStake, setTradeStake] = useState(10)
  const [tradeMarketSelection, setTradeMarketSelection] = useState("over")
  const [contractType, setContractType] = useState("over-under")
  const [ticks, setTicks] = useState(5)
  const [entryPoint, setEntryPoint] = useState(4)
  const [martingale, setMartingale] = useState(false)
  const [martingaleMultiplier, setMartingaleMultiplier] = useState(1.5)
  const [autoTrading, setAutoTrading] = useState(false)
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([])
  
  // Recovery Settings
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [consecutiveLossesLimit, setConsecutiveLossesLimit] = useState(3)
  const [consecutiveLosses, setConsecutiveLosses] = useState(0)

  // Smart24 Settings
  const [smart24Enabled, setSmart24Enabled] = useState(false)
  const [tradingHours, setTradingHours] = useState(24)
  const [accountBalancePercent, setAccountBalancePercent] = useState(2)
  const [stopLossConsecutive, setStopLossConsecutive] = useState(5)

  const UNDER_RANGE = [0, 1, 2, 3, 4]
  const OVER_RANGE = [5, 6, 7, 8, 9]

  const analyzeOverUnder = (): StrategyAnalysis => {
    const last500 = recentDigits.slice(-500)
    const last60 = last500.slice(-60)
    const last15 = last60.slice(-15)

    if (last60.length === 0) {
      return {
        type: "over-under",
        signal: null,
        confidence: 0,
        entryPoint: null,
        warning: null,
        distribution: {},
      }
    }

    const under60 = last60.filter(d => UNDER_RANGE.includes(d)).length
    const over60 = last60.filter(d => OVER_RANGE.includes(d)).length
    const underPercent = (under60 / last60.length) * 100
    const overPercent = (over60 / last60.length) * 100

    const under15 = last15.filter(d => UNDER_RANGE.includes(d)).length
    const over15 = last15.filter(d => OVER_RANGE.includes(d)).length
    const underPercent15 = (under15 / last15.length) * 100
    const overPercent15 = (over15 / last15.length) * 100

    let signal = null
    let entryPoint = null
    let warning = null

    if (underPercent >= 55 && underPercent15 > underPercent) {
      signal = "UNDER"
      const strongestUnder = UNDER_RANGE.reduce((prev, curr) => 
        last60.filter(d => d === curr).length > last60.filter(d => d === prev).length ? curr : prev
      )
      entryPoint = `Entry at digit ${strongestUnder}`
      
      // Check for power increase warning
      if (overPercent15 > 30 && overPercent < 35) {
        warning = `⚠️ Over digits appearing - use caution, skip 2-3 ticks if Over appears`
      }
    } else if (overPercent >= 55 && overPercent15 > overPercent) {
      signal = "OVER"
      const strongestOver = OVER_RANGE.reduce((prev, curr) => 
        last60.filter(d => d === curr).length > last60.filter(d => d === prev).length ? curr : prev
      )
      entryPoint = `Entry at digit ${strongestOver}`
      
      if (underPercent15 > 30 && underPercent < 35) {
        warning = `⚠️ Under digits appearing - use caution, skip 2-3 ticks if Under appears`
      }
    }

    const distribution: Record<number, number> = {}
    for (let i = 0; i < 10; i++) {
      distribution[i] = last60.filter(d => d === i).length
    }

    return {
      type: "over-under",
      signal,
      confidence: Math.max(underPercent, overPercent),
      entryPoint,
      warning,
      distribution,
    }
  }

  const analyzeEvenOdd = (): StrategyAnalysis => {
    const last60 = recentDigits.slice(-60)
    if (last60.length === 0) {
      return { type: "even-odd", signal: null, confidence: 0, entryPoint: null, warning: null, distribution: {} }
    }

    const even = last60.filter(d => d % 2 === 0).length
    const odd = last60.filter(d => d % 2 === 1).length
    const evenPercent = (even / last60.length) * 100
    const oddPercent = (odd / last60.length) * 100
    const deviation = Math.abs(evenPercent - oddPercent)

    let signal = null
    if (deviation >= 7) {
      signal = evenPercent > oddPercent ? "EVEN" : "ODD"
    }

    return {
      type: "even-odd",
      signal,
      confidence: deviation,
      entryPoint: signal ? `Buy ${signal}` : null,
      warning: deviation < 7 ? "Deviation < 7% - Wait for stronger signal" : null,
      distribution: { even, odd, evenPercent, oddPercent },
    }
  }

  const analyzeRiseFall = (): StrategyAnalysis => {
    const prices = recentDigits.slice(-60)
    if (prices.length < 2) {
      return { type: "rise-fall", signal: null, confidence: 0, entryPoint: null, warning: null, distribution: {} }
    }

    let riseCount = 0
    let fallCount = 0
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) riseCount++
      else fallCount++
    }

    const totalMoves = riseCount + fallCount
    const risePercent = (riseCount / totalMoves) * 100
    const fallPercent = (fallCount / totalMoves) * 100
    const deviation = Math.abs(risePercent - fallPercent)

    let signal = null
    if (deviation >= 8) {
      signal = risePercent > fallPercent ? "RISE" : "FALL"
    }

    return {
      type: "rise-fall",
      signal,
      confidence: deviation,
      entryPoint: signal ? `Trend: ${signal}` : null,
      warning: deviation < 8 ? "Deviation < 8% - Trend not strong enough" : null,
      distribution: { rise: riseCount, fall: fallCount },
    }
  }

  const analyzeMatches = (): StrategyAnalysis => {
    const last60 = recentDigits.slice(-60)
    const distribution: Record<number, number> = {}

    for (let i = 0; i < 10; i++) {
      distribution[i] = last60.filter(d => d === i).length
    }

    const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1])
    const hottest = sorted[0]
    const hottestPercent = (hottest[1] / last60.length) * 100

    return {
      type: "matches",
      signal: hottestPercent >= 15 ? `Digit ${hottest[0]}` : null,
      confidence: hottestPercent,
      entryPoint: hottestPercent >= 15 ? `Buy Digit Matches: ${hottest[0]}` : null,
      warning: hottestPercent < 15 ? "No hot digit detected (< 15%)" : null,
      distribution,
    }
  }

  const analyzeDiffers = (): StrategyAnalysis => {
    const last60 = recentDigits.slice(-60)
    const distribution: Record<number, number> = {}

    for (let i = 0; i < 10; i++) {
      distribution[i] = last60.filter(d => d === i).length
    }

    const sorted = Object.entries(distribution).sort((a, b) => a[1] - b[1])
    const coldest = sorted[0]
    const coldestPercent = (coldest[1] / last60.length) * 100

    return {
      type: "differs",
      signal: coldestPercent <= 5 ? `Digit ${coldest[0]}` : null,
      confidence: 100 - coldestPercent,
      entryPoint: coldestPercent <= 5 ? `Buy Digit Differs: ${coldest[0]}` : null,
      warning: coldestPercent > 5 ? "No cold digit detected (> 5%)" : null,
      distribution,
    }
  }

  const getCurrentAnalysis = () => {
    switch (activeStrategy) {
      case "even-odd":
        return analyzeEvenOdd()
      case "rise-fall":
        return analyzeRiseFall()
      case "matches":
        return analyzeMatches()
      case "differs":
        return analyzeDiffers()
      default:
        return analyzeOverUnder()
    }
  }

  const handleTrade = () => {
    const newTrade: TradeHistory = {
      id: Date.now().toString(),
      strategy: activeStrategy,
      direction: tradeMarketSelection,
      stake: tradeStake,
      result: "pending",
      profit: 0,
      timestamp: Date.now(),
    }
    
    setTradeHistory(prev => [newTrade, ...prev])
    
    // Simulate trade result after 2 seconds
    setTimeout(() => {
      const isWin = Math.random() > 0.5
      setTradeHistory(prev =>
        prev.map(t =>
          t.id === newTrade.id
            ? {
                ...t,
                result: isWin ? "win" : "loss",
                profit: isWin ? tradeStake * 0.9 : -tradeStake,
              }
            : t
        )
      )
      
      if (!isWin) {
        setConsecutiveLosses(prev => prev + 1)
        if (prev => prev + 1 >= consecutiveLossesLimit) {
          setRecoveryMode(true)
        }
      } else {
        setConsecutiveLosses(0)
      }
    }, 2000)
  }

  const analysis = getCurrentAnalysis()
  const lastDigits = recentDigits.slice(-50)
  const totalStake = tradeHistory.reduce((sum, t) => sum + t.stake, 0)
  const totalProfit = tradeHistory.reduce((sum, t) => sum + t.profit, 0)
  const wins = tradeHistory.filter(t => t.result === "win").length
  const losses = tradeHistory.filter(t => t.result === "loss").length

  return (
    <div className="space-y-6">
      <Tabs value={activeTabs} onValueChange={setActiveTabs} className="w-full">
        <TabsContent value="analysis" className="space-y-6">
          {/* Strategy Selector */}
          <div
            className={`rounded-xl p-6 border ${
              theme === "dark"
                ? "bg-gradient-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20"
                : "bg-white border-gray-200"
            }`}
          >
            <h2 className={`text-2xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              🎯 Trading Strategies
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {["over-under", "even-odd", "rise-fall", "differs", "matches", "recovery"].map((strat) => (
                <button
                  key={strat}
                  onClick={() => setActiveStrategy(strat)}
                  className={`p-3 rounded-lg font-bold text-sm transition-all ${
                    activeStrategy === strat
                      ? theme === "dark"
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                        : "bg-purple-500 text-white"
                      : theme === "dark"
                      ? "bg-white/5 text-gray-400 hover:bg-white/10"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {strat.replace("-", "/")}
                </button>
              ))}
            </div>

            {/* Market Toggle */}
            <div className="mt-6 flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
              <span className="font-semibold text-white">Auto Markets</span>
              <Switch checked={marketToggle} onCheckedChange={setMarketToggle} />
            </div>
          </div>

          {/* Analysis Display */}
          <div
            className={`rounded-xl p-6 border ${
              theme === "dark"
                ? "bg-gradient-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20"
                : "bg-white border-gray-200"
            }`}
          >
            <h3 className={`text-xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              📊 {activeStrategy.toUpperCase()} Analysis
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Signal Display */}
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                  <p className={`text-sm font-semibold mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Signal Status
                  </p>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full animate-pulse ${
                        analysis.signal
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    />
                    <span className={`text-2xl font-bold ${
                      analysis.signal
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}>
                      {analysis.signal || "NEUTRAL"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Confidence: {analysis.confidence.toFixed(1)}%
                  </p>
                </div>

                {analysis.entryPoint && (
                  <div className="p-4 bg-green-500/20 rounded-lg border border-green-500/40">
                    <p className="text-sm font-semibold text-green-300 mb-2">Entry Point</p>
                    <p className="text-white font-bold">{analysis.entryPoint}</p>
                  </div>
                )}

                {analysis.warning && (
                  <div className="p-4 bg-red-500/20 rounded-lg border border-red-500/40 flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <p className="text-sm text-red-300">{analysis.warning}</p>
                  </div>
                )}
              </div>

              {/* Distribution */}
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className={`text-sm font-semibold mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Last 60 Ticks Distribution
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="text-center">
                      <div className={`p-2 rounded-lg mb-1 ${
                        i < 5 ? "bg-blue-500/20" : "bg-green-500/20"
                      }`}>
                        <p className="text-xs font-bold text-white">{i}</p>
                      </div>
                      <p className="text-xs font-semibold text-gray-300">
                        {(analysis.distribution[i] || 0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {lastDigits.length > 0 && (
              <div className="mt-6">
                <p className={`text-sm font-semibold mb-3 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Last 50 Digits Chart
                </p>
                <LastDigitsChart digits={lastDigits} />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trading-console" className="space-y-6">
          {/* Trading Console */}
          <div
            className={`rounded-xl p-6 border ${
              theme === "dark"
                ? "bg-gradient-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-purple-500/20"
                : "bg-white border-gray-200"
            }`}
          >
            <h2 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              ⚙️ Trading Console
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-300 block mb-2">Market Selection</label>
                  <select
                    value={tradeMarketSelection}
                    onChange={(e) => setTradeMarketSelection(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="over">Over (5-9)</option>
                    <option value="under">Under (0-4)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-300 block mb-2">Contract Type</label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="over-under">Over/Under</option>
                    <option value="even-odd">Even/Odd</option>
                    <option value="digit">Digit Matches</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-300 block mb-2">Ticks ({ticks})</label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={ticks}
                    onChange={(e) => setTicks(parseInt(e.target.value) || 1)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-300 block mb-2">Entry Point ({entryPoint})</label>
                  <Input
                    type="number"
                    min="0"
                    max="9"
                    value={entryPoint}
                    onChange={(e) => setEntryPoint(parseInt(e.target.value) || 0)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-300 block mb-2">Stake (${tradeStake})</label>
                  <Input
                    type="number"
                    min="1"
                    value={tradeStake}
                    onChange={(e) => setTradeStake(parseInt(e.target.value) || 1)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-300">Martingale</span>
                    <Switch checked={martingale} onCheckedChange={setMartingale} />
                  </div>
                  {martingale && (
                    <Input
                      type="number"
                      min="1"
                      step="0.1"
                      value={martingaleMultiplier}
                      onChange={(e) => setMartingaleMultiplier(parseFloat(e.target.value) || 1)}
                      className="bg-white/5 border-white/10 text-white text-sm"
                      placeholder="Multiplier"
                    />
                  )}
                </div>

                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-300">Auto Trading</span>
                    <Switch checked={autoTrading} onCheckedChange={setAutoTrading} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleTrade}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6"
              >
                <Zap className="w-4 h-4 mr-2" />
                Execute Trade
              </Button>
              <Button variant="outline" className="flex-1 py-6 font-bold">
                Clear
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="smart24" className="space-y-6">
          {/* Smart 24hrs Trading */}
          <div
            className={`rounded-xl p-6 border ${
              theme === "dark"
                ? "bg-gradient-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-blue-500/20"
                : "bg-white border-gray-200"
            }`}
          >
            <h2 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              🤖 Smart 24hrs Automated Trading
            </h2>

            <div className="flex items-center gap-3 mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <Switch checked={smart24Enabled} onCheckedChange={setSmart24Enabled} />
              <span className="text-sm font-semibold text-gray-300">Enable Smart24 Mode</span>
            </div>

            {smart24Enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-300 block mb-2">Trading Hours (24)</label>
                    <Input
                      type="number"
                      min="1"
                      max="24"
                      value={tradingHours}
                      onChange={(e) => setTradingHours(parseInt(e.target.value) || 24)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-300 block mb-2">Account Balance %</label>
                    <Input
                      type="number"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={accountBalancePercent}
                      onChange={(e) => setAccountBalancePercent(parseFloat(e.target.value) || 2)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-300 block mb-2">Stop Loss (Consecutive Losses)</label>
                    <Input
                      type="number"
                      min="1"
                      value={stopLossConsecutive}
                      onChange={(e) => setStopLossConsecutive(parseInt(e.target.value) || 5)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <p className="text-sm font-semibold text-blue-300 mb-2">Trading Contracts</p>
                    <p className="text-xs text-gray-300">Over 1, 2, 3 • Under 6, 7, 8</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Transaction History */}
      {tradeHistory.length > 0 && (
        <div
          className={`rounded-xl p-6 border ${
            theme === "dark"
              ? "bg-gradient-to-br from-[#0f1629]/80 to-[#1a2235]/80 border-emerald-500/20"
              : "bg-white border-gray-200"
          }`}
        >
          <h3 className={`text-xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            📈 Transaction History
          </h3>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-3 bg-white/5 border-white/10">
              <p className="text-xs text-gray-400 mb-1">Total Runs</p>
              <p className="text-2xl font-bold text-white">{tradeHistory.length}</p>
            </Card>
            <Card className="p-3 bg-green-500/10 border-green-500/30">
              <p className="text-xs text-green-300 mb-1">Wins</p>
              <p className="text-2xl font-bold text-green-400">{wins}</p>
            </Card>
            <Card className="p-3 bg-red-500/10 border-red-500/30">
              <p className="text-xs text-red-300 mb-1">Losses</p>
              <p className="text-2xl font-bold text-red-400">{losses}</p>
            </Card>
            <Card className={`p-3 border ${
              totalProfit >= 0
                ? "bg-green-500/10 border-green-500/30"
                : "bg-red-500/10 border-red-500/30"
            }`}>
              <p className={`text-xs mb-1 ${totalProfit >= 0 ? "text-green-300" : "text-red-300"}`}>Total Profit</p>
              <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                {totalProfit >= 0 ? "+" : ""}{totalProfit.toFixed(2)}
              </p>
            </Card>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {tradeHistory.slice(0, 10).map((trade) => (
              <div
                key={trade.id}
                className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2 flex-1">
                  {trade.result === "win" ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-gray-400 flex-1">{trade.strategy} • ${trade.stake}</span>
                </div>
                <span className={`font-bold ${
                  trade.result === "win" ? "text-green-400" : 
                  trade.result === "loss" ? "text-red-400" : 
                  "text-yellow-400"
                }`}>
                  {trade.result === "pending" ? "..." : trade.profit > 0 ? "+" : ""}{trade.profit.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Card */}
      <Card className={`p-4 ${theme === "dark" ? "bg-blue-500/10 border-blue-500/30" : "bg-blue-50 border-blue-200"}`}>
        <p className={`text-xs sm:text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"} leading-relaxed`}>
          <span className="font-bold">Money Maker Trading Engine:</span> Analyze 6 strategies simultaneously (Over/Under, Even/Odd, Rise/Fall, Differs, Matches, Recovery). Generate entry points with statistical confidence. Manage trades with martingale, auto-trading, and 24hr automated modes. Track all transactions with real-time profit/loss.
        </p>
      </Card>
    </div>
  )
}
