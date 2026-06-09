'use client';

import React, { useState } from 'react';
import { Strategy, ConservativeConfig } from '@/lib/trading/types';
import { Button } from '@/components/ui/button';
import { Play, StopCircle, AlertTriangle, Clock } from 'lucide-react';

interface ConservativeTradingSubTabProps {
  theme: 'light' | 'dark';
  selectedStrategy: Strategy;
}

const DEFAULT_CONFIG: ConservativeConfig = {
  hourlyTarget: 10,
  accountBalance: 1000,
  riskPercentage: 2,
  stopLossAtConsecutiveLosses: 5,
  tradeDuration: 8,
  martingaleEnabled: false,
  martingaleMultipliers: {
    over3Under6: 1.5,
    over2Under7: 2.1,
    over1Under8: 3.1
  },
  allowedStrategies: ['over-under']
};

export default function ConservativeTradingSubTab({
  theme,
  selectedStrategy
}: ConservativeTradingSubTabProps) {
  const isDark = theme === 'dark';
  const [config, setConfig] = useState<ConservativeConfig>(DEFAULT_CONFIG);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    tradesPlaced: 0,
    hourlyProgress: 0,
    targetMet: false,
    timeElapsed: 0,
    consecutiveLosses: 0,
    sessionProfit: 0
  });

  const calculatedStake = (config.accountBalance * config.riskPercentage) / 100;
  const hourlyTargetAmount = (config.accountBalance * config.hourlyTarget) / 100;

  const handleStartSession = () => {
    setIsRunning(true);
    // Simulate session
    simulateSession();
  };

  const handleStopSession = () => {
    setIsRunning(false);
  };

  const simulateSession = () => {
    // Simulate 1-second intervals for hourly trading session
    const interval = setInterval(() => {
      setSessionStats(prev => {
        if (!isRunning) {
          clearInterval(interval);
          return prev;
        }

        const newStats = { ...prev };
        newStats.timeElapsed += 1;

        // Simulate trade every 10 seconds
        if (newStats.timeElapsed % 10 === 0) {
          const isWin = Math.random() > 0.4;
          newStats.tradesPlaced++;

          if (isWin) {
            newStats.sessionProfit += calculatedStake * 0.85;
            newStats.consecutiveLosses = 0;
          } else {
            newStats.sessionProfit -= calculatedStake;
            newStats.consecutiveLosses++;
          }
        }

        newStats.hourlyProgress = (newStats.sessionProfit / hourlyTargetAmount) * 100;
        newStats.targetMet = newStats.hourlyProgress >= 100;

        // Stop if max consecutive losses reached
        if (newStats.consecutiveLosses >= config.stopLossAtConsecutiveLosses) {
          setIsRunning(false);
          clearInterval(interval);
        }

        return newStats;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className={`rounded-xl border p-6 ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Conservative Trading Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Account Balance */}
          <div>
            <label className={`text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Account Balance ($)
            </label>
            <input
              type="number"
              value={config.accountBalance}
              onChange={(e) => setConfig({ ...config, accountBalance: parseInt(e.target.value) })}
              disabled={isRunning}
              className={`w-full p-2 rounded-lg border text-sm ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* Risk Per Trade (%) */}
          <div>
            <label className={`text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Risk Per Trade (%)
            </label>
            <select
              value={config.riskPercentage}
              onChange={(e) => setConfig({ ...config, riskPercentage: parseInt(e.target.value) })}
              disabled={isRunning}
              className={`w-full p-2 rounded-lg border text-sm ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {[1, 2, 3, 4, 5].map(pct => (
                <option key={pct} value={pct}>{pct}%</option>
              ))}
            </select>
          </div>

          {/* Hourly Target (%) */}
          <div>
            <label className={`text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Hourly Target (%)
            </label>
            <input
              type="number"
              value={config.hourlyTarget}
              onChange={(e) => setConfig({ ...config, hourlyTarget: parseInt(e.target.value) })}
              disabled={isRunning}
              className={`w-full p-2 rounded-lg border text-sm ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* Trading Duration (Hours) */}
          <div>
            <label className={`text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Trading Duration (Hours)
            </label>
            <select
              value={config.tradeDuration}
              onChange={(e) => setConfig({ ...config, tradeDuration: parseInt(e.target.value) })}
              disabled={isRunning}
              className={`w-full p-2 rounded-lg border text-sm ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              {[1, 2, 4, 8, 12, 24].map(hrs => (
                <option key={hrs} value={hrs}>{hrs}h</option>
              ))}
            </select>
          </div>

          {/* Stop Loss at Consecutive Losses */}
          <div>
            <label className={`text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Stop Loss at Consecutive Losses
            </label>
            <input
              type="number"
              min="3"
              max="10"
              value={config.stopLossAtConsecutiveLosses}
              onChange={(e) => setConfig({ ...config, stopLossAtConsecutiveLosses: parseInt(e.target.value) })}
              disabled={isRunning}
              className={`w-full p-2 rounded-lg border text-sm ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* Calculated Stake */}
          <div>
            <label className={`text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Calculated Stake Per Trade
            </label>
            <div className={`w-full p-2 rounded-lg border text-sm font-bold ${
              isDark
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                : 'bg-blue-50 border-blue-300 text-blue-700'
            }`}>
              ${calculatedStake.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Martingale Configuration */}
        <div className="mb-6">
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={config.martingaleEnabled}
              onChange={(e) => setConfig({ ...config, martingaleEnabled: e.target.checked })}
              disabled={isRunning}
              className="w-4 h-4"
            />
            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Enable Martingale Strategy
            </span>
          </label>

          {config.martingaleEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Over 3 / Under 6
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.martingaleMultipliers.over3Under6}
                  onChange={(e) => setConfig({
                    ...config,
                    martingaleMultipliers: {
                      ...config.martingaleMultipliers,
                      over3Under6: parseFloat(e.target.value)
                    }
                  })}
                  disabled={isRunning}
                  className={`w-full p-2 rounded-lg border text-sm ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Over 2 / Under 7
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.martingaleMultipliers.over2Under7}
                  onChange={(e) => setConfig({
                    ...config,
                    martingaleMultipliers: {
                      ...config.martingaleMultipliers,
                      over2Under7: parseFloat(e.target.value)
                    }
                  })}
                  disabled={isRunning}
                  className={`w-full p-2 rounded-lg border text-sm ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className={`text-xs font-bold uppercase mb-2 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Over 1 / Under 8
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.martingaleMultipliers.over1Under8}
                  onChange={(e) => setConfig({
                    ...config,
                    martingaleMultipliers: {
                      ...config.martingaleMultipliers,
                      over1Under8: parseFloat(e.target.value)
                    }
                  })}
                  disabled={isRunning}
                  className={`w-full p-2 rounded-lg border text-sm ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-3">
          {!isRunning ? (
            <Button
              onClick={handleStartSession}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4" />
              Start Trading Session
            </Button>
          ) : (
            <Button
              onClick={handleStopSession}
              variant="destructive"
              className="gap-2"
            >
              <StopCircle className="h-4 w-4" />
              Stop Session
            </Button>
          )}
        </div>
      </div>

      {/* Session Progress */}
      {isRunning && (
        <div className={`rounded-xl border p-6 ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Session Progress
          </h3>

          {/* Time Elapsed */}
          <div className={`p-4 rounded-lg mb-4 flex items-center gap-3 ${
            isDark ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-blue-50 border border-blue-300'
          }`}>
            <Clock className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <p className={`text-xs font-bold uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Time Elapsed
              </p>
              <p className={`text-2xl font-black ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                {formatTime(sessionStats.timeElapsed)}
              </p>
            </div>
          </div>

          {/* Hourly Target Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-bold uppercase ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Hourly Target: ${hourlyTargetAmount.toFixed(2)}
              </p>
              <p className={`text-sm font-bold ${sessionStats.hourlyProgress >= 100 ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-slate-400' : 'text-slate-600')}`}>
                {sessionStats.hourlyProgress.toFixed(1)}%
              </p>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full ${sessionStats.targetMet ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(sessionStats.hourlyProgress, 100)}%` }}
              />
            </div>
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatBox
              label="Trades Placed"
              value={sessionStats.tradesPlaced.toString()}
              isDark={isDark}
            />
            <StatBox
              label="Consecutive Losses"
              value={sessionStats.consecutiveLosses.toString()}
              isDark={isDark}
              highlight={sessionStats.consecutiveLosses > 2}
            />
            <StatBox
              label="Session Profit"
              value={`$${sessionStats.sessionProfit.toFixed(2)}`}
              isDark={isDark}
              highlight={sessionStats.sessionProfit > 0}
            />
            <StatBox
              label="Target Status"
              value={sessionStats.targetMet ? 'MET' : 'PENDING'}
              isDark={isDark}
              highlight={sessionStats.targetMet}
            />
          </div>

          {/* Warnings */}
          {sessionStats.consecutiveLosses >= config.stopLossAtConsecutiveLosses - 1 && (
            <div className={`p-3 rounded-lg border flex items-start gap-2 ${
              isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-300'
            }`}>
              <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                Approaching stop loss limit ({sessionStats.consecutiveLosses}/{config.stopLossAtConsecutiveLosses})
              </p>
            </div>
          )}
        </div>
      )}
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
      <p className={`text-sm font-black mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}
