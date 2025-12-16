
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Vehicle } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = "/api/vehicles";
const CACHE_KEY = "vehiclesCache";

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error('Failed to fetch vehicles');
        const fetchedVehicles = await response.json();
        const sortedVehicles = fetchedVehicles.sort((a, b) => a.vehicleNumber.localeCompare(b.vehicleNumber));
        setVehicles(sortedVehicles);
        localStorage.setItem(CACHE_KEY, JSON.stringify(sortedVehicles));
    } catch (err: any) {
        const errorMessage = err.message || "An unknown error occurred while fetching vehicles.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error Fetching Vehicles",
          description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          setVehicles(JSON.parse(cachedData));
          setIsLoading(false);
        }
      } catch (e) {
        console.warn("Could not read vehicles from cache", e);
      }
      await fetchVehicles();
    };

    loadData();
  }, [fetchVehicles]);

  const addVehicle = async (vehicleData: Omit<Vehicle, "id">): Promise<Vehicle | null> => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to add vehicle" }));
        throw new Error(errorData.message || "Failed to add vehicle.");
      }
      const newVehicle = await response.json();
      await fetchVehicles(); // Refetch
      toast({
        title: "Vehicle Added",
        description: `Vehicle ${newVehicle.vehicleNumber} has been successfully added.`,
      });
      return newVehicle;
    } catch (err: any) {
      console.error("Error adding vehicle:", err);
      toast({
        variant: "destructive",
        title: "Failed to Add Vehicle",
        description: err.message,
      });
      return null;
    }
  };

  const updateVehicle = async (id: string, vehicleData: Partial<Omit<Vehicle, "id">>): Promise<Vehicle | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to update vehicle" }));
        throw new Error(errorData.message || `Failed to update vehicle.`);
      }
      await fetchVehicles(); // Refetch
      toast({
        title: "Vehicle Updated",
        description: `Vehicle ${vehicleData.vehicleNumber || ''} has been successfully updated.`,
      });
      const updatedVehicle = vehicles.find(c => c.id === id);
      return updatedVehicle ? { ...updatedVehicle, ...vehicleData } : null;
    } catch (err: any) {
      console.error("Error updating vehicle:", err);
      toast({
        variant: "destructive",
        title: "Failed to Update Vehicle",
        description: err.message,
      });
      return null;
    }
  };

  const deleteVehicle = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to delete vehicle" }));
        throw new Error(errorData.message || `Failed to delete vehicle.`);
      }
      await fetchVehicles(); // Refetch
      toast({
        title: "Vehicle Deleted",
        description: "The vehicle has been successfully deleted.",
      });
      return true;
    } catch (err: any) {
      console.error("Error deleting vehicle:", err);
      toast({
        variant: "destructive",
        title: "Failed to Delete Vehicle",
        description: err.message,
      });
      return false;
    }
  };

  return {
    vehicles,
    isLoading,
    error,
    addVehicle,
    updateVehicle,
    deleteVehicle,
  };
}
