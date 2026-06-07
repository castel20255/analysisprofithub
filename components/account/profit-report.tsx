"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useDerivAPI } from "@/lib/deriv-api-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCcw, TrendingUp, TrendingDown, BarChart3, Calendar, Cpu, Zap, Activity, Target, ShieldCheck } from "lucide-react"
import { format, subDays, subMonths, subYears } from "date-fns"

interface ProfitTableTransaction {
    app_id: number
    buy_price: number
    contract_id: number
    contract_type: string
    display_name: string
    longcode: string
    payout: number
    profit_loss: number
    purchase_time: number
    sell_price: number
    sell_time: number
    shortcode: string
    transaction_id: number
}

interface ProfitReportProps {
    theme?: "light" | "dark"
}

const QUICK_PRESETS = [
    { label: "Today", getRange: () => ({ from: new Date(new Date().setHours(0, 0, 0, 0)), to: new Date() }) },
    { label: "7 Days", getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
    { label: "30 Days", getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
    { label: "3 Months", getRange: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
    { label: "1 Year", getRange: () => ({ from: subYears(new Date(), 1), to: new Date() }) },
]

export function ProfitReport({ theme = "dark" }: ProfitReportProps) {
    const { apiClient, isAuthorized, activeLoginId, balance } = useDerivAPI()
    const [profitTable, setProfitTable] = useState<ProfitTableTransaction[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activePreset, setActivePreset] = useState("30 Days")
    const [customFrom, setCustomFrom] = useState("")
    const [customTo, setCustomTo] = useState("")
    const [showCustom, setShowCustom] = useState(false)

    const fetchProfitTable = useCallback(async (dateFrom?: number, dateTo?: number) => {
        if (!apiClient || !isAuthorized) return

        setIsLoading(true)
        setError(null)
        try {
            const response = await apiClient.getProfitTable(50, 0, dateFrom, dateTo)
            if (response && response.transactions) {
                setProfitTable(response.transactions)
            } else {
                setProfitTable([])
            }
        } catch (err: any) {
            console.error("[v0] Error fetching profit table:", err)
            setError(err?.message || "Failed to fetch profit table")
        } finally {
            setIsLoading(false)
        }
    }, [apiClient, isAuthorized])

    const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
        setActivePreset(preset.label)
        setShowCustom(false)
        const { from, to } = preset.getRange()
        fetchProfitTable(Math.floor(from.getTime() / 1000), Math.floor(to.getTime() / 1000))
    }

    const applyCustom = () => {
        if (!customFrom || !customTo) return
        const from = new Date(customFrom)
        const to = new Date(customTo)
        to.setHours(23, 59, 59, 999)
        fetchProfitTable(Math.floor(from.getTime() / 1000), Math.floor(to.getTime() / 1000))
        setActivePreset("Custom")
        setShowCustom(false)
    }

    useEffect(() => {
        const from = subDays(new Date(), 30)
        fetchProfitTable(Math.floor(from.getTime() / 1000))
    }, [fetchProfitTable, activeLoginId])

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }

    const formatCurrency = (val: number | undefined | null) => {
        const safeVal = val == null || isNaN(Number(val)) ? 0 : Number(val)
        return safeVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    const getContractTypeBadge = (type: string) => {
        const t = type || ""
        if (t.includes("CALL")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        if (t.includes("PUT")) return "bg-rose-500/10 text-rose-400 border-rose-500/20"
        if (t.includes("DIGIT")) return "bg-blue-500/10 text-blue-400 border-blue-500/20"
        return "bg-white/5 text-slate-400 border-white/10"
    }

    const totalProfit = useMemo(() => profitTable.reduce((acc, tx) => acc + (tx.profit_loss ?? 0), 0), [profitTable])
    const successRate = profitTable.length > 0 ? (profitTable.filter(tx => (tx.profit_loss ?? 0) > 0).length / profitTable.length) * 100 : 0
    const avgProfit = profitTable.length > 0 ? totalProfit / profitTable.length : 0

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header & Filter Controls */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                        <Cpu className="h-6 w-6 text-indigo-500" /> Nexus Intel
                    </h3>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-1">Algorithmic profit trajectory synchronization</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 bg-white/[0.02] border border-white/5 p-1.5 rounded-2xl">
                    {QUICK_PRESETS.map(p => (
                        <button
                            key={p.label}
                            onClick={() => applyPreset(p)}
                            className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activePreset === p.label 
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                                : "text-white/40 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button
                        onClick={() => setShowCustom(!showCustom)}
                        className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                            showCustom 
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                            : "text-white/40 hover:text-white hover:bg-white/5"
                        }`}
                    >
                        <Calendar className="h-3 w-3" />
                        Custom
                    </button>
                    <button
                        onClick={() => { const p = QUICK_PRESETS.find(p => p.label === activePreset); if (p) applyPreset(p) }}
                        disabled={isLoading}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {showCustom && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-white/[0.03] border border-white/10 rounded-[2rem] animate-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                        <label className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] ml-1">Temporal Start</label>
                        <input
                            type="date"
                            value={customFrom}
                            onChange={e => setCustomFrom(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] ml-1">Temporal End</label>
                        <input
                            type="date"
                            value={customTo}
                            onChange={e => setCustomTo(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={applyCustom}
                            disabled={!customFrom || !customTo}
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:grayscale"
                        >
                            APPLY FILTER
                        </button>
                    </div>
                </div>
            )}

            {/* Intel Summary Scorecards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "EXECUTIONS", value: profitTable.length, color: "text-blue-400", bgColor: "bg-blue-500/5", borderColor: "border-blue-500/20", icon: <Zap className="h-5 w-5" /> },
                    { label: "NET REVENUE", value: `${totalProfit >= 0 ? "+" : ""}${formatCurrency(totalProfit)}`, color: totalProfit >= 0 ? "text-emerald-400" : "text-rose-400", bgColor: totalProfit >= 0 ? "bg-emerald-500/5" : "bg-rose-500/5", borderColor: totalProfit >= 0 ? "border-emerald-500/20" : "border-rose-500/20", icon: <Target className="h-5 w-5" /> },
                    { label: "QUOTIENT", value: `${successRate.toFixed(1)}%`, color: "text-indigo-400", bgColor: "bg-indigo-500/5", borderColor: "border-indigo-500/20", icon: <Activity className="h-5 w-5" /> },
                    { label: "AVG DELTA", value: formatCurrency(avgProfit), color: "text-purple-400", bgColor: "bg-purple-500/5", borderColor: "border-purple-500/20", icon: <ShieldCheck className="h-5 w-5" /> },
                ].map((s, i) => (
                    <div key={i} className={`group relative overflow-hidden rounded-[2rem] border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${s.bgColor} ${s.borderColor}`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 transition-transform group-hover:scale-125">{s.icon}</div>
                        <div className="relative p-6">
                            <div className={`${s.color} mb-4 drop-shadow-[0_0_8px_currentColor] opacity-70`}>{s.icon}</div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1 leading-none">{s.label}</p>
                            <p className={`text-2xl font-black tracking-tighter tabular-nums ${s.color}`}>{s.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {error && (
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Intel Error: {error}
                </div>
            )}

            {/* Intelligence Ledger Table */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-white/[0.02]">
                            <TableRow className="hover:bg-transparent border-white/[0.05] h-14">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30 pl-8">Exit Point</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30">Asset Class</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-white/30">Protocol</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-white/30">Purchase ($)</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-white/30">Settlement ($)</TableHead>
                                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-white/30 pr-8">Net Trajectory ($)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i} className="border-white/[0.03]">
                                        <TableCell className="pl-8"><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16 bg-white/5" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20 ml-auto bg-white/5" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20 ml-auto bg-white/5" /></TableCell>
                                        <TableCell className="pr-8"><Skeleton className="h-4 w-24 ml-auto bg-white/5" /></TableCell>
                                    </TableRow>
                                ))
                            ) : profitTable.length > 0 ? (
                                profitTable.map((tx) => (
                                    <TableRow key={tx.contract_id} className="border-white/[0.03] group/row transition-all hover:bg-white/[0.015]">
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-white/60 tracking-tighter">{formatDate(tx.sell_time).split(',')[0]}</span>
                                                <span className="text-[9px] font-bold text-white/20 uppercase">{formatDate(tx.sell_time).split(',')[1]}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[11px] font-black text-white uppercase tracking-tight group-hover:text-white/80 transition-colors">
                                                {tx.display_name}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${getContractTypeBadge(tx.contract_type)}`}>
                                                {tx.contract_type.replace(/_/g, " ")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-[11px] font-mono font-bold text-white/30 tabular-nums">
                                                {formatCurrency(tx.buy_price)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-[11px] font-mono font-bold text-white/30 tabular-nums">
                                                {formatCurrency(tx.sell_price)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className={`flex items-center justify-end gap-2 text-sm font-black tracking-tighter tabular-nums ${(tx.profit_loss ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                                {(tx.profit_loss ?? 0) >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                                {formatCurrency(tx.profit_loss)}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-[1.5rem] flex items-center justify-center mb-6">
                                                <BarChart3 className="h-8 w-8 text-white/10" />
                                            </div>
                                            <h4 className="text-lg font-black text-white/40 uppercase tracking-tight">Intel History Null</h4>
                                            <p className="text-white/20 text-xs mt-2 max-w-sm font-medium">
                                                {isAuthorized 
                                                  ? "No transactional trajectory data found in the current temporal frame." 
                                                  : "Authorization required to synchronize profit intelligence ledger."}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                
                {/* Intel Footer */}
                <div className="px-8 py-5 border-t border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b881]" />
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Protocol Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Activity className="h-3 w-3 text-white/20" />
                           <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{profitTable.length} Executions Indexed</span>
                        </div>
                    </div>
                    <div className="text-[9px] font-black text-white/20 uppercase tracking-widest font-mono">
                        INTEL_MODULE_v4.5.X
                    </div>
                </div>
            </div>
        </div>
    )
}
