import { DigitStats, StrategyAnalysis, StrategySignal } from './types';

export function analyzeOverUnderStrategy(
  lastTicks: number[],
  ticksHistory: number[],
  market: string
): StrategyAnalysis {
  const timestamp = Date.now();

  // Calculate digit statistics
  const digitStats = calculateDigitStats(lastTicks, ticksHistory);
  
  // Separate over (5-9) and under (0-4)
  const overDigits = digitStats.filter(d => Number(d.digit) >= 5);
  const underDigits = digitStats.filter(d => Number(d.digit) < 5);

  const overPercentage = overDigits.reduce((sum, d) => sum + d.percentage, 0);
  const underPercentage = underDigits.reduce((sum, d) => sum + d.percentage, 0);

  const dominantSide = overPercentage >= underPercentage ? 'over' : 'under';
  const dominantPercentage = Math.max(overPercentage, underPercentage);
  const recessionPercentage = Math.min(overPercentage, underPercentage);

  // Find highest appearing digits in each side
  const overDigitsSorted = overDigits.sort((a, b) => b.count - a.count);
  const underDigitsSorted = underDigits.sort((a, b) => b.count - a.count);

  const highestOverDigit = overDigitsSorted.length > 0 ? Number(overDigitsSorted[0].digit) : 5;
  const highestUnderDigit = underDigitsSorted.length > 0 ? Number(underDigitsSorted[0].digit) : 0;

  // Detect market trend from last 15 ticks
  const last15 = lastTicks.slice(-15);
  const trendScore = calculateTrendScore(last15, 'over-under');

  // Generate signal
  const signal = generateOverUnderSignal(
    dominantSide,
    dominantPercentage,
    highestOverDigit,
    highestUnderDigit,
    last15,
    trendScore,
    market
  );

  return {
    strategy: 'over-under',
    market,
    digitStats,
    dominantSide,
    dominantPercentage,
    recessionPercentage,
    dominantDigits: [
      ...overDigitsSorted.slice(0, 2).map(d => Number(d.digit)),
      ...underDigitsSorted.slice(0, 2).map(d => Number(d.digit))
    ],
    highestDigit: Math.max(...lastTicks),
    lowestDigit: Math.min(...lastTicks),
    marketTrend: trendScore > 0.15 ? 'bullish' : trendScore < -0.15 ? 'bearish' : 'neutral',
    volatilityLevel: calculateVolatility(lastTicks) > 0.4 ? 'high' : calculateVolatility(lastTicks) > 0.2 ? 'medium' : 'low',
    signal,
    lastTicks: last15,
    ticksHistory,
    timestamp
  };
}

function calculateDigitStats(lastTicks: number[], ticksHistory: number[]): DigitStats[] {
  const stats: Map<number, DigitStats> = new Map();

  // Initialize all digits 0-9
  for (let i = 0; i <= 9; i++) {
    stats.set(i, {
      digit: i,
      count: 0,
      percentage: 0,
      frequency: 0,
      deviation: 0,
      isHot: false,
      isCold: false
    });
  }

  // Count from full history for percentage
  const historyCount = ticksHistory.length || lastTicks.length;
  const combinedTicks = ticksHistory.length > 0 ? ticksHistory : lastTicks;

  combinedTicks.forEach(tick => {
    const stat = stats.get(tick);
    if (stat) {
      stat.count++;
      stat.percentage = (stat.count / combinedTicks.length) * 100;
      stat.frequency = stat.count;
      stat.deviation = stat.percentage - 10; // Expected 10% for each digit
    }
  });

  // Update hot/cold status
  const sortedStats = Array.from(stats.values()).sort((a, b) => b.percentage - a.percentage);
  sortedStats.forEach((stat, index) => {
    stat.isHot = stat.percentage > 15; // Above average
    stat.isCold = stat.percentage < 5; // Below average
  });

  return sortedStats;
}

function calculateTrendScore(lastTicks: number[], strategy: string): number {
  if (lastTicks.length < 2) return 0;

  let score = 0;
  const half = Math.floor(lastTicks.length / 2);
  const firstHalf = lastTicks.slice(0, half);
  const secondHalf = lastTicks.slice(half);

  const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  if (strategy === 'over-under') {
    score = ((secondHalfAvg - firstHalfAvg) / 9) * 100; // Normalized
  }

  return score / 100; // Return as decimal
}

