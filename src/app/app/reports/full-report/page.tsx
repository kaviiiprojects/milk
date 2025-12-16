
"use client";

import { ClipboardList, FileText, Printer, DownloadCloud, Filter, Loader2, Beaker, FilterX } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FullReportTable } from "@/components/reports/FullReportTable";
import type { FullReportEntry, Sale, ReturnTransaction, Product, StockTransaction } from "@/lib/types"; 
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf-autotable';
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker"; 
import type { DateRange } from "react-day-picker";
import { addDays, format, parseISO } from "date-fns"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSalesData } from "@/hooks/useSalesData"; 
import { useReturns } from "@/hooks/useReturns";
import { useStockTransactions } from "@/hooks/useStockTransactions";
import { useProducts } from "@/hooks/useProducts";

function transformTransactionsToFullReportEntries(
  sales: Sale[],
  returns: ReturnTransaction[],
  stockTransactions: StockTransaction[],
  allProducts: Product[]
): FullReportEntry[] {
  const reportEntries: FullReportEntry[] = [];
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);
  
  // Process Sales
  sales.forEach(sale => {
    if (sale.status === 'cancelled') return;
    const paymentDetails: { date: Date; summary: string }[] = [];
    
    if (sale.paidAmountCash && sale.paidAmountCash > 0) {
      let summary = `Cash Paid: ${formatCurrency(sale.paidAmountCash)}`;
      if (sale.changeGiven && sale.changeGiven > 0) summary += ` (Change: ${formatCurrency(sale.changeGiven)})`;
      paymentDetails.push({ date: sale.saleDate, summary });
    }
    if (sale.paidAmountCheque && sale.paidAmountCheque > 0) {
      paymentDetails.push({ date: sale.saleDate, summary: `Cheque (#${sale.chequeDetails?.number || 'N/A'}): ${formatCurrency(sale.paidAmountCheque)}` });
    }
    if (sale.paidAmountBankTransfer && sale.paidAmountBankTransfer > 0) {
      paymentDetails.push({ date: sale.saleDate, summary: `Bank Transfer: ${formatCurrency(sale.paidAmountBankTransfer)}` });
    }
    
    sale.additionalPayments?.forEach(p => {
      let summary = `${p.method}: ${formatCurrency(p.amount)}`;
      if (p.method === 'Cheque' && p.details && 'number' in p.details) summary += ` (#${p.details.number})`;
      if (p.method === 'BankTransfer' && p.details && 'referenceNumber' in p.details) summary += ` (Ref: ${p.details.referenceNumber || 'N/A'})`;
      if(p.notes) summary += ` - Notes: ${p.notes}`;
      paymentDetails.push({ date: p.date, summary });
    });

    const invoiceCloseDate = (sale.outstandingBalance <= 0 && sale.updatedAt) 
      ? format(new Date(sale.updatedAt), "yyyy-MM-dd") 
      : undefined;

    sale.items.forEach(item => {
      const originalProduct = allProducts.find(p => p.id === item.id);
      const originalPrice = (item.saleType === 'wholesale' && originalProduct?.wholesalePrice) ? originalProduct.wholesalePrice : (originalProduct?.price || item.appliedPrice);
      const discountOnItem = originalPrice - item.appliedPrice;
      reportEntries.push({
        transactionId: sale.id,
        transactionType: 'Sale',
        transactionDate: format(sale.saleDate, "yyyy-MM-dd"),
        transactionTime: format(sale.saleDate, "HH:mm:ss"),
        invoiceCloseDate,
        customerName: sale.customerName || "Walk-in",
        productName: item.name,
        productCategory: item.category,
        quantity: item.quantity,
        appliedPrice: item.appliedPrice,
        discountOnItem: discountOnItem > 0.009 ? discountOnItem : undefined,
        lineTotal: item.quantity * item.appliedPrice,
        saleType: item.saleType,
        paymentSummary: sale.paymentSummary,
        paymentDetails,
        staffId: sale.staffId,
      });
    });
  });

  // Process Returns
  returns.forEach(ret => {
    ret.returnedItems.forEach(item => {
      reportEntries.push({
        transactionId: ret.id,
        transactionType: 'Return',
        transactionDate: format(ret.returnDate, "yyyy-MM-dd"),
        transactionTime: format(ret.returnDate, "HH:mm:ss"),
        relatedId: ret.originalSaleId,
        customerName: ret.customerName || 'N/A',
        productName: item.name,
        productCategory: item.category,
        quantity: -item.quantity,
        appliedPrice: item.appliedPrice,
        lineTotal: -item.quantity * item.appliedPrice,
        saleType: item.saleType,
        staffId: ret.staffId,
      });
    });

    ret.exchangedItems.forEach(item => {
        reportEntries.push({
            transactionId: ret.id,
            transactionType: 'Return',
            transactionDate: format(ret.returnDate, "yyyy-MM-dd"),
            transactionTime: format(ret.returnDate, "HH:mm:ss"),
            relatedId: ret.originalSaleId,
            customerName: ret.customerName || 'N/A',
            productName: item.name,
            productCategory: item.category,
            quantity: item.quantity,
            appliedPrice: item.appliedPrice,
            lineTotal: item.quantity * item.appliedPrice,
            saleType: item.saleType,
            staffId: ret.staffId,
        });
    });
  });

  // Process Samples
  stockTransactions.forEach(tx => {
    if (tx.type === 'ISSUE_SAMPLE') {
      const customerNameMatch = tx.notes?.match(/Sample for (.*?)\./);
      const customerName = customerNameMatch ? customerNameMatch[1] : 'Unknown';
      const product = allProducts.find(p => p.id === tx.productId);

      reportEntries.push({
        transactionId: tx.id,
        transactionType: 'Sample',
        transactionDate: format(tx.transactionDate, "yyyy-MM-dd"),
        transactionTime: format(tx.transactionDate, "HH:mm:ss"),
        customerName: customerName,
        productName: tx.productName,
        productCategory: product?.category || 'Other',
        quantity: -tx.quantity,
        appliedPrice: 0,
        lineTotal: 0,
        paymentSummary: 'N/A',
        staffId: tx.userId || 'N/A',
      });
    }
  });


  return reportEntries.sort((a,b) => new Date(b.transactionDate + 'T' + b.transactionTime).getTime() - new Date(a.transactionDate + 'T' + a.transactionTime).getTime());
}


