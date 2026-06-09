'use client';

import React from 'react';
import { StrategyAnalysis, Strategy } from '@/lib/trading/types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface MarketAnalyzerSubTabProps {
  analysisResults: StrategyAnalysis[];
  selectedStrategy: Strategy;
  theme: 'light' | 'dark';
  isLoading: boolean;
}

export default function MarketAnalyzerSubTab({
  analysisResults,
  selectedStrategy,
  theme,
  isLoading
}: MarketAnalyzerSubTabProps) {
  const isDark = theme === 'dark';

  if (isLoading) {
    return (
      <div className={`rounded-lg p-8 text-center ${isDark ? 'bg-white/[0.02] border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
        <div className="animate-spin w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full mx-auto mb-4" />
        <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Analyzing markets...</p>
      </div>
    );
  }

  if (analysisResults.length === 0) {
    return (
      <div className={`rounded-lg p-8 text-center ${isDark ? 'bg-white/[0.02] border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
        <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>No analysis data available. Click "Analyze Now" to start.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {analysisResults.map((analysis) => (
        <AnalysisCard
          key={analysis.market}
          analysis={analysis}
          theme={theme}
        />
      ))}
    </div>
  );
}

interface AnalysisCardProps {
  analysis: StrategyAnalysis;
  theme: 'light' | 'dark';
}

function AnalysisCard({ analysis, theme }: AnalysisCardProps) {
  const isDark = theme === 'dark';
  const signal = analysis.signal;
  const isSignalBuy = signal.signal === 'buy' || signal.signal === 'strong-buy';
  const isStrongSignal = signal.signal === 'strong-buy';

  const signalColors = {
    'strong-buy': isDark ? 'bg-green-500/20 border-green-500/50' : 'bg-green-50 border-green-300',
    'buy': isDark ? 'bg-blue-500/20 border-blue-500/50' : 'bg-blue-50 border-blue-300',
    'hold': isDark ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-yellow-50 border-yellow-300',
    'none': isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'
  };

  const digitStatsData = analysis.digitStats.slice(0, 10).map(d => ({
    name: String(d.digit),
    value: d.percentage,
    count: d.count
  }));

  return (
    <div className={`rounded-xl border p-4 ${signalColors[signal.signal as keyof typeof signalColors]}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {analysis.market.toUpperCase()}
          </h3>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {analysis.strategy.toUpperCase()} Strategy
          </p>
        </div>

        {/* Signal Badge */}
        <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2 ${
          signal.signal === 'strong-buy'
            ? 'bg-green-500/30 text-green-400'
            : signal.signal === 'buy'
              ? 'bg-blue-500/30 text-blue-400'
              : 'bg-gray-500/30 text-gray-400'
        }`}>
          {signal.signal === 'strong-buy' ? (
            <>
              <CheckCircle className="h-4 w-4" /> STRONG BUY
            </>
          ) : signal.signal === 'buy' ? (
            <>
              <TrendingUp className="h-4 w-4" /> BUY
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4" /> NO SIGNAL
            </>
          )}
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <MetricBox
          label="Market Power"
          value={`${analysis.dominantPercentage.toFixed(1)}%`}
          isDark={isDark}
          highlight={analysis.dominantPercentage >= 60}
        />
        <MetricBox
          label="Trend"
          value={analysis.marketTrend.toUpperCase()}
          isDark={isDark}
          highlight={analysis.marketTrend !== 'neutral'}
        />
        <MetricBox
          label="Volatility"
          value={analysis.volatilityLevel.toUpperCase()}
          isDark={isDark}
        />
        <MetricBox
          label="Confidence"
          value={`${signal.confidence.toFixed(0)}%`}
          isDark={isDark}
          highlight={signal.confidence >= 70}
        />
      </div>

      {/* Dominant Side */}
      <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-white/[0.02]' : 'bg-white/50'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-bold uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Dominant Side: {analysis.dominantSide.toUpperCase()}
          </span>
          <span className={`text-xs font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {analysis.dominantPercentage.toFixed(1)}% vs {analysis.recessionPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
            style={{ width: `${analysis.dominantPercentage}%` }}
          />
        </div>
      </div>

      {/* Signal Details */}
      {signal.signal !== 'none' && (
        <div className={`mb-4 p-3 rounded-lg border-l-4 ${
          isStrongSignal
            ? 'border-green-500 bg-green-500/10'
            : 'border-blue-500 bg-blue-500/10'
        }`}>
          <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {signal.reasoning}
          </p>
          {signal.entryPoint !== undefined && (
            <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="font-bold">Entry Point:</span> {signal.entryPoint}
            </p>
          )}
        </div>
      )}

      {/* Digit Distribution Chart */}
      <div className="mb-4">
        <p className={`text-xs font-bold mb-2 uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Digit Distribution
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={digitStatsData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#e5e7eb'} />
            <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} />
            <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                border: `1px solid ${isDark ? '#ffffff20' : '#e2e8f0'}`,
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Last 15 Ticks Line Chart */}
      <div className="mb-4">
        <p className={`text-xs font-bold mb-2 uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Last 15 Ticks Trend
        </p>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={analysis.lastTicks.map((tick, i) => ({ index: i, value: tick }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff10' : '#e5e7eb'} />
            <XAxis dataKey="index" stroke={isDark ? '#94a3b8' : '#64748b'} />
            <YAxis domain={[0, 9]} stroke={isDark ? '#94a3b8' : '#64748b'} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                border: `1px solid ${isDark ? '#ffffff20' : '#e2e8f0'}`,
                borderRadius: '8px'
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Last 7 Digits Cards */}
      <div>
        <p className={`text-xs font-bold mb-2 uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Last 7 Digits
        </p>
        <div className="grid grid-cols-7 gap-1">
          {analysis.lastTicks.slice(-7).map((digit, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg text-center ${
                digit >= 5
                  ? isDark ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-100 text-blue-900'
                  : isDark ? 'bg-orange-500/30 text-orange-300' : 'bg-orange-100 text-orange-900'
              }`}
            >
              <div className="text-xs font-black">{digit}</div>
              <div className={`text-[9px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                {digit >= 5 ? 'Over' : 'Under'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MetricBoxProps {
  label: string;
  value: string;
  isDark: boolean;
  highlight?: boolean;
}

function MetricBox({ label, value, isDark, highlight }: MetricBoxProps) {
  return (
    <div className={`p-2 rounded-lg text-center ${
      highlight
        ? isDark ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-blue-50 border border-blue-300'
        : isDark ? 'bg-white/[0.03]' : 'bg-gray-50'
    }`}>
      <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        {label}
      </p>
      <p className={`text-sm font-black mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}
