
"use client";

import { useState, useEffect, useCallback } from "react";
import type { ManagedUser, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = "/api/users";
const CACHE_KEY = "usersCache";

export function useUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (err: any) {
      setError(err.message);
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          setUsers(JSON.parse(cachedData));
          setIsLoading(false);
        }
      } catch (e) {
        console.warn("Could not read users from cache", e);
      }
      await fetchUsers();
    };

    loadData();
  }, [fetchUsers]);

  const addUser = async (userData: ManagedUser): Promise<boolean> => {
    try {
      const { id, password, ...restOfUser } = userData;
      const payload = {
          ...restOfUser,
          password_hashed_or_plain: password,
      };

      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add user");
      }
      
      await fetchUsers();
      toast({ title: "Success", description: "User added successfully." });
      return true;
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
      return false;
    }
  };

  const updateUser = async (id: string, userData: ManagedUser): Promise<boolean> => {
    try {
      const { password, ...restOfUser } = userData;
      const payload: Partial<User> = { ...restOfUser };
      if (password) {
          payload.password_hashed_or_plain = password;
      }

      const response = await fetch(`${API_BASE_URL}?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to update user");

      await fetchUsers();
      toast({ title: "Success", description: "User updated successfully." });
      return true;
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
      return false;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete user");
      
      await fetchUsers();
      toast({ title: "Success", description: "User deleted successfully." });
      return true;
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
      return false;
    }
  };

  return { users, isLoading, error, refetchUsers: fetchUsers, addUser, updateUser, deleteUser };
}
