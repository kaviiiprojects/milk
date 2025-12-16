

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Sale } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { DateRange } from "react-day-picker";
import { startOfYear } from "date-fns";

const CACHE_KEY = "salesCache";
const PAGE_SIZE = 50; 

export function useSalesData(fetchAllInitially: boolean = false, dateRange?: DateRange, staffId?: string) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<Sale> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const { toast } = useToast();

  const refetchSales = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasMore(true); // Reset pagination state on refetch
    
    try {
      const res = await fetch('/api/sales');
      if (!res.ok) throw new Error('Failed to fetch sales');
      const fetchedSales = await res.json();
      const processedSales = fetchedSales.map((s: any) => ({...s, saleDate: new Date(s.saleDate)}));

      setSales(processedSales);
      setLastVisible(null);
      setHasMore(false);
      
      if (fetchAllInitially && !dateRange && !staffId) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(processedSales));
      }

    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred while fetching sales.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Fetching Sales",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, dateRange, staffId, fetchAllInitially]);

  useEffect(() => {
    if (fetchAllInitially) {
        const loadData = async () => {
            if (!dateRange && !staffId) {
                try {
                    const cachedData = localStorage.getItem(CACHE_KEY);
                    if (cachedData) {
                        const parsedSales = JSON.parse(cachedData).map((s: any) => ({...s, saleDate: new Date(s.saleDate)}));
                        setSales(parsedSales);
                        setIsLoading(false); 
                    }
                } catch (e) {
                    console.warn("Could not read sales from cache", e);
                }
            }
            await refetchSales();
        };
        loadData();
    } else {
      const fetchPaginatedInitial = async () => {
        setIsLoading(true);
        setError(null);
        setHasMore(true);
        try {
            const res = await fetch('/api/sales');
            if (!res.ok) throw new Error('Failed to fetch sales');
            const initialSales = await res.json();
            const processedSales = initialSales.map((s: any) => ({...s, saleDate: new Date(s.saleDate)}));
            setSales(processedSales);
            setLastVisible(null);
            setHasMore(false);
        } catch (err: any) {
            const errorMessage = err.message || "An error occurred fetching initial sales.";
            setError(errorMessage);
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
      };
      fetchPaginatedInitial();
    }
  }, [fetchAllInitially, dateRange, staffId, refetchSales, toast]);

  const loadMoreSales = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/sales');
      if (!res.ok) throw new Error('Failed to fetch sales');
      const newSales = await res.json();
      const processedSales = newSales.map((s: any) => ({...s, saleDate: new Date(s.saleDate)}));
      setSales(prev => [...prev, ...processedSales]);
      setLastVisible(null);
      setHasMore(false);
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred while fetching more sales.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Loading More Sales",
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  }, [lastVisible, hasMore, isLoading, toast, dateRange, staffId]);
  
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.status !== 'cancelled' ? sale.totalAmount : 0), 0);

  return {
    sales,
    setSales,
    isLoading,
    error,
    totalRevenue,
    hasMore, 
    loadMoreSales,
    refetchSales,
  };
}
