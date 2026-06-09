// Trading Engine Core Types

export type Strategy = 'over-under' | 'even-odd' | 'rise-fall' | 'differs' | 'matches' | 'accumulators' | 'high-low';

export interface MarketData {
  market: string;
  lastTicks: number[];
  lastTicksTime: number[];
  volatility: number;
  timestamp: number;
  isActive: boolean;
}

export interface StrategySignal {
  strategy: Strategy;
  market: string;
  signal: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell' | 'none';
  confidence: number; // 0-100
  entryPoint?: number | string;
  exitPoint?: number | string;
  reasoning: string;
  ticksToSkip?: number; // Pattern avoidance
  marketPower: number; // Percentage dominance
  supportingStats?: Record<string, any>;
  timestamp: number;
}

export interface DigitStats {
  digit: number | string;
  count: number;
  percentage: number;
  frequency: number;
  deviation: number; // From expected (10% for digits, 50% for even/odd)
  isHot: boolean; // Above 15% for digits
  isCold: boolean; // Below 5% for digits
}

export interface StrategyAnalysis {
  strategy: Strategy;
  market: string;
  digitStats: DigitStats[];
  dominantSide: string; // 'over', 'under', 'even', 'odd', 'rise', 'fall'
  dominantPercentage: number;
  recessionPercentage: number;
  dominantDigits: number[]; // Top 2-3 digits
  highestDigit: number;
  lowestDigit: number;
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  volatilityLevel: 'low' | 'medium' | 'high';
  signal: StrategySignal;
  lastTicks: number[]; // Last 15 ticks
  ticksHistory: number[]; // Last 500 ticks for pattern analysis
  timestamp: number;
}

export interface ContractConfig {
  market: string;
  tradeType: 'over' | 'under' | 'even' | 'odd' | 'rise' | 'fall' | 'digit-match' | 'digit-differs';
  contractType: 'call' | 'put' | 'digit' | 'over-under' | 'even-odd' | 'rise-fall';
  stake: number;
  ticks: number;
  entryPoint?: number | string;
  martingale?: {
    enabled: boolean;
    multiplier: number;
    maxLosses: number;
  };
  takeProfit?: number; // Percentage
  stopLoss?: number; // Percentage
  maxConsecutiveLosses?: number;
  autoTrading?: {
    enabled: boolean;
    restartAfterWin: boolean;
  };
  timestamp: number;
}

export interface Trade {
  id: string;
  contractConfig: ContractConfig;
  entryPrice: number;
  entryTime: number;
  exitPrice?: number;
  exitTime?: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  payout?: number;
  profit?: number;
  profiLoss?: number;
  contractId?: string;
  tickResults?: number[]; // Tick-by-tick results
  timestamp: number;
}

export interface TradingStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalStake: number;
  totalProfit: number;
  winRate: number; // Percentage
  profitLoss: number;
  consecutiveLosses: number;
  consecutiveWins: number;
  largestWin: number;
  largestLoss: number;
  averageWinSize: number;
  averageLossSize: number;
  riskRewardRatio: number;
}

export interface MarketPower {
  market: string;
  overPower: number; // 0-100
  underPower: number; // 0-100
  evenPower: number; // 0-100
  oddPower: number; // 0-100
  risePower: number; // 0-100
  fallPower: number; // 0-100
  dominantSide: string;
  safeZone: boolean; // True if no conflicting signals
  recommendedAction: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  volatility: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface ConservativeConfig {
  hourlyTarget: number; // Percentage per hour
  accountBalance: number;
  riskPercentage: number; // 1-5%
  stopLossAtConsecutiveLosses: number; // Default 5
  tradeDuration: number; // Hours to trade
  martingaleEnabled: boolean;
  martingaleMultipliers: {
    over3Under6: number;
    over2Under7: number;
    over1Under8: number;
  };
  startTime?: number;
  endTime?: number;
  allowedStrategies: Strategy[];
}

export interface SmartScreenData {
  markets: MarketPower[];
  recommendedMarkets: string[];
  safeMarkets: string[];
  riskyMarkets: string[];
  bestOpportunity: {
    market: string;
    strategy: Strategy;
    confidence: number;
  } | null;
  overallMarketSentiment: 'very-bullish' | 'bullish' | 'neutral' | 'bearish' | 'very-bearish';
  timestamp: number;
}
