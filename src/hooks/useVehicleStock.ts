
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { StockTransaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function useVehicleStock(vehicleId: string | undefined, enabled: boolean = true) {
  const [vehicleStock, setVehicleStock] = useState<Map<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchVehicleStock = useCallback(async () => {
    if (!vehicleId || !enabled) {
      setVehicleStock(null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/stock-transactions?vehicleId=${vehicleId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch vehicle stock data.');
      }
      const transactions: StockTransaction[] = await response.json();
      
      const stockMap = new Map<string, number>();
      transactions.forEach(tx => {
        const currentQty = stockMap.get(tx.productId) || 0;
        if (tx.type === 'LOAD_TO_VEHICLE') {
          stockMap.set(tx.productId, currentQty + tx.quantity);
        } else if (tx.type === 'UNLOAD_FROM_VEHICLE' || tx.type === 'ISSUE_SAMPLE') {
          stockMap.set(tx.productId, currentQty - tx.quantity);
        }
      });
      setVehicleStock(stockMap);
    } catch (error) {
      console.error('Error fetching vehicle stock:', error);
      // Don't show toast on every polling error to avoid spam
      if (!intervalRef.current) {
        toast({ variant: "destructive", title: "Error", description: "Could not load vehicle stock." });
      }
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId, enabled, toast]);

  // Initial fetch
  useEffect(() => {
    if (vehicleId && enabled) {
      fetchVehicleStock();
    } else {
      setVehicleStock(null);
    }
  }, [vehicleId, enabled, fetchVehicleStock]);

  // Polling for real-time updates (every 5 seconds)
  useEffect(() => {
    if (vehicleId && enabled) {
      intervalRef.current = setInterval(() => {
        fetchVehicleStock();
      }, 20000); // Poll every 20 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [vehicleId, enabled, fetchVehicleStock]);

  // Manual refetch function
  const refetch = useCallback(() => {
    fetchVehicleStock();
  }, [fetchVehicleStock]);

  return {
    vehicleStock,
    isLoading,
    refetch,
  };
}

