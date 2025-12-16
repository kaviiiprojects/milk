
"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useVehicles } from "@/hooks/useVehicles";
import { useStockTransactions } from "@/hooks/useStockTransactions";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { Truck, Search, Loader2, CalendarIcon } from "lucide-react";
import type { StockTransaction, VehicleReportItem } from "@/lib/types";
import { startOfDay, endOfDay, format } from "date-fns";
import { VehicleReportDisplay } from "@/components/reports/VehicleReportDisplay";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportState {
  items: VehicleReportItem[];
  startMeter?: number;
  endMeter?: number;
  totalKm?: number;
}

export default function VehicleReportPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();
  const { transactions: allTransactions, isLoading: isLoadingTransactions } = useStockTransactions();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [reportData, setReportData] = useState<ReportState | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role !== "admin") {
      router.replace(currentUser.role === "cashier" ? "/app/sales" : "/app/dashboard");
    }
  }, [currentUser, router]);

  const handleGenerateReport = () => {
    if (!selectedVehicleId || !selectedDate) {
      alert("Please select a vehicle and a date.");
      return;
    }
    setIsGenerating(true);
    setReportData(null);

    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    setSelectedVehicleNumber(vehicle?.vehicleNumber);

    const reportStartDate = startOfDay(selectedDate);
    const reportEndDate = endOfDay(selectedDate);

    const filteredTransactions = allTransactions.filter(tx =>
      tx.vehicleId === selectedVehicleId &&
      tx.transactionDate >= reportStartDate &&
      tx.transactionDate <= reportEndDate
    );
    
    // Process Stock Movement
    const processedData = new Map<string, VehicleReportItem>();
    const relevantStockTxs = filteredTransactions.filter(tx => tx.type === 'LOAD_TO_VEHICLE' || tx.type === 'UNLOAD_FROM_VEHICLE' || tx.type === 'ISSUE_SAMPLE');

    for (const tx of relevantStockTxs) {
      if (!processedData.has(tx.productId)) {
        processedData.set(tx.productId, {
          productId: tx.productId,
          productName: tx.productName,
          productSku: tx.productSku,
          totalLoaded: 0,
          totalUnloaded: 0,
          netChange: 0,
        });
      }

      const item = processedData.get(tx.productId)!;
      if (tx.type === 'LOAD_TO_VEHICLE') {
        item.totalLoaded += tx.quantity;
      } else if (tx.type === 'UNLOAD_FROM_VEHICLE' || tx.type === 'ISSUE_SAMPLE') {
        item.totalUnloaded += tx.quantity;
      }
    }
    
    processedData.forEach(item => {
        item.netChange = item.totalLoaded - item.totalUnloaded;
    });
    
    // Process Mileage
    const loadTxs = filteredTransactions.filter(tx => tx.type === 'LOAD_TO_VEHICLE' && tx.startMeter);
    const unloadTxs = filteredTransactions.filter(tx => tx.type === 'UNLOAD_FROM_VEHICLE' && tx.endMeter);

    const startMeter = loadTxs.length > 0 ? Math.min(...loadTxs.map(tx => tx.startMeter!)) : undefined;
    const endMeter = unloadTxs.length > 0 ? Math.max(...unloadTxs.map(tx => tx.endMeter!)) : undefined;
    
    let totalKm: number | undefined;
    if (startMeter !== undefined && endMeter !== undefined && endMeter >= startMeter) {
        totalKm = endMeter - startMeter;
    }

    setReportData({
        items: Array.from(processedData.values()),
        startMeter,
        endMeter,
        totalKm
    });
    setIsGenerating(false);
  };
  
  const pageIsLoading = isLoadingVehicles || isLoadingTransactions;

  if (pageIsLoading && !currentUser) {
    return <GlobalPreloaderScreen message="Loading..." />;
  }

  if (!currentUser) {
    return <GlobalPreloaderScreen message="Redirecting..." />;
  }
  
  if (currentUser.role !== "admin") {
      return <AccessDenied message="Vehicle reports are not available for your role." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Vehicle Report" 
        description="Analyze stock loaded, unloaded, and mileage for a specific vehicle."
        icon={Truck}
      />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Report Filters</CardTitle>
          <CardDescription>Select a vehicle and a date to generate the report.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId} disabled={pageIsLoading}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingVehicles ? "Loading vehicles..." : "Select a vehicle"} />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.vehicleNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal h-10",
                  !selectedDate && "text-muted-foreground"
                )}
                disabled={pageIsLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button 
            onClick={handleGenerateReport} 
            disabled={!selectedVehicleId || !selectedDate || isGenerating || pageIsLoading}
            className="h-10"
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Generate Report
          </Button>
        </CardContent>
      </Card>

      {isGenerating ? (
          <div className="flex justify-center items-center h-48">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
      ) : reportData ? (
        <VehicleReportDisplay 
            report={reportData} 
            vehicleNumber={selectedVehicleNumber || ""}
            reportDate={selectedDate}
        />
      ) : (
        <Card className="shadow-lg">
            <CardContent className="py-12 text-center text-muted-foreground">
                <p>Please select your filters and click "Generate Report" to view data.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
