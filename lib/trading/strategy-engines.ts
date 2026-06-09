import { DigitStats, StrategyAnalysis, StrategySignal } from './types';

// EVEN/ODD STRATEGY
export function analyzeEvenOddStrategy(
  lastTicks: number[],
  ticksHistory: number[],
  market: string
): StrategyAnalysis {
  const timestamp = Date.now();
  const combinedTicks = ticksHistory.length > 0 ? ticksHistory : lastTicks;

  // Count even and odd
  let evenCount = 0;
  let oddCount = 0;

  combinedTicks.forEach(tick => {
    if (tick % 2 === 0) evenCount++;
    else oddCount++;
  });

  const totalCount = combinedTicks.length;
  const evenPercentage = (evenCount / totalCount) * 100;
  const oddPercentage = (oddCount / totalCount) * 100;
  const deviation = Math.abs(evenPercentage - 50);

  const dominantSide = evenPercentage >= oddPercentage ? 'even' : 'odd';
  const dominantPercentage = Math.max(evenPercentage, oddPercentage);

  // Create digit stats for display
  const digitStats: DigitStats[] = [
    {
      digit: 'Even',
      count: evenCount,
      percentage: evenPercentage,
      frequency: evenCount,
      deviation: evenPercentage - 50,
      isHot: evenPercentage > 57,
      isCold: evenPercentage < 43
    },
    {
      digit: 'Odd',
      count: oddCount,
      percentage: oddPercentage,
      frequency: oddCount,
      deviation: oddPercentage - 50,
      isHot: oddPercentage > 57,
      isCold: oddPercentage < 43
    }
  ];

  const last15 = lastTicks.slice(-15);
  const signal = generateEvenOddSignal(dominantSide, deviation, last15, market);

  return {
    strategy: 'even-odd',
    market,
    digitStats,
    dominantSide,
    dominantPercentage,
    recessionPercentage: Math.min(evenPercentage, oddPercentage),
    dominantDigits: [],
    highestDigit: Math.max(...lastTicks),
    lowestDigit: Math.min(...lastTicks),
    marketTrend: deviation > 10 ? 'bullish' : deviation < -10 ? 'bearish' : 'neutral',
    volatilityLevel: 'medium',
    signal,
    lastTicks: last15,
    ticksHistory,
    timestamp
  };
}

function generateEvenOddSignal(
  dominantSide: string,
  deviation: number,
  last15: number[],
  market: string
): StrategySignal {
  const signal: StrategySignal = {
    strategy: 'even-odd',
    market,
    signal: 'none',
    confidence: 0,
    reasoning: '',
    marketPower: 50 + Math.min(deviation, 50),
    timestamp: Date.now()
  };

  // Trigger on 7%+ deviation
  if (deviation >= 7) {
    signal.signal = 'buy';
    signal.entryPoint = dominantSide;
    signal.confidence = Math.min(deviation * 5, 95);
    signal.reasoning = `${dominantSide.toUpperCase()} dominance detected with ${deviation.toFixed(1)}% deviation from equilibrium.`;
  }

  return signal;
}

