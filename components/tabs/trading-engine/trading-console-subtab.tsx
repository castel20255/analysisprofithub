'use client';

import React, { useState } from 'react';
import { Strategy, Trade, TradingStats } from '@/lib/trading/types';
import { Button } from '@/components/ui/button';
import { Play, StopCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface TradingConsoleSubTabProps {
  theme: 'light' | 'dark';
  selectedStrategy: Strategy;
  availableMarkets: string[];
}

export default function TradingConsoleSubTab({
  theme,
  selectedStrategy,
  availableMarkets
}: TradingConsoleSubTabProps) {
  const isDark = theme === 'dark';

  // Form state
  const [config, setConfig] = useState({
    market: availableMarkets[0] || 'volatility_100_1s',
    tradeType: 'over',
    ticks: 5,
    stake: 10,
    martingale: false,
    martingaleMultiplier: 2,
    autoTrading: false,
    takeProfit: 20,
    stopLoss: 10,
    maxConsecutiveLosses: 5
  });

  // Trading state
  const [isTrading, setIsTrading] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState<TradingStats>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalStake: 0,
    totalProfit: 0,
    winRate: 0,
    profitLoss: 0,
    consecutiveLosses: 0,
    consecutiveWins: 0,
    largestWin: 0,
    largestLoss: 0,
    averageWinSize: 0,
    averageLossSize: 0,
    riskRewardRatio: 0
  });

  const handleStartTrading = () => {
    setIsTrading(true);
    // Simulate trade execution
    simulateTrade();
  };

  const handleStopTrading = () => {
    setIsTrading(false);
  };

  const simulateTrade = () => {
    // Simulated trade
    const isWin = Math.random() > 0.4; // 60% win rate for demo
    const profit = isWin ? config.stake * 0.85 : -config.stake;

    const newTrade: Trade = {
      id: `trade-${Date.now()}`,
      contractConfig: {
        market: config.market,
        tradeType: config.tradeType as any,
        contractType: 'over-under',
        stake: config.stake,
        ticks: config.ticks,
        martingale: config.martingale ? { enabled: true, multiplier: config.martingaleMultiplier, maxLosses: 3 } : undefined,
        timestamp: Date.now()
      },
      entryPrice: Math.random() * 10,
      entryTime: Date.now(),
      exitPrice: Math.random() * 10,
      exitTime: Date.now() + config.ticks * 1000,
      status: isWin ? 'won' : 'lost',
      profit,
      profiLoss: profit,
      timestamp: Date.now()
    };

    setTrades(prev => [newTrade, ...prev]);
    updateStats(newTrade);
  };

  const updateStats = (newTrade: Trade) => {
    setStats(prev => {
      const updatedStats = { ...prev };
      updatedStats.totalTrades++;
      updatedStats.totalStake += config.stake;

      if (newTrade.status === 'won') {
        updatedStats.winningTrades++;
        updatedStats.consecutiveWins++;
        updatedStats.consecutiveLosses = 0;
        updatedStats.largestWin = Math.max(updatedStats.largestWin, newTrade.profit || 0);
      } else {
        updatedStats.losingTrades++;
        updatedStats.consecutiveLosses++;
        updatedStats.consecutiveWins = 0;
        updatedStats.largestLoss = Math.min(updatedStats.largestLoss, newTrade.profit || 0);
      }

      updatedStats.totalProfit += newTrade.profit || 0;
      updatedStats.profitLoss = updatedStats.totalProfit;
      updatedStats.winRate = (updatedStats.winningTrades / updatedStats.totalTrades) * 100;
      updatedStats.averageWinSize = updatedStats.winningTrades > 0 ? updatedStats.largestWin / updatedStats.winningTrades : 0;
      updatedStats.averageLossSize = updatedStats.losingTrades > 0 ? updatedStats.largestLoss / updatedStats.losingTrades : 0;

      return updatedStats;
    });
  };

  return (
    <div className="space-y-6">
      {/* Trading Configuration */}
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Trading Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Market Selection */}
          <div>
            <label className={`text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Market
            </label>
            <select
              value={config.market}
              onChange={(e) => setConfig({ ...config, market: e.target.value })}
              className={`w-full p-2 rounded-lg border text-sm ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={isTrading}
            >
              {availableMarkets.map(market => (
                <option key={market} value={market}>
                  {market.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Trade Type */}
          <div>
            <label className={`text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Trade Type
            </label>
            <select
              value={config.tradeType}
              onChange={(e) => setConfig({ ...config, tradeType: e.target.value })}
              className={`w-full p-2 rounded-lg border text-sm ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={isTrading}
            >
              <option value="over">Over</option>
              <option value="under">Under</option>
              <option value="even">Even</option>
              <option value="odd">Odd</option>
              <option value="rise">Rise</option>
              <option value="fall">Fall</option>
            </select>
          </div>

          {/* Ticks */}
          <div>
            <label className={`text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Ticks
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={config.ticks}
              onChange={(e) => setConfig({ ...config, ticks: parseInt(e.target.value) })}
              className={`w-full p-2 rounded-lg border text-sm ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={isTrading}
            />
          </div>

          {/* Stake */}
          <div>
            <label className={`text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Stake ($)
            </label>
            <input
              type="number"
              min="1"
              value={config.stake}
              onChange={(e) => setConfig({ ...config, stake: parseInt(e.target.value) })}
              className={`w-full p-2 rounded-lg border text-sm ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={isTrading}
            />
          </div>

          {/* Take Profit */}
          <div>
            <label className={`text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Take Profit (%)
            </label>
            <input
              type="number"
              min="0"
              value={config.takeProfit}
              onChange={(e) => setConfig({ ...config, takeProfit: parseInt(e.target.value) })}
              className={`w-full p-2 rounded-lg border text-sm ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={isTrading}
            />
          </div>

          {/* Stop Loss */}
          <div>
            <label className={`text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Stop Loss (%)
            </label>
            <input
              type="number"
              min="0"
              value={config.stopLoss}
              onChange={(e) => setConfig({ ...config, stopLoss: parseInt(e.target.value) })}
              className={`w-full p-2 rounded-lg border text-sm ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={isTrading}
            />
          </div>
        </div>

        {/* Options */}
        <div className="flex gap-4 mb-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.martingale}
              onChange={(e) => setConfig({ ...config, martingale: e.target.checked })}
              disabled={isTrading}
              className="w-4 h-4"
            />
            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Martingale (x{config.martingaleMultiplier})
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.autoTrading}
              onChange={(e) => setConfig({ ...config, autoTrading: e.target.checked })}
              disabled={isTrading}
              className="w-4 h-4"
            />
            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Auto Trading
            </span>
          </label>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3">
          {!isTrading ? (
            <Button
              onClick={handleStartTrading}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4" />
              Start Trading
            </Button>
          ) : (
            <Button
              onClick={handleStopTrading}
              variant="destructive"
              className="gap-2"
            >
              <StopCircle className="h-4 w-4" />
              Stop Trading
            </Button>
          )}
        </div>
      </div>

      {/* Trading Statistics */}
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Trading Statistics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatBox
            label="Total Trades"
            value={stats.totalTrades.toString()}
            isDark={isDark}
          />
          <StatBox
            label="Winning"
            value={stats.winningTrades.toString()}
            isDark={isDark}
            highlight={stats.winningTrades > 0}
          />
          <StatBox
            label="Losing"
            value={stats.losingTrades.toString()}
            isDark={isDark}
            highlight={stats.losingTrades > 0}
          />
          <StatBox
            label="Win Rate"
            value={`${stats.winRate.toFixed(1)}%`}
            isDark={isDark}
            highlight={stats.winRate > 50}
          />
        </div>

        {/* P&L */}
        <div className={`p-4 rounded-lg border ${
          stats.profitLoss >= 0
            ? isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-300'
            : isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-bold uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Total Profit/Loss
              </p>
              <p className={`text-2xl font-black mt-1 ${
                stats.profitLoss >= 0
                  ? isDark ? 'text-green-300' : 'text-green-700'
                  : isDark ? 'text-red-300' : 'text-red-700'
              }`}>
                {stats.profitLoss >= 0 ? '+' : ''}{stats.profitLoss.toFixed(2)}
              </p>
            </div>
            {stats.profitLoss >= 0 ? (
              <TrendingUp className={`h-12 w-12 ${isDark ? 'text-green-500/50' : 'text-green-400/50'}`} />
            ) : (
              <TrendingDown className={`h-12 w-12 ${isDark ? 'text-red-500/50' : 'text-red-400/50'}`} />
            )}
          </div>
        </div>
      </div>

      {/* Trade History */}
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Recent Trades
        </h3>

        {trades.length === 0 ? (
          <p className={`text-sm text-center py-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            No trades yet. Start trading to see history.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {trades.slice(0, 10).map(trade => (
              <div
                key={trade.id}
                className={`p-3 rounded-lg flex items-center justify-between ${
                  trade.status === 'won'
                    ? isDark ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-300'
                    : isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-300'
                }`}
              >
                <div>
                  <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {trade.contractConfig.tradeType.toUpperCase()} {trade.contractConfig.ticks} ticks
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <p className={`text-sm font-bold ${
                  trade.status === 'won'
                    ? isDark ? 'text-green-300' : 'text-green-700'
                    : isDark ? 'text-red-300' : 'text-red-700'
                }`}>
                  {trade.status === 'won' ? '+' : '-'}{Math.abs(trade.profit || 0).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, isDark, highlight }: any) {
  return (
    <div className={`p-3 rounded-lg text-center ${
      highlight
        ? isDark ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-300'
        : isDark ? 'bg-white/[0.02]' : 'bg-white'
    }`}>
      <p className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        {label}
      </p>
      <p className={`text-lg font-black mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}
