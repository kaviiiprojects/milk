
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Expense } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import type { DateRange } from "react-day-picker";

const API_BASE_URL = "/api/expenses";

export function useExpenses(initialFetch: boolean = false, dateRange?: DateRange, staffId?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(initialFetch);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchExpenses = useCallback(async (range?: DateRange, sId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE_URL);
      if (!res.ok) throw new Error('Failed to fetch expenses');
      const fetchedExpenses = await res.json();
      // Convert date strings to Date objects
      const processedExpenses = fetchedExpenses.map((e: any) => ({
        ...e,
        expenseDate: new Date(e.expenseDate),
        createdAt: e.createdAt ? new Date(e.createdAt) : undefined,
      }));
      setExpenses(processedExpenses);
    } catch (err: any) {
      const errorMessage = err.message || "Could not load expenses.";
      setError(errorMessage);
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (initialFetch) {
      fetchExpenses(dateRange, staffId);
    } else {
      setIsLoading(false);
    }
  }, [initialFetch, dateRange, staffId, fetchExpenses]);


  const addExpense = async (expenseData: Omit<Expense, "id">): Promise<Expense | null> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add expense");
      }
      const newExpense = await response.json();
      // No automatic refetch, let the component decide when to call fetchExpenses
      toast({ title: "Success", description: "Expense added successfully." });
      return newExpense;
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
      return null;
    }
  };
  
  const deleteExpense = async (id: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}?id=${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to delete expense");
        }
        // Optimistically remove from local state to update UI instantly
        setExpenses(prev => prev.filter(exp => exp.id !== id));
        toast({ title: "Success", description: "Expense deleted." });
        return true;
    } catch (err: any) {
        toast({ variant: "destructive", title: "Error", description: err.message });
        return false;
    }
  };

  return { expenses, setExpenses, isLoading, error, addExpense, deleteExpense, fetchExpenses };
}