function calculateVolatility(ticks: number[]): number {
  if (ticks.length < 2) return 0;

  const mean = ticks.reduce((a, b) => a + b, 0) / ticks.length;
  const squareDiffs = ticks.map(tick => Math.pow(tick - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  return stdDev / mean; // Coefficient of variation
}

function generateOverUnderSignal(
  dominantSide: string,
  dominantPercentage: number,
  highestOverDigit: number,
  highestUnderDigit: number,
  last15: number[],
  trendScore: number,
  market: string
): StrategySignal {
  let signal: StrategySignal = {
    strategy: 'over-under',
    market,
    signal: 'none',
    confidence: 0,
    reasoning: '',
    marketPower: dominantPercentage,
    timestamp: Date.now()
  };

  // Check if dominant side has strong power (55%+)
  if (dominantPercentage >= 60) {
    // Check if last 15 ticks support the dominant side
    const lastTick = last15[last15.length - 1];
    const isLastTickSupportive = dominantSide === 'over' ? lastTick >= 5 : lastTick < 5;

    if (isLastTickSupportive && trendScore > -0.1) {
      signal.signal = 'strong-buy';
      signal.confidence = Math.min(dominantPercentage, 95);
      signal.entryPoint = dominantSide === 'over' ? highestOverDigit : highestUnderDigit;
      signal.reasoning = `Strong ${dominantSide.toUpperCase()} signal at ${dominantPercentage.toFixed(1)}% power. Entry on ${dominantSide === 'over' ? 'Over' : 'Under'} ${signal.entryPoint}.`;
    } else if (isLastTickSupportive) {
      signal.signal = 'buy';
      signal.confidence = dominantPercentage - 10;
      signal.entryPoint = dominantSide === 'over' ? highestOverDigit : highestUnderDigit;
      signal.reasoning = `${dominantSide.toUpperCase()} dominance detected at ${dominantPercentage.toFixed(1)}%. Slight reversal pressure, wait for confirmation.`;
    }
  } else if (dominantPercentage >= 55) {
    // Moderate signal
    const lastTickCountSupport = last15.filter(t => dominantSide === 'over' ? t >= 5 : t < 5).length;
    if (lastTickCountSupport >= 8) {
      signal.signal = 'buy';
      signal.confidence = dominantPercentage;
      signal.entryPoint = dominantSide === 'over' ? highestOverDigit : highestUnderDigit;
      signal.reasoning = `Moderate ${dominantSide.toUpperCase()} dominance (${dominantPercentage.toFixed(1)}%) confirmed by recent ticks.`;
    }
  }

  // Check for conflicting signals (disturbance warning)
  if (dominantSide === 'over' && dominantPercentage >= 55) {
    const recentUnderDigits = last15.filter(t => t < 5);
    if (recentUnderDigits.length >= 2) {
      signal.reasoning += ` WARNING: Recent Under digits detected (${recentUnderDigits.length}). Monitor for reversal.`;
    }
  }

  if (!signal.entryPoint && signal.signal !== 'none') {
    signal.entryPoint = dominantSide === 'over' ? highestOverDigit : highestUnderDigit;
  }

  return signal;
}

export function getTicksToSkip(entryDigit: number, lastTicks: number[], strategy: string = 'over-under'): number {
  // Analyze pattern to recommend ticks to skip
  if (lastTicks.length < 5) return 0;

  const last5 = lastTicks.slice(-5);
  const entryIsOver = entryDigit >= 5;

  let oppositeCount = 0;
  for (let i = 0; i < last5.length; i++) {
    const tickIsOver = last5[i] >= 5;
    if (tickIsOver !== entryIsOver) {
      oppositeCount++;
    }
  }

  // Return ticks to skip based on opposite pattern frequency
  if (oppositeCount === 0) return 0;
  if (oppositeCount === 1) return 1;
  if (oppositeCount === 2) return 2;
  if (oppositeCount >= 3) return Math.min(oppositeCount, 5);

  return 0;
}

export function getEntryPointForOverUnder(dominantSide: string, digitStats: DigitStats[]): number {
  const filteredDigits = dominantSide === 'over'
    ? digitStats.filter(d => Number(d.digit) >= 5)
    : digitStats.filter(d => Number(d.digit) < 5);

  const sorted = filteredDigits.sort((a, b) => b.count - a.count);
  return sorted.length > 0 ? Number(sorted[0].digit) : (dominantSide === 'over' ? 5 : 0);
}
