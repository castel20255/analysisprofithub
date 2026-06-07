"use client"

import { useState, useEffect, useRef } from "react"
import { Shield, Zap, Globe, Cpu, Rocket, Activity, Wifi } from "lucide-react"

interface LoadingStep {
  id: string
  label: string
  sublabel: string
  status: "pending" | "loading" | "complete"
  icon: any
  color: string
}

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentStepIdx, setCurrentStepIdx] = useState(-1)
  const [showMain, setShowMain] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: "connect", label: "Secure Connection", sublabel: "Establishing encrypted WebSocket", status: "pending", icon: Globe, color: "#6366f1" },
    { id: "markets", label: "Market Feeds", sublabel: "Calibrating live data streams", status: "pending", icon: Wifi, color: "#06b6d4" },
    { id: "analyze", label: "Quantum Engine", sublabel: "Initializing analysis modules", status: "pending", icon: Cpu, color: "#8b5cf6" },
    { id: "account", label: "Authentication", sublabel: "Verifying secure credentials", status: "pending", icon: Shield, color: "#10b981" },
    { id: "finalize", label: "Interface Ready", sublabel: "Launching trading terminal", status: "pending", icon: Rocket, color: "#f59e0b" },
  ])

  // ── Canvas particles ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf: number
    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; hue: number; alpha: number }
    const particles: Particle[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: Math.random() * 1.8 + 0.4,
      hue: Math.random() > 0.5 ? 245 : 195,
      alpha: Math.random() * 0.25 + 0.05,
    }))

    const onResize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener("resize", onResize)

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.alpha})`
        ctx.fill()
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 130) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `hsla(240, 80%, 65%, ${0.08 * (1 - d / 130)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { window.removeEventListener("resize", onResize); cancelAnimationFrame(raf) }
  }, [])

  const progressRef = useRef(0)

  // ── Loading sequence ────────────────────────────────────────────────
  useEffect(() => {
    const animateTo = (target: number, ms: number) =>
      new Promise<void>(res => {
        const from = progressRef.current
        const start = Date.now()
        const tick = () => {
          const elapsed = Math.min((Date.now() - start) / ms, 1)
          const eased = 1 - Math.pow(1 - elapsed, 3)
          const current = from + (target - from) * eased
          progressRef.current = current
          setProgress(current)
          if (elapsed < 1) requestAnimationFrame(tick)
          else res()
        }
        requestAnimationFrame(tick)
      })

    const sequence = async () => {
      await new Promise(r => setTimeout(r, 700))
      setShowMain(true)

      for (let i = 0; i < steps.length; i++) {
        setCurrentStepIdx(i)
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: "loading" } : s))
        await animateTo((i + 1) * (100 / steps.length), 650)
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: "complete" } : s))
        await new Promise(r => setTimeout(r, 120))
      }

      await new Promise(r => setTimeout(r, 500))
      onComplete()
    }

    sequence()
  }, [])

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-[#020408] select-none">

      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Ambient Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 blur-[160px] rounded-full" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-violet-600/5 blur-[120px] rounded-full" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px"
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center">

        {/* ── Central Orb ── */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-10">
          {/* Outermost ping ring */}
          <div className="absolute inset-0 rounded-full border border-indigo-500/10 animate-ping" style={{ animationDuration: "3s" }} />
          {/* Dashed slow spin ring */}
          <div className="absolute w-36 h-36 border border-dashed border-indigo-500/20 rounded-full" style={{ animation: "spin 50s linear infinite" }} />
          {/* Fast inner ring */}
          <div className="absolute w-28 h-28 border border-cyan-400/30 rounded-full" style={{ animation: "spin 10s linear infinite reverse" }} />
          {/* Medium ring */}
          <div className="absolute w-32 h-32 border border-violet-500/20 rounded-full" style={{ animation: "spin 22s linear infinite" }} />
          {/* Glowing core */}
          <div className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600/40 via-blue-500/30 to-cyan-400/20 blur-xl animate-pulse" />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)] border border-white/10">
            <Activity className="w-6 h-6 text-white animate-pulse" />
          </div>
          {/* Orbiting dot */}
          <div className="absolute w-full h-full" style={{ animation: "spin 5s linear infinite" }}>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          </div>
        </div>

        {/* ── Brand ── */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-6xl font-black tracking-[-0.04em] text-white uppercase leading-none">
            ANALYSIS
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(99,102,241,0.4)]">
              TOOLPRO
            </span>
          </h1>
          <p className="mt-3 text-[9px] sm:text-[10px] font-black tracking-[0.4em] text-white/25 uppercase">
            Quantum Analytics Engine · v4.5
          </p>
        </div>

        {/* ── Progress Bar ── */}
        <div className="w-full bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-8 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400/70">
              {steps[currentStepIdx]?.sublabel || "Initializing…"}
            </span>
            <span className="text-xl font-black text-white tabular-nums font-mono">
              {Math.round(progress)}
              <span className="text-sm text-white/30 ml-0.5">%</span>
            </span>
          </div>
          <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
            {/* Animated shimmer */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute inset-y-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-20 rounded-full"
              style={{ left: `${Math.max(0, progress - 10)}%`, transition: "left 0.1s linear" }}
            />
          </div>
        </div>

        {/* ── Step Cards ── */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-5 gap-2">
          {steps.map((step, i) => {
            const Icon = step.icon
            const isComplete = step.status === "complete"
            const isActive = step.status === "loading"
            return (
              <div
                key={step.id}
                className={`flex sm:flex-col items-center sm:items-center gap-3 sm:gap-2 px-4 sm:px-3 py-3 sm:py-4 rounded-2xl border transition-all duration-500 ${
                  isComplete
                    ? "bg-indigo-950/30 border-indigo-500/20 scale-100"
                    : isActive
                    ? "bg-slate-900/60 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.08)] scale-[1.03]"
                    : "bg-white/[0.01] border-white/5 opacity-30"
                }`}
              >
                <div
                  className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    isComplete ? "bg-indigo-500/15 shadow-[0_0_10px_rgba(99,102,241,0.2)]" :
                    isActive ? "bg-cyan-500/10 animate-pulse" : "bg-white/5"
                  }`}
                  style={{ color: isComplete ? step.color : isActive ? "#22d3ee" : "#374151" }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="sm:text-center">
                  <p className={`text-[10px] font-black uppercase tracking-wider leading-none mb-0.5 ${
                    isComplete ? "text-indigo-300" : isActive ? "text-cyan-300" : "text-white/20"
                  }`}>
                    {step.label}
                  </p>
                  {isComplete && (
                    <div className="flex sm:justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center z-10">
        <p className="text-[8px] tracking-[0.5em] uppercase font-black text-white/15 font-mono">
          SECURE · ENCRYPTED · LIVE
        </p>
      </div>
    </div>
  )
}
