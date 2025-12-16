
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Vehicle } from "@/lib/types";
import { PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VehicleFormProps {
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  existingVehicleNumbers: string[]; // To check for duplicates
}

export function VehicleForm({ onAddVehicle, existingVehicleNumbers }: VehicleFormProps) {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Vehicle Number is required.",
      });
      return;
    }

    if (existingVehicleNumbers.includes(vehicleNumber.trim().toUpperCase())) {
      toast({
        variant: "destructive",
        title: "Duplicate Vehicle Number",
        description: "A vehicle with this number already exists.",
      });
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      onAddVehicle({ 
        vehicleNumber: vehicleNumber.trim().toUpperCase(), 
        driverName: driverName.trim() || undefined, // Set to undefined if empty
        notes: notes.trim() 
      });
      toast({
        title: "Vehicle Added",
        description: `Vehicle ${vehicleNumber.trim().toUpperCase()} has been successfully added.`,
      });
      setVehicleNumber("");
      setDriverName("");
      setNotes("");
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <Card className="shadow-md mb-6">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <PlusCircle className="h-6 w-6 text-primary" />
          Add New Vehicle
        </CardTitle>
        <CardDescription>Enter the details for the new vehicle.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
            <Input
              id="vehicleNumber"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="e.g., CBA-1234"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="driverName">Driver Name (Optional)</Label>
            <Input
              id="driverName"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="e.g., John Doe"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="notes">Special Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Refrigerated van, specific route info"
              className="mt-1"
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Vehicle...
              </>
            ) : (
              "Add Vehicle"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
