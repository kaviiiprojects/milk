
"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Vehicle } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VehicleDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (vehicle: Vehicle) => Promise<void>;
  isEditMode: boolean;
  existingVehicleNumbers: string[];
}

export function VehicleDialog({
  vehicle,
  open,
  onOpenChange,
  onSave,
  isEditMode,
  existingVehicleNumbers,
}: VehicleDialogProps) {
  const [formData, setFormData] = useState<Partial<Omit<Vehicle, 'id'>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (isEditMode && vehicle) {
        setFormData({
          vehicleNumber: vehicle.vehicleNumber,
          driverName: vehicle.driverName,
          notes: vehicle.notes,
        });
      } else {
        setFormData({
          vehicleNumber: "",
          driverName: "",
          notes: "",
        });
      }
    }
  }, [open, vehicle, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const vehicleNumber = (formData.vehicleNumber || "").trim().toUpperCase();

    if (!vehicleNumber) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Vehicle Number is required.",
      });
      return;
    }

    if (!isEditMode && existingVehicleNumbers.map(v => v.toUpperCase()).includes(vehicleNumber)) {
      toast({
        variant: "destructive",
        title: "Duplicate Vehicle Number",
        description: "A vehicle with this number already exists.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const vehicleToSave: Vehicle = {
        id: vehicle?.id || "", // ID is handled by the hook/backend for new vehicles
        vehicleNumber,
        driverName: formData.driverName?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      };
      await onSave(vehicleToSave);
    } catch (error) {
      // Error toast is likely handled by the hook
      console.error("Failed to save vehicle:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">
              {isEditMode ? "Edit Vehicle" : "Add New Vehicle"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update the details for this vehicle." : "Fill in the details for the new vehicle."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
              <Input
                id="vehicleNumber"
                name="vehicleNumber"
                value={formData.vehicleNumber || ""}
                onChange={handleChange}
                placeholder="e.g., CBA-1234"
                required
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="driverName">Driver Name (Optional)</Label>
              <Input
                id="driverName"
                name="driverName"
                value={formData.driverName || ""}
                onChange={handleChange}
                placeholder="e.g., John Doe"
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="notes">Special Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ""}
                onChange={handleChange}
                placeholder="e.g., Refrigerated van, specific route info"
                className="mt-1"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditMode ? "Update Vehicle" : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
