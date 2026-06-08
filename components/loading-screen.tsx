"use client"

import { useState, useEffect, useRef } from "react"
import { CheckCircle2, Zap } from "lucide-react"

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState(".")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const progressRef = useRef(0)

  const steps = [
    "Connection",
    "Markets",
    "Analysis",
    "Security",
    "Launch",
  ]

  /* ── Animated dots ── */
  useEffect(() => {
    const t = setInterval(() => {
      setDots(d => (d.length >= 3 ? "." : d + "."))
    }, 480)
    return () => clearInterval(t)
  }, [])

  /* ── Canvas particle network ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf: number
    let W = (canvas.width = window.innerWidth)
    let H = (canvas.height = window.innerHeight)

    type P = { x: number; y: number; vx: number; vy: number; r: number; hue: number; a: number }
    const ps: P[] = Array.from({ length: 50 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.2 + 0.3,
      hue: [195, 210, 220][Math.floor(Math.random() * 3)],
      a: Math.random() * 0.15 + 0.05,
    }))

    const onResize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
    }
    window.addEventListener("resize", onResize)

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ps.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue},80%,65%,${p.a})`
        ctx.fill()
        for (let j = i + 1; j < ps.length; j++) {
          const q = ps[j]
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 120) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `hsla(200,75%,65%,${0.05 * (1 - d / 120)})`
            ctx.lineWidth = 0.4
            ctx.stroke()
          }
        }
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      window.removeEventListener("resize", onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  /* ── Loading sequence ── */
  useEffect(() => {
    const animateTo = (target: number, ms: number) =>
      new Promise<void>(res => {
        const from = progressRef.current
        const start = Date.now()
        const tick = () => {
          const t = Math.min((Date.now() - start) / ms, 1)
          const eased = 1 - Math.pow(1 - t, 3)
          const cur = from + (target - from) * eased
          progressRef.current = cur
          setProgress(cur)
          if (t < 1) requestAnimationFrame(tick)
          else res()
        }
        requestAnimationFrame(tick)
      })

    const sequence = async () => {
      await new Promise(r => setTimeout(r, 400))
      for (let i = 0; i < steps.length; i++) {
        await animateTo((i + 1) * (100 / steps.length), 600)
        await new Promise(r => setTimeout(r, 80))
      }
      await new Promise(r => setTimeout(r, 400))
      onComplete()
    }
    sequence()
  }, [])

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#030508] select-none">

      {/* Canvas particles */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-50" />

      {/* Background glows */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-600/[0.08] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.06] blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center gap-12">

        {/* Glowing core orb */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Outer glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/10 blur-3xl animate-pulse" style={{ animationDuration: "2.5s" }} />
          
          {/* Rotating rings */}
          <div
            className="absolute w-[160px] h-[160px] rounded-full border border-blue-500/30"
            style={{ animation: "spin 20s linear infinite" }}
          />
          <div
            className="absolute w-32 h-32 rounded-full border border-cyan-400/25"
            style={{ animation: "spin 12s linear infinite reverse" }}
          />

          {/* Central icon */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center border border-white/20 shadow-[0_0_40px_rgba(59,130,246,0.5)]">
            <Zap className="w-10 h-10 text-white drop-shadow-lg" />
          </div>

          {/* Orbiting dots */}
          <div className="absolute w-full h-full" style={{ animation: "spin 3s linear infinite" }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
          </div>
        </div>

        {/* Brand section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black tracking-tight">
            <span className="text-white">ANALYSIS</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">TOOL PRO</span>
          </h1>
          <p className="text-sm font-bold text-white/40 tracking-wider uppercase">
            Initializing Advanced Trading Intelligence
          </p>
        </div>

        {/* Progress section */}
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-300/70 uppercase tracking-widest">
              Loading{dots}
            </span>
            <span className="text-sm font-black text-white font-mono">
              {Math.round(progress)}<span className="text-xs text-white/30 ml-1">%</span>
            </span>
          </div>

          {/* Main progress bar */}
          <div className="relative h-1.5 w-full rounded-full bg-white/5 border border-white/10 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.7)]"
              style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
            />
            {/* Shimmer effect */}
            <div
              className="absolute inset-y-0 w-20 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{ left: `${Math.max(0, progress - 10)}%`, transition: "left 0.1s linear" }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-between gap-2 mt-6">
            {steps.map((step, idx) => {
              const isComplete = (idx + 1) * (100 / steps.length) < progress
              const isActive = Math.abs((idx + 1) * (100 / steps.length) - progress) < 20
              return (
                <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className={`h-2 w-full rounded-full transition-all duration-300 ${
                    isComplete ? "bg-gradient-to-r from-cyan-400 to-blue-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" :
                    isActive ? "bg-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.5)]" :
                    "bg-white/10"
                  }`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                    isComplete ? "text-cyan-400" : isActive ? "text-blue-400" : "text-white/20"
                  }`}>
                    {step}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Status message */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
          <span className="text-xs font-bold text-white/50 tracking-wider uppercase">System Ready</span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