// RISE/FALL STRATEGY
export function analyzeRiseFallStrategy(
  lastTicks: number[],
  ticksHistory: number[],
  market: string
): StrategyAnalysis {
  const timestamp = Date.now();
  const combinedTicks = ticksHistory.length > 0 ? ticksHistory : lastTicks;

  let riseCount = 0;
  let fallCount = 0;

  // Analyze tick direction
  for (let i = 1; i < combinedTicks.length; i++) {
    if (combinedTicks[i] > combinedTicks[i - 1]) {
      riseCount++;
    } else if (combinedTicks[i] < combinedTicks[i - 1]) {
      fallCount++;
    }
  }

  const totalMoves = riseCount + fallCount;
  const risePercentage = totalMoves > 0 ? (riseCount / totalMoves) * 100 : 50;
  const fallPercentage = totalMoves > 0 ? (fallCount / totalMoves) * 100 : 50;
  const deviation = Math.abs(risePercentage - 50);

  const dominantSide = risePercentage >= fallPercentage ? 'rise' : 'fall';
  const dominantPercentage = Math.max(risePercentage, fallPercentage);

  const digitStats: DigitStats[] = [
    {
      digit: 'Rise',
      count: riseCount,
      percentage: risePercentage,
      frequency: riseCount,
      deviation: risePercentage - 50,
      isHot: risePercentage > 57,
      isCold: risePercentage < 43
    },
    {
      digit: 'Fall',
      count: fallCount,
      percentage: fallPercentage,
      frequency: fallCount,
      deviation: fallPercentage - 50,
      isHot: fallPercentage > 57,
      isCold: fallPercentage < 43
    }
  ];

  const last15 = lastTicks.slice(-15);
  const signal = generateRiseFallSignal(dominantSide, deviation, last15, market);

  return {
    strategy: 'rise-fall',
    market,
    digitStats,
    dominantSide,
    dominantPercentage,
    recessionPercentage: Math.min(risePercentage, fallPercentage),
    dominantDigits: [],
    highestDigit: Math.max(...lastTicks),
    lowestDigit: Math.min(...lastTicks),
    marketTrend: risePercentage > 60 ? 'bullish' : fallPercentage > 60 ? 'bearish' : 'neutral',
    volatilityLevel: calculateRiseFallVolatility(lastTicks),
    signal,
    lastTicks: last15,
    ticksHistory,
    timestamp
  };
}

function generateRiseFallSignal(
  dominantSide: string,
  deviation: number,
  last15: number[],
  market: string
): StrategySignal {
  const signal: StrategySignal = {
    strategy: 'rise-fall',
    market,
    signal: 'none',
    confidence: 0,
    reasoning: '',
    marketPower: 50 + Math.min(deviation, 50),
    timestamp: Date.now()
  };

  // Trigger on 8%+ deviation
  if (deviation >= 8) {
    signal.signal = 'buy';
    signal.entryPoint = dominantSide;
    signal.confidence = Math.min(deviation * 5, 95);
    signal.reasoning = `${dominantSide.toUpperCase()} trend detected with ${deviation.toFixed(1)}% directional bias.`;
  }

  return signal;
}

// DIFFERS STRATEGY (Cold Digits)
export function analyzeDiffersStrategy(
  lastTicks: number[],
  ticksHistory: number[],
  market: string
): StrategyAnalysis {
  const timestamp = Date.now();
  const combinedTicks = ticksHistory.length > 0 ? ticksHistory : lastTicks;

  const digitCounts = new Map<number, number>();
  for (let i = 0; i <= 9; i++) digitCounts.set(i, 0);

  combinedTicks.forEach(tick => {
    const count = digitCounts.get(tick) || 0;
    digitCounts.set(tick, count + 1);
  });

  const digitStats: DigitStats[] = Array.from(digitCounts.entries()).map(([digit, count]) => ({
    digit,
    count,
    percentage: (count / combinedTicks.length) * 100,
    frequency: count,
    deviation: ((count / combinedTicks.length) * 100) - 10,
    isHot: count / combinedTicks.length > 0.15,
    isCold: count / combinedTicks.length < 0.05
  }));

  const coldDigits = digitStats.filter(d => d.isCold);
  const coldestDigit = coldDigits.length > 0 ? coldDigits[0] : null;

  const last15 = lastTicks.slice(-15);
  const signal = generateDiffersSignal(coldestDigit, lastTicks, market);

  return {
    strategy: 'differs',
    market,
    digitStats,
    dominantSide: `coldest-${coldestDigit?.digit}`,
    dominantPercentage: coldestDigit ? 100 - coldestDigit.percentage : 50,
    recessionPercentage: coldestDigit?.percentage || 50,
    dominantDigits: coldDigits.map(d => Number(d.digit)),
    highestDigit: Math.max(...lastTicks),
    lowestDigit: Math.min(...lastTicks),
    marketTrend: 'neutral',
    volatilityLevel: 'medium',
    signal,
    lastTicks: last15,
    ticksHistory,
    timestamp
  };
}

