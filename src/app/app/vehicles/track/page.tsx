
"use client";

import { MapPin, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { Button } from "@/components/ui/button";

export default function TrackVehiclesPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role !== "admin") {
      router.replace(currentUser.role === "cashier" ? "/app/sales" : "/app/dashboard");
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return <GlobalPreloaderScreen message="Loading vehicle tracking..." />;
  }

  if (currentUser.role !== "admin") {
    return <AccessDenied message="Vehicle tracking is not available for your role. Redirecting..." />;
  }

  return (
    <>
      <PageHeader 
        title="Track Vehicles" 
        description="Real-time vehicle monitoring and stock status."
        icon={MapPin}
      />
      <Card className="shadow-lg border-yellow-500/50 bg-yellow-500/5 dark:bg-yellow-700/10">
        <CardHeader className="items-center text-center sm:text-left sm:items-start">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <CardTitle className="font-headline text-xl text-yellow-700 dark:text-yellow-400">
              Premium Feature: Real-Time Vehicle Tracking
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center sm:text-left">
          <p className="text-muted-foreground mb-3">
            This is a real-time updatable vehicle report. You can see the vehicle's stock changes as it is and track the vehicle routes.
          </p>
          <p className="text-md font-semibold text-foreground mb-4">
            This advanced functionality is part of our exclusive Limidora premium package.
          </p>
          <CardDescription className="text-yellow-800/90 dark:text-yellow-300/90 mb-6">
            Upgrade your NGroup Products experience to unlock live vehicle tracking, route history, 
            and dynamic stock updates directly from your vehicles.
          </CardDescription>
          <Button variant="secondary" disabled className="w-full sm:w-auto">
            Contact Limidora to Activate Premium Features
          </Button>
           <p className="text-xs text-muted-foreground mt-4">
            Reach out to your Limidora account representative for more details on upgrading.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
