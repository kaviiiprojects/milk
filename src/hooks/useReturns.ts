
"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReturnTransaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import type { DateRange } from "react-day-picker";
import type { QueryDocumentSnapshot } from "firebase/firestore";

const PAGE_SIZE = 50;

export function useReturns(fetchAll: boolean = false, dateRange?: DateRange, staffId?: string) {
  const [returns, setReturns] = useState<ReturnTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(fetchAll);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<ReturnTransaction> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const { toast } = useToast();

  const fetchInitialReturns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasMore(true);
    try {
      const res = await fetch('/api/returns/history');
      if (!res.ok) throw new Error('Failed to fetch returns');
      const initialReturns = await res.json();
      // Convert date strings to Date objects
      const processedReturns = initialReturns.map((r: any) => ({
        ...r,
        returnDate: new Date(r.returnDate),
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
      }));
      setReturns(processedReturns);
      setLastVisible(null);
      setHasMore(false);
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred while fetching returns.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Fetching Returns",
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  }, [toast, dateRange, staffId]);
  
  const loadMoreReturns = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/returns/history');
      if (!res.ok) throw new Error('Failed to fetch returns');
      const newReturns = await res.json();
      // Convert date strings to Date objects
      const processedReturns = newReturns.map((r: any) => ({
        ...r,
        returnDate: new Date(r.returnDate),
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
      }));
      setReturns(prev => [...prev, ...processedReturns]);
      setLastVisible(null);
      setHasMore(false);
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred while fetching more returns.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Loading More Returns",
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  }, [lastVisible, hasMore, isLoading, toast, dateRange, staffId]);

  useEffect(() => {
    if (fetchAll || dateRange || staffId) {
      fetchInitialReturns();
    }
  }, [fetchAll, dateRange, staffId, fetchInitialReturns]);


  return {
    returns,
    isLoading,
    error,
    hasMore,
    loadMoreReturns,
    refetchReturns: fetchInitialReturns,
  };
}
