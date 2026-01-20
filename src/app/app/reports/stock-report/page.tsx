
"use client";

import { Warehouse, FileText, DownloadCloud, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StockReportTable } from "@/components/reports/StockReportTable";
import type { StockTransaction } from "@/lib/types"; 
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker"; 
import type { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns"; 
import { useStockTransactions } from "@/hooks/useStockTransactions";
import { useVehicles } from "@/hooks/useVehicles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StockReportPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7), 
    to: new Date(),
  });
  
  const { transactions: allTransactions, isLoading, error, hasMore, loadMoreTransactions } = useStockTransactions(true, dateRange);
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();

  const [filteredData, setFilteredData] = useState<(StockTransaction & { vehicleNumber?: string })[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>("all");

  const enrichedTransactions = useMemo(() => {
    if (isLoading || isLoadingVehicles) return [];
    const vehicleMap = new Map(vehicles.map(v => [v.id, v.vehicleNumber]));
    return allTransactions.map(tx => ({
        ...tx,
        vehicleNumber: tx.vehicleId ? vehicleMap.get(tx.vehicleId) : undefined
    }));
  }, [allTransactions, vehicles, isLoading, isLoadingVehicles]);

  // Apply filters
  useEffect(() => {
    let result = [...enrichedTransactions];
    
    // Date filter is already applied by the hook, this is for client-side text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(entry => 
        (entry.productName && entry.productName.toLowerCase().includes(term)) ||
        (entry.productSku && entry.productSku.toLowerCase().includes(term)) ||
        (entry.userId && entry.userId.toLowerCase().includes(term)) ||
        (entry.vehicleNumber && entry.vehicleNumber.toLowerCase().includes(term)) ||
        (entry.vehicleId && entry.vehicleId.toLowerCase().includes(term)) ||
        (entry.type && entry.type.toLowerCase().replace(/_/g, ' ').includes(term))
      );
    }
    
    if (transactionTypeFilter !== "all") {
      result = result.filter(entry => entry.type === transactionTypeFilter);
    }

    setFilteredData(result);
  }, [enrichedTransactions, searchTerm, transactionTypeFilter]);

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
     return <GlobalPreloaderScreen message="Loading report..." />;
  }

  if (currentUser.role !== "admin") {
    return (
      <AccessDenied message="Stock reports are not available for your role. Redirecting..." />
    );
  }

  const handleExportExcel = () => {
    const dataToExport = filteredData.map(tx => ({
        Date: format(tx.transactionDate, "yyyy-MM-dd HH:mm:ss"),
        Product: tx.productName,
        SKU: tx.productSku || 'N/A',
        Type: tx.type,
        Quantity: `${["ADD_STOCK_INVENTORY", "UNLOAD_FROM_VEHICLE"].includes(tx.type) ? '+' : '-'}${tx.quantity}`,
        'Previous Stock': tx.previousStock,
        'New Stock': tx.newStock,
        'User/Vehicle': tx.vehicleId ? `Veh: ${tx.vehicleNumber || tx.vehicleId}` : `User: ${tx.userId}`,
        Notes: tx.notes || ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Report");
    XLSX.writeFile(workbook, `Stock_Movement_Report_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape'); 
    doc.text(`Stock Movement Report - ${format(new Date(), 'PP')}`, 14, 16);
    
    autoTable(doc, {
      startY: 20,
      head: [['Date', 'Product', 'Type', 'Qty', 'Prev. Stock', 'New Stock', 'User/Vehicle', 'Notes']],
      body: filteredData.map(tx => [
        format(tx.transactionDate, "yy-MM-dd HH:mm"),
        `${tx.productName} (${tx.productSku || 'N/A'})`,
        tx.type.replace(/_/g, ' '),
        `${["ADD_STOCK_INVENTORY", "UNLOAD_FROM_VEHICLE"].includes(tx.type) ? '+' : '-'}${tx.quantity}`,
        tx.previousStock,
        tx.newStock,
        tx.vehicleId ? `Veh: ${tx.vehicleNumber || tx.vehicleId}` : `User: ${tx.userId}`,
        tx.notes || ''
      ]),
      styles: { 
        fontSize: 7,
        cellPadding: 1.5,
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [30, 18, 57], 
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        1: { cellWidth: 40 }, // Product
        7: { cellWidth: 50 }, // Notes
      },
      margin: { top: 20 },
    });
    
    doc.save(`Stock_Movement_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const reportActions = (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button 
        onClick={handleExportExcel} 
        variant="outline" 
        size="sm"
        disabled={isLoading || isLoadingVehicles || filteredData.length === 0}
      >
        <DownloadCloud className="mr-2 h-4 w-4" />
        Export Excel
      </Button>
      <Button 
        onClick={handleExportPDF} 
        variant="outline" 
        size="sm"
        disabled={isLoading || isLoadingVehicles || filteredData.length === 0}
      >
        <FileText className="mr-2 h-4 w-4" />
        Export PDF
      </Button>
    </div>
  );
  
  const pageIsLoading = isLoading || isLoadingVehicles;

  if (pageIsLoading && allTransactions.length === 0) { 
    return <GlobalPreloaderScreen message="Loading stock report data..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stock Report" 
        description="Detailed insights into current inventory levels and stock movements."
        icon={Warehouse}
        action={reportActions}
      />
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="font-headline">Stock Transaction Log</CardTitle>
              <CardDescription>
                {filteredData.length} transactions found
                {error && <span className="text-destructive ml-2"> (Error: {error})</span>}
              </CardDescription>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <Input
              placeholder="Search by product, user, vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <DateRangePicker 
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              className="w-full"
            />

            <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transaction Types</SelectItem>
                <SelectItem value="ADD_STOCK_INVENTORY">Add Stock to Inventory</SelectItem>
                <SelectItem value="LOAD_TO_VEHICLE">Load to Vehicle</SelectItem>
                <SelectItem value="UNLOAD_FROM_VEHICLE">Unload from Vehicle</SelectItem>
                <SelectItem value="REMOVE_STOCK_WASTAGE">Remove Stock (Wastage)</SelectItem>
                <SelectItem value="STOCK_ADJUSTMENT_MANUAL">Manual Stock Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          <StockReportTable data={filteredData} isLoading={pageIsLoading && allTransactions.length === 0} />
           {hasMore && (
             <div className="text-center py-4">
                <Button onClick={loadMoreTransactions} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Load More Transactions
                </Button>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
