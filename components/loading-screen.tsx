"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Zap, Globe, Cpu, Rocket, Activity } from "lucide-react"

interface LoadingStep {
  id: string
  label: string
  status: "pending" | "loading" | "complete"
  icon: any
}

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)
  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: "connect", label: "Establishing Secure Link", status: "pending", icon: Globe },
    { id: "markets", label: "Calibrating Market Feeds", status: "pending", icon: Zap },
    { id: "analyze", label: "Quantum Analysis Engaged", status: "pending", icon: Cpu },
    { id: "account", label: "Verifying Authentication", status: "pending", icon: Shield },
    { id: "finalize", label: "Launching Interface", status: "pending", icon: Rocket },
  ])

  // Canvas particle logic for premium background
  useEffect(() => {
    const canvas = document.getElementById("loading-canvas") as HTMLCanvasElement
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = []
    const particleCount = 50

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
      })
    }

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener("resize", handleResize)

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = "rgba(99, 102, 241, 0.15)"
      ctx.strokeStyle = "rgba(99, 102, 241, 0.04)"

      particles.forEach((p, idx) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y)
          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      })

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  useEffect(() => {
    const sequence = async () => {
      // Phase 0: Initializing Glow
      await new Promise(resolve => setTimeout(resolve, 1500))
      setIsInitializing(false)

      // Phase 1: Progressive Loading
      for (let i = 0; i < steps.length; i++) {
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: "loading" } : s))
        const stepProgress = (i + 1) * (100 / steps.length)
        await animateTo(stepProgress, 800)
        setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: "complete" } : s))
      }

      await new Promise(resolve => setTimeout(resolve, 800))
      onComplete()
    }

    sequence()
  }, [])

  const animateTo = (target: number, duration: number) => {
    return new Promise<void>(resolve => {
      const start = progress
      const startTime = Date.now()

      const update = () => {
        const elapsed = Date.now() - startTime
        const ratio = Math.min(elapsed / duration, 1)
        // Easy-out ease curve
        const t = 1 - Math.pow(1 - ratio, 3)
        const current = start + (target - start) * t
        setProgress(current)
        if (ratio < 1) requestAnimationFrame(update)
        else resolve()
      }
      requestAnimationFrame(update)
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#05070f] overflow-hidden select-none">
      {/* Canvas Particle Background */}
      <canvas id="loading-canvas" className="absolute inset-0 z-0 pointer-events-none opacity-60" />

      {/* Blurred glow shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-4xl z-10 px-6 sm:px-8 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {isInitializing ? (
            <motion.div
              key="init"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center space-y-6"
            >
              <div className="relative flex items-center justify-center">
                {/* Advanced spinner rings */}
                <div className="w-24 h-24 border-2 border-indigo-500/20 border-t-indigo-500 border-r-indigo-500 rounded-full animate-spin" />
                <div className="absolute w-18 h-18 border border-cyan-500/20 border-b-cyan-400 border-l-cyan-400 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-sm font-black tracking-[0.4em] text-white/80 uppercase">Initializing System</h2>
                <p className="text-[9px] font-black text-indigo-400/50 tracking-[0.6em] mt-2 uppercase">Protocol v2.0</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center"
            >
              {/* Branding Section */}
              <div className="text-center mb-12 sm:mb-16">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
                  className="mb-6 flex justify-center"
                >
                  <div className="relative w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                    <Activity className="w-9 h-9 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
                  </div>
                </motion.div>
                
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase"
                >
                  ANALYSIS<span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent text-glow">TOOLPRO</span>
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: 0.3 }}
                  className="text-[10px] sm:text-xs text-indigo-200 tracking-[0.4em] uppercase mt-2 font-bold"
                >
                  Universal Intelligent Trading Terminal
                </motion.p>
                
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "80px" }}
                  transition={{ delay: 0.4 }}
                  className="h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent mx-auto mt-4"
                />
              </div>

              {/* Glassmorphic Step Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 w-full mb-10 sm:mb-14">
                {steps.map((step, idx) => {
                  const Icon = step.icon
                  const isComplete = step.status === "complete"
                  const isLoading = step.status === "loading"
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 + 0.3 }}
                      className={`relative p-4 sm:p-5 rounded-2xl border transition-all duration-500 overflow-hidden backdrop-blur-md group ${
                        isComplete
                          ? "bg-indigo-950/20 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
                          : isLoading
                            ? "bg-slate-900/80 border-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.15)] scale-105 z-10"
                            : "bg-white/[0.01] border-white/5 opacity-30"
                      } ${idx === 4 && steps.length % 2 !== 0 ? "col-span-2 sm:col-span-1" : ""}`}
                    >
                      {/* Top highlight bar */}
                      {isLoading && (
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-400" />
                      )}

                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          isComplete ? "bg-indigo-500/10 text-indigo-400" :
                          isLoading ? "bg-indigo-500/20 text-cyan-400" : "text-white/20"
                        }`}>
                          <Icon className={`h-5 w-5 ${isLoading ? "animate-pulse" : ""}`} />
                        </div>
                        <div>
                          <h3 className={`text-[10px] font-black uppercase tracking-wider ${
                            isLoading ? "text-cyan-400" : isComplete ? "text-white/95" : "text-white/40"
                          }`}>
                            {step.label.split(' ')[0]}
                          </h3>
                          <p className="text-[8px] text-white/30 truncate mt-0.5 leading-none">
                            {step.label.split(' ').slice(1).join(' ')}
                          </p>
                        </div>
                      </div>

                      {isLoading && (
                        <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-400 animate-[loading-bar_1.5s_infinite]" style={{ width: "100%" }} />
                      )}
                    </motion.div>
                  )
                })}
              </div>

              {/* Progress HUD */}
              <div className="w-full max-w-md bg-white/[0.02] border border-white/5 p-5 rounded-2xl backdrop-blur-md">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-[9px] font-black text-indigo-400/80 tracking-[0.2em] uppercase">Boot Sequence</span>
                  <span className="text-xl font-black text-white tracking-tighter tabular-nums italic">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-8 text-center opacity-40 z-10">
        <p className="text-[8px] text-indigo-300 uppercase tracking-[0.5em] font-black">
          Secured by Quantum Shield
        </p>
      </div>

      <style jsx global>{`
        .text-glow {
          text-shadow: 0 0 30px rgba(99, 102, 241, 0.4);
        }
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
