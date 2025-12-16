
"use client";

import { useState, useEffect, useCallback } from "react";
import type { StockTransaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import type { DateRange } from "react-day-picker";
import type { QueryDocumentSnapshot } from 'firebase/firestore';

const PAGE_SIZE = 50;

async function getStockTransactions(_lastVisible?: QueryDocumentSnapshot<StockTransaction>, _dateRange?: DateRange): Promise<{ transactions: StockTransaction[], lastVisible: QueryDocumentSnapshot<StockTransaction> | null }> {
  const res = await fetch('/api/stock-transactions');
  if (!res.ok) throw new Error('Failed to fetch stock transactions');
  const transactionsData = await res.json();
  // Convert date strings to Date objects
  const transactions: StockTransaction[] = transactionsData.map((t: any) => ({
    ...t,
    transactionDate: new Date(t.transactionDate),
    createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
    updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
  }));
  return { transactions, lastVisible: null };
}

export function useStockTransactions(fetchAll: boolean = false, dateRange?: DateRange) {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(fetchAll);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<StockTransaction> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const fetchInitialTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasMore(true);
    try {
      const { transactions: initial, lastVisible: newLastVisible } = await getStockTransactions(undefined, dateRange);
      setTransactions(initial);
      setLastVisible(newLastVisible);
      if (initial.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Fetching Stock Report",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, dateRange]);
  
  const loadMoreTransactions = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const { transactions: newTransactions, lastVisible: newLastVisible } = await getStockTransactions(lastVisible, dateRange);
      setTransactions(prev => [...prev, ...newTransactions]);
      setLastVisible(newLastVisible);
      if (newTransactions.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Loading More Transactions",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [lastVisible, hasMore, isLoading, toast, dateRange]);

  useEffect(() => {
    if(fetchAll){
        fetchInitialTransactions();
    }
  }, [fetchAll, fetchInitialTransactions]);
  
  useEffect(() => {
    fetchInitialTransactions();
  }, [dateRange, fetchInitialTransactions]);

  return {
    transactions,
    isLoading,
    error,
    hasMore,
    loadMoreTransactions,
    refetchTransactions: fetchInitialTransactions,
  };
}
