"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine
} from "recharts"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"
import { Activity, TrendingUp, TrendingDown, Wifi, WifiOff } from "lucide-react"

interface TickPoint {
  time: string
  price: number
  epoch: number
}

interface DerivSmartChartProps {
  symbol?: string
  type?: string
  options?: Record<string, any>
  height?: number
  showHeader?: boolean
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null
  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md text-[11px]">
      <p className="text-white/40 font-mono mb-0.5">{payload[0].payload.time}</p>
      <p className="text-cyan-400 font-black font-mono text-sm tabular-nums">
        {Number(payload[0].value).toFixed(5)}
      </p>
    </div>
  )
}

const DerivSmartChart: React.FC<DerivSmartChartProps> = ({
  symbol = "R_100",
  height = 360,
  showHeader = true,
}) => {
  const [ticks, setTicks] = useState<TickPoint[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [latestPrice, setLatestPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<number>(0)
  const [symbolName, setSymbolName] = useState(symbol)
  const maxPoints = 80

  useEffect(() => {
    const manager = DerivWebSocketManager.getInstance()

    const unsubscribe = manager.subscribe(symbol, (data: any) => {
      if (data?.msg_type === "tick" && data.tick) {
        const tick = data.tick
        const price = Number(tick.quote ?? tick.bid ?? 0)
        if (!price) return

        const now = new Date(tick.epoch ? tick.epoch * 1000 : Date.now())
        const timeLabel = now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })

        setTicks(prev => {
          const next = [...prev, { time: timeLabel, price, epoch: tick.epoch ?? Date.now() / 1000 }]
          return next.length > maxPoints ? next.slice(-maxPoints) : next
        })
        setLatestPrice(price)
        setIsConnected(true)
        if (tick.symbol) setSymbolName(tick.symbol)
      }

      if (data?.msg_type === "tick_history" && data.history) {
        const { times, prices } = data.history
        if (!times || !prices) return
        const historical: TickPoint[] = times.map((epoch: number, i: number) => ({
          epoch,
          price: Number(prices[i]),
          time: new Date(epoch * 1000).toLocaleTimeString("en-US", {
            hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
          }),
        }))
        setTicks(historical.slice(-maxPoints))
        setIsConnected(true)
      }
    })

    // Poll connection status
    const poll = setInterval(() => {
      setIsConnected(manager.isConnected)
    }, 2000)

    return () => {
      if (typeof unsubscribe === "function") unsubscribe()
      clearInterval(poll)
    }
  }, [symbol])

  // Track price change vs. first visible tick
  useEffect(() => {
    if (ticks.length >= 2) {
      setPriceChange(ticks[ticks.length - 1].price - ticks[0].price)
    }
  }, [ticks])

  const priceMin = ticks.length ? Math.min(...ticks.map(t => t.price)) * 0.9999 : 0
  const priceMax = ticks.length ? Math.max(...ticks.map(t => t.price)) * 1.0001 : 1
  const isUp = priceChange >= 0
  const gradientId = `chart-grad-${symbol.replace(/[^a-z0-9]/gi, "")}`

  return (
    <div className="bg-[#06080f] border border-white/[0.06] rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
      {showHeader && (
        <div className="px-6 pt-5 pb-4 border-b border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full shadow-lg ${isConnected ? "bg-emerald-400 shadow-emerald-400/50 animate-pulse" : "bg-rose-500/60"}`} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Live Market</p>
              <h3 className="text-lg font-black text-white tracking-tighter leading-none">{symbolName}</h3>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {latestPrice !== null && (
              <div className="text-right">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-0.5">Spot Price</p>
                <p className="text-2xl font-black text-white tabular-nums font-mono tracking-tight">
                  {latestPrice.toFixed(5)}
                </p>
              </div>
            )}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider ${
              isUp
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}>
              {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(5)}
            </div>
            {isConnected
              ? <Wifi className="h-4 w-4 text-emerald-500/50" />
              : <WifiOff className="h-4 w-4 text-rose-500/50 animate-pulse" />
            }
          </div>
        </div>
      )}

      <div style={{ height }} className="relative px-2 pt-3 pb-2">
        {ticks.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Activity className="h-8 w-8 text-indigo-500/40 animate-pulse" />
            <p className="text-[11px] font-black uppercase tracking-widest text-white/20">
              {isConnected ? "Receiving ticks…" : "Connecting…"}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ticks} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.03)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fill: "#374151", fontSize: 9, fontWeight: 700 }}
                tickLine={false}
                axisLine={false}
                interval={Math.max(1, Math.floor(ticks.length / 8))}
              />
              <YAxis
                domain={[priceMin, priceMax]}
                tick={{ fill: "#374151", fontSize: 9, fontWeight: 700 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => v.toFixed(3)}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              {latestPrice && (
                <ReferenceLine
                  y={latestPrice}
                  stroke={isUp ? "#10b981" : "#ef4444"}
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                  strokeWidth={1}
                />
              )}
              <Area
                type="monotone"
                dataKey="price"
                stroke={isUp ? "#10b981" : "#ef4444"}
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: isUp ? "#10b981" : "#ef4444",
                  stroke: "#fff",
                  strokeWidth: 1.5,
                }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Subtle grid texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015] rounded-b-[2rem]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)`,
            backgroundSize: "40px 40px"
          }}
        />
      </div>
    </div>
  )
}

export default DerivSmartChart
