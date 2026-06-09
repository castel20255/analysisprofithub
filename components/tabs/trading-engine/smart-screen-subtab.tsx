'use client';

import React from 'react';
import { SmartScreenData } from '@/lib/trading/types';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SmartScreenSubTabProps {
  smartScreenData: SmartScreenData | null;
  theme: 'light' | 'dark';
  isLoading: boolean;
}

export default function SmartScreenSubTab({
  smartScreenData,
  theme,
  isLoading
}: SmartScreenSubTabProps) {
  const isDark = theme === 'dark';

  if (isLoading || !smartScreenData) {
    return (
      <div className={`rounded-lg p-8 text-center ${isDark ? 'bg-white/[0.02] border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
        <div className="animate-spin w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full mx-auto mb-4" />
        <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Scanning markets...</p>
      </div>
    );
  }

  const sentimentColors = {
    'very-bullish': { bg: isDark ? 'bg-green-500/20' : 'bg-green-50', border: 'border-green-500/50', text: isDark ? 'text-green-300' : 'text-green-700' },
    'bullish': { bg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-50', border: 'border-emerald-500/50', text: isDark ? 'text-emerald-300' : 'text-emerald-700' },
    'neutral': { bg: isDark ? 'bg-yellow-500/20' : 'bg-yellow-50', border: 'border-yellow-500/50', text: isDark ? 'text-yellow-300' : 'text-yellow-700' },
    'bearish': { bg: isDark ? 'bg-orange-500/20' : 'bg-orange-50', border: 'border-orange-500/50', text: isDark ? 'text-orange-300' : 'text-orange-700' },
    'very-bearish': { bg: isDark ? 'bg-red-500/20' : 'bg-red-50', border: 'border-red-500/50', text: isDark ? 'text-red-300' : 'text-red-700' }
  };

  const colors = sentimentColors[smartScreenData.overallMarketSentiment];

  return (
    <div className="space-y-4">
      {/* Overall Sentiment */}
      <div className={`rounded-xl border p-6 ${colors.bg} border-${colors.border}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-black ${colors.text}`}>
            Overall Market Sentiment
          </h3>
          {smartScreenData.overallMarketSentiment.includes('bullish') ? (
            <TrendingUp className={`h-8 w-8 ${colors.text}`} />
          ) : smartScreenData.overallMarketSentiment.includes('bearish') ? (
            <TrendingDown className={`h-8 w-8 ${colors.text}`} />
          ) : (
            <AlertCircle className={`h-8 w-8 ${colors.text}`} />
          )}
        </div>
        <p className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {smartScreenData.overallMarketSentiment.replace('-', ' ').toUpperCase()}
        </p>
      </div>

      {/* Best Opportunity */}
      {smartScreenData.bestOpportunity && (
        <div className={`rounded-xl border p-6 ${isDark ? 'bg-green-500/10 border-green-500/50' : 'bg-green-50 border-green-300'}`}>
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle2 className={`h-6 w-6 flex-shrink-0 mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            <div>
              <h4 className={`text-lg font-bold ${isDark ? 'text-green-200' : 'text-green-900'}`}>
                Best Opportunity
              </h4>
              <p className={`text-sm mt-1 ${isDark ? 'text-green-300/80' : 'text-green-800'}`}>
                {smartScreenData.bestOpportunity.market.toUpperCase()} - {smartScreenData.bestOpportunity.strategy.toUpperCase()}
              </p>
              <p className={`text-xs mt-2 font-mono ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                Confidence: {smartScreenData.bestOpportunity.confidence.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Safe Markets */}
      {smartScreenData.safeMarkets.length > 0 && (
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-xs font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Safe Zones
          </p>
          <div className="flex flex-wrap gap-2">
            {smartScreenData.safeMarkets.map(market => (
              <span
                key={market}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  isDark
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {market.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Markets */}
      {smartScreenData.recommendedMarkets.length > 0 && (
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-xs font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Recommended Markets
          </p>
          <div className="flex flex-wrap gap-2">
            {smartScreenData.recommendedMarkets.map(market => (
              <span
                key={market}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  isDark
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {market.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Market Power Heatmap */}
      <div>
        <p className={`text-xs font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Market Power Analysis
        </p>
        <div className="space-y-2">
          {smartScreenData.markets.map(market => (
            <MarketPowerCard
              key={market.market}
              market={market}
              theme={theme}
            />
          ))}
        </div>
      </div>

      {/* Risky Markets Warning */}
      {smartScreenData.riskyMarkets.length > 0 && (
        <div className={`rounded-xl border p-4 ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-2">
            <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            <div>
              <p className={`text-xs font-bold uppercase ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                High Risk Markets
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {smartScreenData.riskyMarkets.map(market => (
                  <span
                    key={market}
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      isDark
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {market.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MarketPowerCard({ market, theme }: { market: any; theme: 'light' | 'dark' }) {
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-lg border p-3 ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {market.market.toUpperCase()}
        </span>
        <span className={`text-xs font-bold px-2 py-1 rounded ${
          market.safeZone
            ? isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'
            : isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'
        }`}>
          {market.safeZone ? 'SAFE' : 'RISKY'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className={`p-2 rounded ${isDark ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
          <p className={isDark ? 'text-blue-300' : 'text-blue-700'}>Over</p>
          <p className={`font-bold ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>
            {market.overPower.toFixed(0)}%
          </p>
        </div>
        <div className={`p-2 rounded ${isDark ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
          <p className={isDark ? 'text-orange-300' : 'text-orange-700'}>Under</p>
          <p className={`font-bold ${isDark ? 'text-orange-200' : 'text-orange-900'}`}>
            {market.underPower.toFixed(0)}%
          </p>
        </div>
        <div className={`p-2 rounded ${isDark ? 'bg-slate-500/10' : 'bg-slate-50'}`}>
          <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>Vol</p>
          <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            {market.volatility === 'high' ? 'HI' : market.volatility === 'low' ? 'LO' : 'MED'}
          </p>
        </div>
      </div>
    </div>
  );
}
