import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
const SmartChart = dynamic(() => import("@deriv-com/smartcharts-champion").then((mod) => mod.SmartChart), { ssr: false });
import { DerivWebSocketManager } from "@/lib/deriv-websocket-manager"; // WebSocket manager

/**
 * Wrapper component for Deriv SmartChart.
 * Props allow passing chart type, symbol and additional options.
 */
interface DerivSmartChartProps {
  /** Chart type, e.g., "candlestick", "line", etc. */
  type?: string;
  /** Symbol to subscribe to, e.g., "R_100" */
  symbol?: string;
  /** Optional additional options passed to SmartChart */
  options?: Record<string, any>;
}

const DerivSmartChart: React.FC<DerivSmartChartProps> = ({
  type = "candlestick",
  symbol = "R_100",
  options = {},
}) => {
  const [latestTick, setLatestTick] = useState<any>(null);

  // Subscribe to market ticks using DerivWebSocketManager
  useEffect(() => {
    const manager = DerivWebSocketManager.getInstance();
    const unsubscribe = manager.subscribe(symbol, (data: any) => {
      if (data?.msg_type === "tick" && data.tick) {
        setLatestTick(data.tick);
      }
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [symbol]);

  // SmartChart expects callbacks; we forward the latest tick when requested.
  const requestSubscribe = useCallback((request: any, cb: (data: any) => void) => {
    // The manager already pushes ticks, so we just invoke cb with the latest tick.
    if (latestTick) {
      cb({ tick: latestTick });
    }
    // Return a dummy unsubscribe (handled by the effect above).
    return () => {};
  }, [latestTick]);

  const requestForget = useCallback((request: any, cb: () => void) => {
    // No additional cleanup needed; just call the callback.
    cb();
  }, []);

  const requestAPI = useCallback((request: any) => {
    // For now we don't need extra API calls; return empty resolved promise.
    return Promise.resolve({});
  }, []);

  return (
    <div className="deriv-smartchart-wrapper" style={{ width: "100%", height: "400px" }}>
      <SmartChart
        requestSubscribe={requestSubscribe}
        requestForget={requestForget}
        requestAPI={requestAPI}
        chart_type={type}
        symbol={symbol}
        {...options}
      />
    </div>
  );
};

export default DerivSmartChart;
