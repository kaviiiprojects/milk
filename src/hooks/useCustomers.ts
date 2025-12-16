
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Customer } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import type { QueryDocumentSnapshot } from "firebase/firestore";

const API_BASE_URL = "/api/customers";
const CACHE_KEY = "customersCache";


export function useCustomers(paginated: boolean = false) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<Customer> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const fetchedCustomers = await response.json();
      setCustomers(fetchedCustomers);
      localStorage.setItem(CACHE_KEY, JSON.stringify(fetchedCustomers));
    } catch (err: any) {
       const errorMessage = err.message || "An unknown error occurred while fetching customers.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Fetching Customers",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const fetchInitialPaginated = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasMore(true);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const initialCustomers = await response.json();
      setCustomers(initialCustomers);
      setLastVisible(null);
      setHasMore(false);
    } catch (err: any) {
        const errorMessage = err.message || "An unknown error occurred while fetching customers.";
        setError(errorMessage);
        toast({ variant: "destructive", title: "Error Fetching Customers", description: errorMessage });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  const loadMoreCustomers = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const newCustomers = await response.json();
      setCustomers(prev => [...prev, ...newCustomers]);
      setLastVisible(null);
      setHasMore(false);
    } catch (err: any)      {
        const errorMessage = err.message || "An unknown error occurred while fetching more customers.";
        setError(errorMessage);
        toast({ variant: "destructive", title: "Error Loading More", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [lastVisible, hasMore, isLoading, toast]);


  useEffect(() => {
    if (paginated) {
        fetchInitialPaginated();
    } else {
        const loadData = async () => {
            try {
                const cachedData = localStorage.getItem(CACHE_KEY);
                if (cachedData) {
                    setCustomers(JSON.parse(cachedData));
                    setIsLoading(false); 
                }
            } catch (e) {
                console.warn("Could not read customers from cache", e);
            }
            await refetch();
        };
        loadData();
    }
  }, [paginated, refetch, fetchInitialPaginated]);


  const addCustomer = async (customerData: Omit<Customer, "id" | "avatar">): Promise<Customer | null> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to add customer" }));
        throw new Error(errorData.details || errorData.error || "Failed to add customer. Server responded with an error.");
      }
      const newCustomer = await response.json();
      await refetch(); 
      return newCustomer;
    } catch (err: any) {
      console.error("Error adding customer:", err);
      toast({
        variant: "destructive",
        title: "Failed to Add Customer",
        description: err.message,
      });
      return null;
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Omit<Customer, "id">>): Promise<Customer | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ message: "Failed to update customer" }));
        throw new Error(errorData.details || errorData.error || `Failed to update customer. Server responded with status ${response.status}.`);
      }
      await refetch(); 
      const updatedCustomerState = customers.find(c => c.id === id);
      return updatedCustomerState ? { ...updatedCustomerState, ...customerData } as Customer : null;

    } catch (err: any) {
      console.error("Error updating customer:", err);
      toast({
        variant: "destructive",
        title: "Failed to Update Customer",
        description: err.message,
      });
      return null;
    }
  };

  const deleteCustomer = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to delete customer" }));
        throw new Error(errorData.details || errorData.error || `Failed to delete customer. Server responded with status ${response.status}.`);
      }
      await refetch(); 
      return true;
    } catch (err: any) {
      console.error("Error deleting customer:", err);
      toast({
        variant: "destructive",
        title: "Failed to Delete Customer",
        description: err.message,
      });
      return false;
    }
  };

  return {
    customers,
    isLoading,
    error,
    hasMore,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetchCustomers: refetch,
    loadMoreCustomers,
  };
}
