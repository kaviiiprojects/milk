
"use client";

import React, { useState, useEffect } from "react";
import { ListPlus, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { VehicleTable } from "@/components/vehicles/VehicleTable";
import { VehicleDialog } from "@/components/vehicles/VehicleDialog";
import type { Vehicle } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { Button } from "@/components/ui/button";
import { useVehicles } from "@/hooks/useVehicles";

export default function ManageVehiclesPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { 
    vehicles, 
    isLoading, 
    error, 
    addVehicle, 
    updateVehicle, 
    deleteVehicle 
  } = useVehicles();

  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role !== "admin") {
      router.replace(currentUser.role === "cashier" ? "/app/sales" : "/app/dashboard");
    }
  }, [currentUser, router]);

  const handleOpenAddDialog = () => {
    setEditingVehicle(null);
    setIsVehicleDialogOpen(true);
  };

  const handleOpenEditDialog = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsVehicleDialogOpen(true);
  };

  const handleSaveVehicle = async (vehicleData: Vehicle) => {
    let success = false;
    if (editingVehicle) {
      const result = await updateVehicle(vehicleData.id, vehicleData);
      success = !!result;
    } else {
      const result = await addVehicle(vehicleData);
      success = !!result;
    }

    if (success) {
      setIsVehicleDialogOpen(false);
      setEditingVehicle(null);
    }
  };

  if (!currentUser) {
    return <GlobalPreloaderScreen message="Loading vehicle management..." />;
  }

  if (currentUser.role !== "admin") {
    return <AccessDenied message="Vehicle management is not available for your role. Redirecting..." />;
  }

  const pageActions = (
    <Button onClick={handleOpenAddDialog}>
      <PlusCircle className="mr-2 h-4 w-4" />
      Add Vehicle
    </Button>
  );

  return (
    <>
      <PageHeader 
        title="Manage Vehicles" 
        description="Add, edit, and view all registered vehicles."
        icon={ListPlus}
        action={pageActions}
      />
      <div className="space-y-6">
        <VehicleTable 
          vehicles={vehicles} 
          isLoading={isLoading}
          error={error}
          onEditVehicle={handleOpenEditDialog} 
          onDeleteVehicle={deleteVehicle} 
        />
      </div>

      {isVehicleDialogOpen && (
        <VehicleDialog
          vehicle={editingVehicle}
          open={isVehicleDialogOpen}
          onOpenChange={setIsVehicleDialogOpen}
          onSave={handleSaveVehicle}
          isEditMode={!!editingVehicle}
          existingVehicleNumbers={vehicles.map(v => v.vehicleNumber)}
        />
      )}
    </>
  );
}
