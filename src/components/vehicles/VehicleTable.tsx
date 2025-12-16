
"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Truck, Edit, Trash2, MoreHorizontal, Loader2, AlertTriangle } from "lucide-react";
import type { Vehicle } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Skeleton } from "@/components/ui/skeleton";

interface VehicleTableProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  onEditVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vehicleId: string) => void;
}

export function VehicleTable({ vehicles, isLoading, error, onEditVehicle, onDeleteVehicle }: VehicleTableProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [vehicleToDelete, setVehicleToDelete] = React.useState<Vehicle | null>(null);

  const openDeleteConfirmation = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (vehicleToDelete) {
      onDeleteVehicle(vehicleToDelete.id);
    }
    setIsDeleteAlertOpen(false);
    setVehicleToDelete(null);
  };

  const renderLoadingSkeletons = () => {
    return [...Array(3)].map((_, i) => (
      isMobile ? (
        <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>
      ) : (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-6 w-32" /></TableCell>
          <TableCell><Skeleton className="h-6 w-32" /></TableCell>
          <TableCell><Skeleton className="h-6 w-full" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
        </TableRow>
      )
    ));
  };
  
  if (isLoading && vehicles.length === 0) {
      return (
          <Card className="shadow-md">
              <CardHeader>
                  <CardTitle className="font-headline">Registered Vehicles</CardTitle>
                  <CardDescription>Loading vehicle data...</CardDescription>
              </CardHeader>
              <CardContent>
                  {isMobile ? <div className="space-y-3">{renderLoadingSkeletons()}</div> : <Table><TableBody>{renderLoadingSkeletons()}</TableBody></Table>}
              </CardContent>
          </Card>
      );
  }

  if (error) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-destructive">Error Loading Vehicles</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Card className="shadow-md text-center">
        <CardHeader>
            <CardTitle className="font-headline">Registered Vehicles</CardTitle>
        </CardHeader>
        <CardContent className="py-10">
          <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No vehicles have been added yet.</p>
          <p className="text-sm text-muted-foreground">Click "Add Vehicle" to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline">Registered Vehicles ({vehicles.length})</CardTitle>
          <CardDescription>List of all vehicles currently in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            <ScrollArea className="h-[calc(100vh-28rem)]">
              <div className="space-y-3">
                {vehicles.map((vehicle) => (
                  <Card key={vehicle.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-primary">{vehicle.vehicleNumber}</p>
                        <p className="text-sm text-muted-foreground">Driver: {vehicle.driverName || "N/A"}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onEditVehicle(vehicle)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteConfirmation(vehicle)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {vehicle.notes && (
                      <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
                        <strong>Notes:</strong> {vehicle.notes}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-[300px] sm:h-[400px] lg:h-[calc(100vh-28rem)]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Driver Name</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <Badge variant="secondary">{vehicle.vehicleNumber}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{vehicle.driverName || "N/A"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {vehicle.notes || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onEditVehicle(vehicle)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openDeleteConfirmation(vehicle)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle: {vehicleToDelete?.vehicleNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vehicle? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Vehicle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
