'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Strategy } from '@/lib/trading/types';
import { useTradingEngine } from '@/hooks/use-trading-engine';
import MarketAnalyzerSubTab from './trading-engine/market-analyzer-subtab';
import TradingConsoleSubTab from './trading-engine/trading-console-subtab';
import SmartScreenSubTab from './trading-engine/smart-screen-subtab';
import ConservativeTradingSubTab from './trading-engine/conservative-trading-subtab';
import { RefreshCw, Settings } from 'lucide-react';

interface TradingEngineTabProps {
  theme: 'light' | 'dark';
}

export default function TradingEngineTab({ theme }: TradingEngineTabProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>('over-under');
  const [activeSubTab, setActiveSubTab] = useState('market-analyzer');
  const [autoAnalyzeEnabled, setAutoAnalyzeEnabled] = useState(true);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([
    'volatility_100_1s',
    'volatility_75_1s',
    'volatility_25_1s'
  ]);

  const {
    analysisResults,
    smartScreenData,
    isAnalyzing,
    lastUpdateTime,
    runAnalysis
  } = useTradingEngine({
    markets: selectedMarkets,
    selectedStrategy,
    autoAnalyze: autoAnalyzeEnabled,
    updateInterval: 5000
  });

  const strategies: { value: Strategy; label: string; description: string }[] = [
    { value: 'over-under', label: 'Over/Under', description: 'Analyze 0-4 (Under) vs 5-9 (Over)' },
    { value: 'even-odd', label: 'Even/Odd', description: 'Detect even vs odd digit dominance' },
    { value: 'rise-fall', label: 'Rise/Fall', description: 'Track directional price movement' },
    { value: 'differs', label: 'Differs', description: 'Identify cold digits due for rebound' },
    { value: 'matches', label: 'Matches', description: 'Trade hot digits with high frequency' },
    { value: 'accumulators', label: 'Accumulators', description: 'Chain multiple conditions' },
    { value: 'high-low', label: 'High/Low', description: 'Trade highest vs lowest ticks' }
  ];

  const isDark = theme === 'dark';

  return (
    <div className={`w-full h-full rounded-lg p-4 sm:p-6 ${isDark ? 'bg-[#0a0a0a] border border-white/5' : 'bg-white border border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Trading Engine Pro
          </h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Multi-market analysis with 7 advanced strategies
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => runAnalysis()}
            disabled={isAnalyzing}
            size="sm"
            className="gap-2"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
          </Button>
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Strategy Selection */}
      <div className={`mb-6 p-4 rounded-lg border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`text-sm font-bold mb-3 uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Select Strategy
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {strategies.map(strategy => (
            <button
              key={strategy.value}
              onClick={() => setSelectedStrategy(strategy.value)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedStrategy === strategy.value
                  ? isDark
                    ? 'border-blue-500/50 bg-blue-500/10'
                    : 'border-blue-400 bg-blue-50'
                  : isDark
                    ? 'border-white/10 hover:border-white/20'
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {strategy.label}
              </div>
              <div className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {strategy.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Auto-Analyze Toggle */}
      <div className={`mb-6 p-3 rounded-lg border flex items-center justify-between ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
        <div>
          <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Auto Market Analysis
          </p>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Continuously scan all markets for signals
          </p>
        </div>
        <Button
          onClick={() => setAutoAnalyzeEnabled(!autoAnalyzeEnabled)}
          variant={autoAnalyzeEnabled ? 'default' : 'outline'}
          size="sm"
        >
          {autoAnalyzeEnabled ? 'ON' : 'OFF'}
        </Button>
      </div>

      {/* Last Update Time */}
      {lastUpdateTime > 0 && (
        <div className={`mb-4 text-xs ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
          Last updated: {new Date(lastUpdateTime).toLocaleTimeString()}
        </div>
      )}

      {/* Sub-Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-4 ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-100'}`}>
          <TabsTrigger value="market-analyzer" className="text-xs sm:text-sm">
            Market Analyzer
          </TabsTrigger>
          <TabsTrigger value="smart-screen" className="text-xs sm:text-sm">
            Smart Screen
          </TabsTrigger>
          <TabsTrigger value="trading-console" className="text-xs sm:text-sm">
            Trading Console
          </TabsTrigger>
          <TabsTrigger value="conservative" className="text-xs sm:text-sm">
            Conservative
          </TabsTrigger>
        </TabsList>

        {/* Market Analyzer Sub-Tab */}
        <TabsContent value="market-analyzer" className="mt-4">
          <MarketAnalyzerSubTab
            analysisResults={analysisResults}
            selectedStrategy={selectedStrategy}
            theme={theme}
            isLoading={isAnalyzing}
          />
        </TabsContent>

        {/* Smart Screen Sub-Tab */}
        <TabsContent value="smart-screen" className="mt-4">
          <SmartScreenSubTab
            smartScreenData={smartScreenData}
            theme={theme}
            isLoading={isAnalyzing}
          />
        </TabsContent>

        {/* Trading Console Sub-Tab */}
        <TabsContent value="trading-console" className="mt-4">
          <TradingConsoleSubTab
            theme={theme}
            selectedStrategy={selectedStrategy}
            availableMarkets={selectedMarkets}
          />
        </TabsContent>

        {/* Conservative Trading Sub-Tab */}
        <TabsContent value="conservative" className="mt-4">
          <ConservativeTradingSubTab
            theme={theme}
            selectedStrategy={selectedStrategy}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
