import { useState, useEffect, useCallback, useRef } from 'react';
import { Strategy, StrategyAnalysis, StrategySignal, MarketPower, SmartScreenData } from '@/lib/trading/types';
import { analyzeOverUnderStrategy, getTicksToSkip, getEntryPointForOverUnder } from '@/lib/trading/over-under-engine';
import { 
  analyzeEvenOddStrategy, 
  analyzeRiseFallStrategy, 
  analyzeDiffersStrategy, 
  analyzeMatchesStrategy 
} from '@/lib/trading/strategy-engines';

interface UseTradingEngineOptions {
  markets: string[];
  selectedStrategy: Strategy;
  autoAnalyze?: boolean;
  updateInterval?: number; // ms
}

export function useTradingEngine({
  markets,
  selectedStrategy,
  autoAnalyze = false,
  updateInterval = 5000
}: UseTradingEngineOptions) {
  const [analysisResults, setAnalysisResults] = useState<StrategyAnalysis[]>([]);
  const [smartScreenData, setSmartScreenData] = useState<SmartScreenData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate market data fetching (replace with real Deriv API)
  const fetchMarketData = useCallback(async (market: string) => {
    // This would connect to real Deriv API
    // For now, return simulated data
    const lastTicks = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10));
    const ticksHistory = Array.from({ length: 500 }, () => Math.floor(Math.random() * 10));

    return {
      market,
      lastTicks,
      lastTicksTime: Array.from({ length: 10 }, (_, i) => Date.now() - (10 - i) * 1000),
      volatility: Math.random() * 0.5,
      timestamp: Date.now(),
      isActive: true
    };
  }, []);

  // Analyze market with selected strategy
  const analyzeMarket = useCallback((
    lastTicks: number[],
    ticksHistory: number[],
    market: string
  ): StrategyAnalysis => {
    switch (selectedStrategy) {
      case 'over-under':
        return analyzeOverUnderStrategy(lastTicks, ticksHistory, market);
      case 'even-odd':
        return analyzeEvenOddStrategy(lastTicks, ticksHistory, market);
      case 'rise-fall':
        return analyzeRiseFallStrategy(lastTicks, ticksHistory, market);
      case 'differs':
        return analyzeDiffersStrategy(lastTicks, ticksHistory, market);
      case 'matches':
        return analyzeMatchesStrategy(lastTicks, ticksHistory, market);
      case 'high-low':
        return analyzeOverUnderStrategy(lastTicks, ticksHistory, market); // Same as over-under for now
      default:
        return analyzeOverUnderStrategy(lastTicks, ticksHistory, market);
    }
  }, [selectedStrategy]);

  // Run analysis across all markets
  const runMultiMarketAnalysis = useCallback(async () => {
    setIsAnalyzing(true);

    try {
      const results: StrategyAnalysis[] = [];

      for (const market of markets) {
        const marketData = await fetchMarketData(market);
        const analysis = analyzeMarket(marketData.lastTicks, marketData.lastTicksTime as any, market);
        results.push(analysis);
      }

      setAnalysisResults(results);
      generateSmartScreen(results);
      setLastUpdateTime(Date.now());
    } catch (error) {
      console.error('[Trading Engine] Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [markets, fetchMarketData, analyzeMarket]);

  // Generate smart screen data
  const generateSmartScreen = useCallback((analyses: StrategyAnalysis[]) => {
    const marketPowers: MarketPower[] = analyses.map(analysis => {
      const overPower = analysis.dominantSide === 'over' ? analysis.dominantPercentage : 100 - analysis.dominantPercentage;
      const underPower = analysis.dominantSide === 'under' ? analysis.dominantPercentage : 100 - analysis.dominantPercentage;

      return {
        market: analysis.market,
        overPower,
        underPower,
        evenPower: analysis.digitStats[0]?.percentage || 50,
        oddPower: analysis.digitStats[1]?.percentage || 50,
        risePower: analysis.marketTrend === 'bullish' ? 70 : analysis.marketTrend === 'bearish' ? 30 : 50,
        fallPower: analysis.marketTrend === 'bearish' ? 70 : analysis.marketTrend === 'bullish' ? 30 : 50,
        dominantSide: analysis.dominantSide,
        safeZone: analysis.dominantPercentage > 55 && analysis.volatilityLevel !== 'high',
        recommendedAction: analysis.signal.signal !== 'none' ? `${analysis.signal.signal} ${analysis.signal.entryPoint}` : 'HOLD',
        trend: analysis.marketTrend,
        volatility: analysis.volatilityLevel,
        timestamp: Date.now()
      };
    });

    const safeMarkets = marketPowers
      .filter(m => m.safeZone && (m.overPower > 55 || m.underPower > 55))
      .map(m => m.market);

    const riskyMarkets = marketPowers
      .filter(m => !m.safeZone || m.volatility === 'high')
      .map(m => m.market);

    const bestOpportunity = analyses
      .filter(a => a.signal.signal !== 'none')
      .sort((a, b) => b.signal.confidence - a.signal.confidence)[0];

    const data: SmartScreenData = {
      markets: marketPowers,
      recommendedMarkets: safeMarkets.slice(0, 3),
      safeMarkets,
      riskyMarkets,
      bestOpportunity: bestOpportunity ? {
        market: bestOpportunity.market,
        strategy: bestOpportunity.strategy,
        confidence: bestOpportunity.signal.confidence
      } : null,
      overallMarketSentiment: determineSentiment(analyses),
      timestamp: Date.now()
    };

    setSmartScreenData(data);
  }, []);

  // Determine overall market sentiment
  const determineSentiment = (analyses: StrategyAnalysis[]): SmartScreenData['overallMarketSentiment'] => {
    const bullishCount = analyses.filter(a => a.marketTrend === 'bullish').length;
    const bearishCount = analyses.filter(a => a.marketTrend === 'bearish').length;

    const ratio = bullishCount / (bullishCount + bearishCount);

    if (ratio > 0.7) return 'very-bullish';
    if (ratio > 0.55) return 'bullish';
    if (ratio < 0.3) return 'very-bearish';
    if (ratio < 0.45) return 'bearish';
    return 'neutral';
  };

  // Start/stop auto-analysis
  useEffect(() => {
    if (!autoAnalyze) {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      return;
    }

    // Initial analysis
    runMultiMarketAnalysis();

    // Set up interval
    analysisIntervalRef.current = setInterval(() => {
      runMultiMarketAnalysis();
    }, updateInterval);

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, [autoAnalyze, updateInterval, runMultiMarketAnalysis]);

  return {
    analysisResults,
    smartScreenData,
    isAnalyzing,
    lastUpdateTime,
    runAnalysis: runMultiMarketAnalysis,
    getTicksToSkip: (entryDigit: number, lastTicks: number[]) => 
      getTicksToSkip(entryDigit, lastTicks, selectedStrategy)
  };
}
