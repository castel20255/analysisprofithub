"use client"

import { motion } from "framer-motion"
import React from "react"
import { Activity, Star, Sparkles, Globe } from "lucide-react"

export interface WelcomeScreenProps {
  onContinue?: () => void
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center bg-gradient-to-b from-[#030313] via-[#05051a] to-[#071027] p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-3xl rounded-3xl border border-white/6 bg-gradient-to-br from-white/3 to-white/2 backdrop-blur-md p-8 shadow-2xl"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-cyan-400/5 border border-white/6">
            <Activity className="w-10 h-10 text-indigo-400 drop-shadow-lg" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">AnalysisToolPro</span></h1>
            <p className="mt-2 text-sm text-indigo-200/80">Fast, adaptive analytics and intelligent trade automation — powered by clean data and reliable execution.</p>

            <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
              <button
                onClick={() => onContinue && onContinue()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white font-bold shadow hover:shadow-md transition"
              >
                <Sparkles className="w-4 h-4" />
                Continue
              </button>

              <button
                onClick={() => window.open('https://your-docs.example.com', '_blank')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-indigo-200 font-semibold border border-white/6 hover:bg-white/6 transition"
              >
                <Globe className="w-4 h-4" />
                Docs
              </button>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-center gap-2">
            <div className="text-center text-xs text-indigo-200/60">Powered by</div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-300" />
              <span className="text-sm font-semibold text-white/90">Quantum Shield</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
