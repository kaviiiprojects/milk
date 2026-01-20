
"use client";

import React, { useState, useEffect } from "react";
import { FileText, DownloadCloud, Banknote, ReceiptText, Wallet, Beaker, Building, CreditCard, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import type { Sale, ReturnTransaction, Expense } from "@/lib/types";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useSalesData } from "@/hooks/useSalesData"; 
import { useReturns } from "@/hooks/useReturns";
import { useExpenses } from "@/hooks/useExpenses";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || isNaN(amount)) return "Rs. 0.00";
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  return new Intl.NumberFormat('en-LK', { 
    style: 'currency', 
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }).format(rounded).replace("LKR", "Rs.");
};

interface UserReportSummary {
  reportDate: Date;
  totalTransactions: number;
  grossSalesValue: number;
  totalCashIn: number;
  totalChequeIn: number;
  totalBankTransferIn: number;
  totalExpenses: number;
  totalRefundsPaidOut: number;
  netCashInHand: number;
}

export default function DailyCountPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [reportSummary, setReportSummary] = useState<UserReportSummary | null>(null);

  // Fetch all data - filtering will be done client-side
  const { sales: allSales, isLoading: isLoadingSales, error: salesError } = useSalesData(true);
  const { returns: allReturns, isLoading: isLoadingReturns, error: returnsError } = useReturns(true);
  const { expenses: allExpenses, isLoading: isLoadingExpenses, error: expensesError } = useExpenses(true);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (selectedDate && currentUser && !isLoadingSales && !isLoadingReturns && !isLoadingExpenses) {
      
      // Helper to check if a staffId matches the current user (checks both id and username)
      const isCurrentUserStaff = (staffId: string | undefined) => {
        if (!staffId) return false;
        return staffId === currentUser.username || staffId === currentUser.id;
      };

      // Filter sales for the SELECTED DATE ONLY and by current user
      const salesToday = allSales.filter(sale => 
        isSameDay(new Date(sale.saleDate), selectedDate) && 
        isCurrentUserStaff(sale.staffId) &&
        sale.status !== 'cancelled'
      );

      // Filter returns for the SELECTED DATE ONLY and by current user
      const returnsToday = allReturns.filter(ret => 
        isSameDay(new Date(ret.returnDate), selectedDate) &&
        isCurrentUserStaff(ret.staffId)
      );

      // Filter expenses for the SELECTED DATE ONLY and by current user
      const expensesToday = allExpenses.filter(exp => 
        isSameDay(new Date(exp.expenseDate), selectedDate) &&
        isCurrentUserStaff(exp.staffId)
      );

      let cashFromSales = 0;
      let chequeFromSales = 0;
      let bankFromSales = 0;

      salesToday.forEach(sale => {
          if(sale.paidAmountCash) cashFromSales += sale.paidAmountCash;
          if(sale.paidAmountCheque) chequeFromSales += sale.paidAmountCheque;
          if(sale.paidAmountBankTransfer) bankFromSales += sale.paidAmountBankTransfer;
      });

      let cashFromCreditPayments = 0;
      let chequeFromCreditPayments = 0;
      let bankFromCreditPayments = 0;

      // Check ALL sales for additional payments made BY THE CURRENT USER on the SELECTED DATE
      allSales.forEach(sale => {
          sale.additionalPayments?.forEach(p => {
              if (isCurrentUserStaff(p.staffId) && isSameDay(new Date(p.date), selectedDate)) {
                  if (p.method === 'Cash') cashFromCreditPayments += p.amount;
                  if (p.method === 'Cheque') chequeFromCreditPayments += p.amount;
                  if (p.method === 'BankTransfer') bankFromCreditPayments += p.amount;
              }
          });
      });
      
      const totalCashIn = cashFromSales + cashFromCreditPayments;
      const totalChequeIn = chequeFromSales + chequeFromCreditPayments;
      const totalBankTransferIn = bankFromSales + bankFromCreditPayments;
      
      const totalRefundsPaidOut = returnsToday.reduce((sum, r) => sum + (r.cashPaidOut || 0), 0);
      const totalExpensesAmount = expensesToday.reduce((sum, e) => sum + e.amount, 0);

      setReportSummary({
        reportDate: selectedDate,
        totalTransactions: salesToday.length,
        grossSalesValue: salesToday.reduce((sum, s) => sum + s.totalAmount, 0),
        totalCashIn,
        totalChequeIn,
        totalBankTransferIn,
        totalExpenses: totalExpensesAmount,
        totalRefundsPaidOut,
        netCashInHand: totalCashIn - totalRefundsPaidOut - totalExpensesAmount,
      });

    } else if (!selectedDate) {
      setReportSummary(null);
    }
  }, [selectedDate, currentUser, allSales, allReturns, allExpenses, isLoadingSales, isLoadingReturns, isLoadingExpenses]);

  const reportActions = (
    <div className="flex flex-col sm:flex-row gap-2 items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[220px] justify-start text-left font-normal h-10",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarClock className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            initialFocus
            disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  if (!currentUser) {
    return <GlobalPreloaderScreen message="Loading..." />;
  }
  
  const pageIsLoading = (isLoadingSales || isLoadingReturns || isLoadingExpenses) && !reportSummary;

  if (pageIsLoading) {
    return <GlobalPreloaderScreen message="Calculating daily count..." />
  }
  
  const anyError = salesError || returnsError || expensesError;

  return (
    <>
      <PageHeader 
        title="My Daily Count" 
        description={`Summary of your transactions for ${selectedDate ? format(selectedDate, "PPP") : "the selected date"}.`}
        icon={FileText}
        action={reportActions}
      />

      {anyError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>{anyError}</AlertDescription>
        </Alert>
      )}

      {reportSummary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales Value</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportSummary.grossSalesValue)}</div>
                <p className="text-xs text-muted-foreground">Across {reportSummary.totalTransactions} transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cash Collected</CardTitle>
                <Banknote className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportSummary.totalCashIn)}</div>
                 <p className="text-xs text-muted-foreground">From sales & credit payments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Other Collections</CardTitle>
                 <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(reportSummary.totalChequeIn + reportSummary.totalBankTransferIn)}</div>
                <p className="text-xs text-muted-foreground">Cheques & Bank Transfers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Cash In Hand</CardTitle>
                 <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(reportSummary.netCashInHand)}</div>
                 <p className="text-xs text-muted-foreground">After refunds & expenses</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">No Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground flex items-center">
              <ReceiptText className="mr-2 h-5 w-5" />
              {selectedDate ? `You have no transactions recorded for ${format(selectedDate, "PPP")}.` : "Please select a date to view your daily count."}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
