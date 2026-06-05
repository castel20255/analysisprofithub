"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Zap, Globe, Cpu, Rocket, Activity } from "lucide-react"
import Image from "next/image"

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
        const current = start + (target - start) * ratio
        setProgress(current)
        if (ratio < 1) requestAnimationFrame(update)
        else resolve()
      }
      requestAnimationFrame(update)
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#02040a] overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50" />
      </div>

      <AnimatePresence mode="wait">
        {isInitializing ? (
          <motion.div
            key="init"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center justify-center space-y-6 sm:space-y-8"
          >
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 border-t-2 border-r-2 border-blue-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-bold tracking-[0.3em] text-white uppercase italic">Initializing System</h2>
              <p className="text-[9px] sm:text-[10px] text-blue-400/60 tracking-[0.5em] mt-2 uppercase">Core Protocol V2.0</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-4xl px-6 sm:px-8 flex flex-col items-center"
          >
            {/* Header */}
            <div className="text-center mb-8 sm:mb-16">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-4 sm:mb-6 flex justify-center"
              >
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 drop-shadow-[0_0_15px_rgba(37,99,235,0.8)]" />
                </div>
              </motion.div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-2xl sm:text-5xl font-black italic tracking-tighter text-white uppercase"
              >
                ANALYSIS<span className="text-blue-500 text-glow">TOOLPRO</span>
              </motion.h1>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                className="h-[1px] bg-linear-to-r from-transparent via-blue-500 to-transparent mt-4 opacity-50"
              />
            </div>

            {/* Glowing Step Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 w-full mb-8 sm:mb-12">
              {steps.map((step, idx) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative p-3 sm:p-6 rounded-2xl border transition-all duration-500 overflow-hidden group ${step.status === "complete"
                    ? "bg-blue-600/10 border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]"
                    : step.status === "loading"
                      ? "bg-slate-900 border-blue-500/50 shadow-[0_0_30px_rgba(37,99,235,0.2)] scale-105 z-10"
                      : "bg-black/40 border-white/5 opacity-40"
                    } ${idx === 4 && steps.length % 2 !== 0 ? "col-span-2 sm:col-span-1" : ""}`}
                >
                  {/* Subtle Glow Overlay */}
                  {step.status === "loading" && (
                    <motion.div
                      layoutId="glow"
                      className="absolute inset-0 bg-blue-500/5 animate-pulse"
                    />
                  )}

                  <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                    <div className={`w-7 h-7 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-colors ${step.status === "complete" ? "text-blue-400" :
                      step.status === "loading" ? "text-blue-500" : "text-slate-600"
                      }`}>
                      <step.icon className={`h-4 w-4 sm:h-6 sm:w-6 ${step.status === "loading" ? "animate-bounce" : ""}`} />
                    </div>
                    <div>
                      <h3 className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${step.status === "loading" ? "text-blue-400" : "text-white/60"
                        }`}>
                        {step.label.split(' ')[0]}
                      </h3>
                      <p className="text-[7px] sm:text-[8px] text-white/30 truncate mt-0.5 sm:mt-1">{step.label.split(' ').slice(1).join(' ')}</p>
                    </div>
                  </div>

                  {step.status === "loading" && (
                    <div className="absolute bottom-0 left-0 h-1 bg-blue-500 animate-[loading-bar_1.5s_infinite]" style={{ width: "100%" }} />
                  )}
                </motion.div>
              ))}
            </div>

            {/* Master Progress */}
            <div className="w-full max-w-md">
              <div className="flex justify-between items-end mb-2 sm:mb-3">
                <span className="text-[9px] sm:text-[10px] font-bold text-blue-500/70 tracking-[0.15em] sm:tracking-[0.2em] uppercase">Integration</span>
                <span className="text-lg sm:text-xl font-black text-white italic">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 sm:h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px] sm:p-[2px] border border-white/5">
                <motion.div
                  className="h-full bg-linear-to-r from-blue-600 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 sm:bottom-12 text-center opacity-30">
        <p className="text-[8px] sm:text-[9px] text-blue-100 uppercase tracking-[0.3em] sm:tracking-[0.5em] font-medium">Secured by Quantum Guard</p>
      </div>

      <style jsx global>{`
        .text-glow {
          text-shadow: 0 0 20px rgba(37, 99, 235, 0.5);
        }
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