export default function FullReportPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30), 
    to: new Date(),
  });

  const { sales, isLoading: isLoadingSales, error: salesError, loadMoreSales, hasMore: hasMoreSales } = useSalesData(true, dateRange);
  const { returns, isLoading: isLoadingReturns, error: returnsError, loadMoreReturns, hasMore: hasMoreReturns } = useReturns(true, dateRange);
  const { transactions: stockTransactions, isLoading: isLoadingStock, error: stockError, loadMoreTransactions, hasMore: hasMoreStock } = useStockTransactions(true, dateRange);
  const { products: allProducts, isLoading: isLoadingProducts, error: productsError } = useProducts();

  const [combinedData, setCombinedData] = useState<FullReportEntry[]>([]);
  const [filteredData, setFilteredData] = useState<FullReportEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [saleTypeFilter, setSaleTypeFilter] = useState<string>("all");
  const [paymentSummaryFilter, setPaymentSummaryFilter] = useState<string>("all");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>("all");

  // Transform data whenever source data changes
  useEffect(() => {
    if (!isLoadingSales && !isLoadingReturns && !isLoadingStock && !isLoadingProducts && sales && returns && stockTransactions && allProducts) {
      setCombinedData(transformTransactionsToFullReportEntries(sales, returns, stockTransactions, allProducts));
    }
  }, [sales, returns, stockTransactions, allProducts, isLoadingSales, isLoadingReturns, isLoadingStock, isLoadingProducts]);


  // Apply filters to the combined data
  useEffect(() => {
    let result = [...combinedData];
    
    // Date filter is already applied at the hook level, but we can do a client-side one just in case
    if (dateRange?.from && dateRange.to) {
      result = result.filter(entry => {
        const entryDate = parseISO(entry.transactionDate); 
        return entryDate >= dateRange.from! && entryDate <= dateRange.to!;
      });
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(entry => 
        (entry.transactionId && entry.transactionId.toLowerCase().includes(term)) ||
        (entry.customerName && entry.customerName.toLowerCase().includes(term)) ||
        (entry.productName && entry.productName.toLowerCase().includes(term)) ||
        (entry.staffId && entry.staffId.toLowerCase().includes(term)) ||
        (entry.paymentSummary && entry.paymentSummary.toLowerCase().includes(term)) 
      );
    }
    
    if (transactionTypeFilter !== "all") {
        result = result.filter(entry => entry.transactionType === transactionTypeFilter);
    }

    if (saleTypeFilter !== "all") {
      result = result.filter(entry => entry.saleType === saleTypeFilter);
    }
    
    if (paymentSummaryFilter !== "all") {
      result = result.filter(entry => entry.paymentSummary && entry.paymentSummary.toLowerCase().includes(paymentSummaryFilter.toLowerCase()));
    }
    
    setFilteredData(result);
  }, [combinedData, searchTerm, dateRange, saleTypeFilter, paymentSummaryFilter, transactionTypeFilter]);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role !== "admin") {
       router.replace(currentUser.role === "cashier" ? "/app/sales" : "/app/dashboard");
    }
  }, [currentUser, router]);

  const pageIsLoading = isLoadingSales || isLoadingReturns || isLoadingStock || isLoadingProducts;
  
  if (!currentUser) {
     return <GlobalPreloaderScreen message="Loading report..." />;
  }

  if (currentUser.role !== "admin") {
    return (
      <AccessDenied message="Full reports are not available for your role. Redirecting..." />
    );
  }

  const handleExportExcel = () => {
    const dataToExport = filteredData.map(entry => ({
        'Transaction ID': entry.transactionId,
        'Type': entry.transactionType,
        'Date': entry.transactionDate,
        'Time': entry.transactionTime,
        'Customer': entry.customerName,
        'Product': entry.productName,
        'Category': entry.productCategory,
        'Quantity': entry.quantity,
        'Unit Price': entry.appliedPrice,
        'Line Total': entry.lineTotal,
        'Sale Type': entry.saleType || 'N/A',
        'Payment Summary': entry.paymentSummary || 'N/A',
        'Staff': entry.staffId,
        'Original Sale ID': entry.transactionType === 'Return' ? entry.relatedId : 'N/A'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Full Report");
    XLSX.writeFile(workbook, `Full_Report_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('landscape'); 
      doc.text(`Full Transaction Report - ${format(new Date(), 'PP')}`, 14, 16);
      
      autoTable(doc, {
        startY: 20,
        head: [['ID', 'Type', 'Date', 'Time', 'Customer', 'Product', 'Qty', 'Unit Price', 'Total', 'Sale Type', 'Staff']],
        body: filteredData.map(entry => [
          entry.transactionId,
          entry.transactionType,
          entry.transactionDate,
          entry.transactionTime,
          entry.customerName || "Walk-in",
          entry.productName,
          entry.quantity,
          entry.appliedPrice.toFixed(2),
          entry.lineTotal.toFixed(2),
          entry.saleType || 'N/A',
          entry.staffId,
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
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        columnStyles: {
          0: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 35 },
        },
        margin: { top: 20 },
        pageBreak: 'auto',
        tableWidth: 'auto'
      });
      
      doc.save(`Full_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    }
  };

  const handlePrint = () => {
    window.print();
  };
  
  const paymentSummaryOptions = useMemo(() => {
    if (pageIsLoading || !combinedData) return [{ value: "all", label: "All Payment Summaries" }];
    const summaries = new Set(combinedData.filter(e => e.transactionType === 'Sale' && e.paymentSummary).map(entry => entry.paymentSummary));
    return [{ value: "all", label: "All Payment Summaries" }, ...Array.from(summaries).map(s => ({ value: s!, label: s! }))];
  }, [combinedData, pageIsLoading]);


  const reportActions = (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button 
        onClick={handleExportExcel} 
        variant="outline" 
        size="sm"
        disabled={pageIsLoading || filteredData.length === 0}
      >
        <DownloadCloud className="mr-2 h-4 w-4" /> Export Excel
      </Button>
      <Button 
        onClick={handleExportPDF} 
        variant="outline" 
        size="sm"
        disabled={pageIsLoading || filteredData.length === 0}
      >
        <FileText className="mr-2 h-4 w-4" /> Export PDF
      </Button>
      <Button 
        onClick={handlePrint} 
        variant="outline" 
        size="sm"
        disabled={filteredData.length === 0}
      >
        <Printer className="mr-2 h-4 w-4" /> Print
      </Button>
    </div>
  );
  
  if (pageIsLoading && combinedData.length === 0) { 
    return <GlobalPreloaderScreen message="Loading full report data..." />;
  }
  
  const hasMoreData = hasMoreSales || hasMoreReturns || hasMoreStock;

  return (
    <div className="space-y-6 print:space-y-0">
      <PageHeader 
        title="Full Transaction Report" 
        description="Comprehensive overview of all sales, returns, and exchanges."
        icon={ClipboardList}
        action={reportActions}
      />
      
      <Card className="shadow-lg printable-report-container">
        <CardHeader className="print:hidden space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="font-headline">Detailed Transaction Log</CardTitle>
              <CardDescription>
                {pageIsLoading ? 'Loading...' : `${filteredData.length} transactions found`}
                {salesError && <span className="text-destructive ml-2">(Sales Error)</span>}
                {returnsError && <span className="text-destructive ml-2">(Returns Error)</span>}
                {stockError && <span className="text-destructive ml-2">(Stock Error)</span>}
                {productsError && <span className="text-destructive ml-2">(Products Error)</span>}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              placeholder="Search transactions..."
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
              <SelectTrigger><SelectValue placeholder="Transaction Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transaction Types</SelectItem>
                <SelectItem value="Sale">Sale</SelectItem>
                <SelectItem value="Return">Return / Exchange</SelectItem>
                <SelectItem value="Sample">Sample Issue</SelectItem>
              </SelectContent>
            </Select>

             <Select value={saleTypeFilter} onValueChange={setSaleTypeFilter}>
              <SelectTrigger><SelectValue placeholder="Sale Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sale Types</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" className="flex items-center gap-1 text-sm text-muted-foreground" onClick={() => {
                setSearchTerm('');
                setSaleTypeFilter('all');
                setTransactionTypeFilter('all');
            }}>
                <FilterX className="h-4 w-4"/>
                Clear Filters
            </Button>

          </div>
        </CardHeader>
        
        <CardContent className="print:p-0">
          <FullReportTable data={filteredData} isLoading={pageIsLoading && combinedData.length === 0} />
          {hasMoreData && (
             <div className="text-center py-4">
                <Button onClick={() => {
                    if (hasMoreSales) loadMoreSales();
                    if (hasMoreReturns) loadMoreReturns();
                    if (hasMoreStock) loadMoreTransactions();
                }} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Load More
                </Button>
             </div>
          )}
        </CardContent>
      </Card>
      
      <style jsx global>{`
        @media print {
          body { background: white; }
          .printable-report-container { box-shadow: none; border: none; }
          .table th, .table td { padding: 4px 8px; font-size: 10px; }
          .badge { padding: 2px 6px; font-size: 10px; }
        }
      `}</style>
    </div>
  );
}