function generateDiffersSignal(
  coldestDigit: DigitStats | null,
  lastTicks: number[],
  market: string
): StrategySignal {
  const signal: StrategySignal = {
    strategy: 'differs',
    market,
    signal: 'none',
    confidence: 0,
    reasoning: '',
    marketPower: 0,
    timestamp: Date.now()
  };

  if (coldestDigit && coldestDigit.percentage < 5) {
    signal.signal = 'buy';
    signal.entryPoint = coldestDigit.digit;
    signal.confidence = Math.min((10 - coldestDigit.percentage) * 5, 90);
    signal.reasoning = `Cold digit ${coldestDigit.digit} at ${coldestDigit.percentage.toFixed(1)}% - Expected due. Entry on Digit ${coldestDigit.digit} Differs.`;
    signal.marketPower = 100 - coldestDigit.percentage;
  }

  return signal;
}

// MATCHES STRATEGY (Hot Digits)
export function analyzeMatchesStrategy(
  lastTicks: number[],
  ticksHistory: number[],
  market: string
): StrategyAnalysis {
  const timestamp = Date.now();
  const combinedTicks = ticksHistory.length > 0 ? ticksHistory : lastTicks;

  const digitCounts = new Map<number, number>();
  for (let i = 0; i <= 9; i++) digitCounts.set(i, 0);

  combinedTicks.forEach(tick => {
    const count = digitCounts.get(tick) || 0;
    digitCounts.set(tick, count + 1);
  });

  const digitStats: DigitStats[] = Array.from(digitCounts.entries())
    .map(([digit, count]) => ({
      digit,
      count,
      percentage: (count / combinedTicks.length) * 100,
      frequency: count,
      deviation: ((count / combinedTicks.length) * 100) - 10,
      isHot: count / combinedTicks.length > 0.15,
      isCold: count / combinedTicks.length < 0.05
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const hotestDigit = digitStats[0];

  const last15 = lastTicks.slice(-15);
  const signal = generateMatchesSignal(hotestDigit, lastTicks, market);

  return {
    strategy: 'matches',
    market,
    digitStats,
    dominantSide: `hottest-${hotestDigit.digit}`,
    dominantPercentage: hotestDigit.percentage,
    recessionPercentage: digitStats[1]?.percentage || 0,
    dominantDigits: [Number(hotestDigit.digit)],
    highestDigit: Math.max(...lastTicks),
    lowestDigit: Math.min(...lastTicks),
    marketTrend: 'neutral',
    volatilityLevel: 'medium',
    signal,
    lastTicks: last15,
    ticksHistory,
    timestamp
  };
}

function generateMatchesSignal(
  hottestDigit: DigitStats,
  lastTicks: number[],
  market: string
): StrategySignal {
  const signal: StrategySignal = {
    strategy: 'matches',
    market,
    signal: 'none',
    confidence: 0,
    reasoning: '',
    marketPower: hottestDigit.percentage,
    timestamp: Date.now()
  };

  if (hottestDigit.percentage > 15) {
    signal.signal = 'buy';
    signal.entryPoint = hottestDigit.digit;
    signal.confidence = Math.min(hottestDigit.percentage * 3, 95);
    signal.reasoning = `Hot digit ${hottestDigit.digit} at ${hottestDigit.percentage.toFixed(1)}% - Strong power. Entry on Digit ${hottestDigit.digit} Matches.`;
  }

  return signal;
}

function calculateRiseFallVolatility(ticks: number[]): 'low' | 'medium' | 'high' {
  if (ticks.length < 2) return 'medium';

  let changes = 0;
  for (let i = 1; i < ticks.length; i++) {
    if (ticks[i] !== ticks[i - 1]) changes++;
  }

  const changeRate = changes / ticks.length;
  if (changeRate > 0.7) return 'high';
  if (changeRate < 0.3) return 'low';
  return 'medium';
}
