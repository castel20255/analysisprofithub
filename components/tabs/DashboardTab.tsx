'use client'

import React from 'react';
import { UnifiedTradingDashboard } from '../unified-trading-dashboard';

interface DashboardTabProps {
  theme?: 'light' | 'dark';
}

/**
 * Dashboard tab component rendering the unified trading dashboard.
 * It accepts an optional theme prop to toggle light/dark styling.
 */
export default function DashboardTab({ theme = 'dark' }: DashboardTabProps) {
  return (
    <div className={`p-4 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <UnifiedTradingDashboard />
    </div>
  );
}
