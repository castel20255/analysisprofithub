"use client"

import { useState, useEffect } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { useDerivAuth } from "@/hooks/use-deriv-auth"
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"

import DerivSmartChart from "@/components/DerivSmartChart"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react"

interface OpenContract {
  contract_id: number
  status: string
  profit?: number
  bid_price?: number
  current_spot?: string
  entry_price?: number
  buy_price?: number
  contract_type?: string
}

interface DashboardTabProps {
  theme?: "light" | "dark"
}

export function DashboardTab({ theme = "dark" }: DashboardTabProps) {
  const globalContext = useDerivAPI()
  const authContext = useDerivAuth()
  const manager = DerivWebSocketManager.getInstance()

  const [openContracts, setOpenContracts] = useState<OpenContract[]>([])
  const [totalProfit, setTotalProfit] = useState(0)
  const [isOtpConnected, setIsOtpConnected] = useState(false)
  const [connectionLog, setConnectionLog] = useState<string[]>([])
  const [marketData, setMarketData] = useState<Record<string, any>>({})
  const [showBalance, setShowBalance] = useState(true)

  const balance = globalContext.balance?.amount || 0
  const currency = globalContext.balance?.currency || "USD"
  const isLoggedIn = globalContext.isLoggedIn
  const isConnected = globalContext.isConnected

  const addLog = (message: string) => {
    console.log(`[v0] ${message}`)
    setConnectionLog((prev) => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // Handle WebSocket messages for contract updates
  useEffect(() => {
    const handleMessage = (data: any) => {
      if (data.msg_type === "proposal_open_contract") {
        const contract = data.proposal_open_contract
        setOpenContracts((prev) => {
          const existing = prev.find((c) => c.contract_id === contract.contract_id)
          if (existing) {
            return prev.map((c) =>
              c.contract_id === contract.contract_id
                ? {
                    ...c,
                    status: contract.status || c.status,
                    profit: contract.profit,
                    bid_price: contract.bid_price,
                    current_spot: contract.current_spot,
                  }
                : c
            )
          } else {
            return [
              ...prev,
              {
                contract_id: contract.contract_id,
                status: contract.status || "open",
                profit: contract.profit,
                bid_price: contract.bid_price,
                current_spot: contract.current_spot,
                entry_price: contract.entry_spot,
                buy_price: contract.buy_price,
                contract_type: contract.contract_type,
              },
            ]
          }
        })

        if (contract.profit !== undefined) {
          addLog(`📊 Contract ${contract.contract_id}: ${contract.status} | P&L: $${contract.profit?.toFixed(2)}`)
        }
      }

      if (data.msg_type === "tick") {
          const tick = data.tick;
          if (tick && tick.symbol) {
            setMarketData((prev) => ({
              ...prev,
              [tick.symbol]: {
                bid: tick.bid,
                ask: tick.ask,
                quote: tick.quote,
                epoch: tick.epoch,
              },
            }));
          }
        }
    }

    manager.on("*", handleMessage)
    return () => manager.off("*", handleMessage)
  }, [manager])

  // Calculate total profit
  useEffect(() => {
    const total = openContracts.reduce((sum, contract) => sum + (contract.profit || 0), 0)
    setTotalProfit(total)
  }, [openContracts])

  // The Manager auto-handles OTP REST flow under the hood now. We just check if it's authorized.
  useEffect(() => {
    if (isLoggedIn && globalContext.isAuthorized && !isOtpConnected) {
      setIsOtpConnected(true)
      addLog("✅ Secure Manager Link connected!")
    } else if (!globalContext.isAuthorized && isOtpConnected) {
      setIsOtpConnected(false)
    }
  }, [isLoggedIn, globalContext.isAuthorized, isOtpConnected])


  const requestProposal = () => {
    if (!manager.isConnected) {
      addLog("❌ WebSocket not connected")
      return
    }

    manager.send({
      proposal: 1,
      amount: 10,
      basis: "stake",
      contract_type: "CALL",
      currency: currency,
      duration: 5,
      duration_unit: "t",
      underlying_symbol: "1HZ100V",
      req_id: 1,
    })
    addLog("📨 Proposal request sent")
  }

  const closeContract = (contractId: number) => {
    if (!manager.isConnected) {
      addLog("❌ WebSocket not connected")
      return
    }

    manager.send({
      sell: contractId,
      price: openContracts.find((c) => c.contract_id === contractId)?.bid_price || 0,
    })
    addLog(`📤 Close request sent for contract ${contractId}`)
  }

  return (
    <div className={`space-y-8 p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700`}>
      {/* ─── Premium Header Stat Cards ─── */}
      <DerivSmartChart symbol="R_100" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* API Connection Card */}
        <div className={`relative overflow-hidden rounded-[2rem] border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${
          isConnected 
          ? "bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/10" 
          : "bg-rose-500/5 border-rose-500/20 shadow-rose-500/10"
        }`}>
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Zap className="h-12 w-12" />
          </div>
          <div className="relative p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Network Status</span>
              </div>
              <h3 className={`text-2xl font-black tracking-tighter ${isConnected ? "text-emerald-400" : "text-rose-400"}`}>
                {isConnected ? "SYSTEM ONLINE" : "OFFLINE"}
              </h3>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Latency: <span className="text-white/60">24ms</span></span>
              <ShieldCheck className={`h-5 w-5 ${isConnected ? "text-emerald-500/50" : "text-rose-500/50"}`} />
            </div>
          </div>
        </div>

        {/* OTP Status Card (The "Bridge") */}
        <div className={`relative overflow-hidden rounded-[2rem] border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${
          isOtpConnected 
          ? "bg-blue-500/5 border-blue-500/20 shadow-blue-500/10" 
          : "bg-white/[0.02] border-white/5"
        }`}>
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Activity className="h-12 w-12" />
          </div>
          <div className="relative p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${isOtpConnected ? "bg-blue-400 animate-pulse" : "bg-white/20"}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Secure Auth Bridge</span>
              </div>
              <h3 className={`text-2xl font-black tracking-tighter ${isOtpConnected ? "text-blue-400" : "text-white/20"}`}>
                {isOtpConnected ? "VERIFIED TUNNEL" : "TUNNEL IDLE"}
              </h3>
            </div>
            <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-white/30 uppercase tracking-widest">
              <span>Token: <span className="text-white/60 font-mono">v4.OTP-****</span></span>
            </div>
          </div>
        </div>

        {/* Main Balance Card */}
        <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-blue-700 p-1 shadow-[0_20px_50px_rgba(37,99,235,0.2)] border border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
          <div className="relative bg-slate-950/40 backdrop-blur-3xl rounded-[2.3rem] p-7 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Primary Liquidity</span>
              <Wallet className="h-5 w-5 text-blue-400/50" />
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  {showBalance ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••"}
                </span>
                <span className="text-sm font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded-md leading-none">{currency}</span>
              </div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" /> Live Balance Syncing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── P&L Performance Banner ─── */}
      <div className={`relative overflow-hidden rounded-[2.5rem] border transition-all duration-700 ${
        totalProfit >= 0 
        ? "bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 shadow-emerald-500/5" 
        : "bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/20 shadow-rose-500/5"
      }`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)]" />
        <div className="relative p-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className={`p-5 rounded-[2rem] border shadow-2xl transition-transform duration-500 hover:rotate-12 ${
              totalProfit >= 0 
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" 
              : "bg-rose-500/20 border-rose-500/30 text-rose-400"
            }`}>
              {totalProfit >= 0 ? <TrendingUp className="h-10 w-10" /> : <TrendingDown className="h-10 w-10" />}
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30 mb-2">Aggregate Portfolio Performance</p>
              <div className="flex items-baseline gap-3">
                <span className={`text-6xl font-black tracking-tighter tabular-nums drop-shadow-2xl ${totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {totalProfit >= 0 ? "+" : ""}{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xl font-bold text-white/40 uppercase tracking-widest">{currency}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-end">
            <div className="px-5 py-2.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Active Orders</span>
              <span className="text-lg font-black text-white">{openContracts.length}</span>
            </div>
            <div className={`px-5 py-2.5 rounded-2xl border flex items-center gap-3 ${totalProfit >= 0 ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400" : "bg-amber-400/10 border-amber-400/20 text-amber-400"}`}>
              <span className="text-[9px] font-black uppercase tracking-widest">Yield Momentum</span>
              <span className="text-lg font-black">{totalProfit >= 0 ? "BULLISH" : "STABLE"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ─── Open Contracts Console ─── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
            <div className="px-8 py-7 border-b border-white/[0.05] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-blue-500" /> Live Asset Hub
                </h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">Real-time trade synchronization</p>
              </div>
              <div className="flex items-center gap-2">
                {isOtpConnected && (
                  <button 
                    onClick={requestProposal} 
                    className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                  >
                    DEPLOY PROPOSAL
                  </button>
                )}
              </div>
            </div>
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {openContracts.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center mb-6">
                    <Clock className="h-8 w-8 text-white/10" />
                  </div>
                  <h4 className="text-lg font-black text-white/40 uppercase tracking-tight">System Ready</h4>
                  <p className="text-white/20 text-sm mt-2 max-w-sm font-medium">Initialize a trajectory to begin populating the asset telemetry interface.</p>
                </div>
              ) : (
                openContracts.map((contract) => (
                  <div
                    key={contract.contract_id}
                    className={`group relative p-6 rounded-[2rem] border transition-all duration-500 ${
                      theme === "dark"
                        ? "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10 shadow-xl"
                        : "bg-gray-50 border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border ${
                            contract.status === "open"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : contract.status === "won"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}>
                            {contract.status === "open" && <span className="inline-block w-1 h-1 rounded-full bg-current mr-1 animate-pulse" />}
                            {contract.status}
                          </div>
                          <span className="text-[10px] font-black text-white/20 tracking-tighter uppercase font-mono">#{contract.contract_id}</span>
                          <span className="text-[10px] font-black text-white/50 tracking-widest uppercase">{contract.contract_type}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">ENTRY ORIGIN</p>
                            <p className="text-sm font-black text-white font-mono tracking-tighter">
                              {contract.entry_price ? contract.entry_price.toFixed(4) : "---"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">CURRENT TELEMETRY</p>
                            <p className="text-sm font-black text-white font-mono tracking-tighter">
                               {contract.current_spot ? Number(contract.current_spot).toFixed(4) : "---"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">DELTA PROFIT</p>
                            <p className={`text-sm font-black font-mono tracking-tighter ${contract.profit && contract.profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              ${contract.profit?.toFixed(2) || "0.00"}
                            </p>
                          </div>
                        </div>
                      </div>
                      {contract.status === "open" && (
                        <button
                          onClick={() => closeContract(contract.contract_id)}
                          className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 text-rose-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg hover:shadow-rose-500/20"
                        >
                          LIQUIDATE
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ─── Real-time Event Stream ─── */}
        <div className="space-y-6">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl h-full flex flex-col">
            <div className="px-8 py-7 border-b border-white/[0.05] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                  <Activity className="h-5 w-5 text-amber-500" /> Event Stream
                </h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">Live Telemetry Ledger</p>
              </div>
            </div>
            <div className="p-6 flex-1 space-y-4 max-h-[400px] overflow-y-auto font-mono text-[10px]">
              {connectionLog.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white/20 uppercase font-black tracking-widest">
                  Awaiting signal...
                </div>
              ) : (
                connectionLog.map((log, idx) => (
                  <div key={idx} className="flex gap-4 p-2 rounded-lg bg-white/[0.02] border border-white/[0.03] animate-in fade-in slide-in-from-right-2">
                    <span className="text-white/20 shrink-0">[{idx.toString().padStart(2, '0')}]</span>
                    <span className="text-white/60 leading-relaxed">{log}</span>
                  </div>
                ))
              )}
            </div>
            <div className="p-6 mt-auto border-t border-white/[0.05] bg-white/[0.01]">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Buffer Status</span>
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> SYNCED
                    </span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
