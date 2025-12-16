"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, FilterX, Search, ReceiptText, Printer, Eye, ChevronDown, ChevronUp, Loader2, AlertTriangle, Info, WalletCards, XCircle } from "lucide-react";
import { format, isValid, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import type { Sale } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BillDialog } from "@/components/sales/BillDialog";
import { PaymentDialog } from "@/components/invoicing/PaymentDialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";


interface InvoiceDataTableProps {
  sales: Sale[];
  isLoading: boolean;
  error?: string | null;
  refetchSales: () => void;
}

export function InvoiceDataTable({ sales: initialSales, isLoading, error, refetchSales }: InvoiceDataTableProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [selectedInvoiceForReprint, setSelectedInvoiceForReprint] = useState<Sale | null>(null);
  const [isBillDialogOpen, setIsBillDialogOpen] = useState(false);
  const [localSales, setLocalSales] = useState<Sale[]>(initialSales);

  const [saleForPayment, setSaleForPayment] = useState<Sale | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  const [isCancelAlertOpen, setIsCancelAlertOpen] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';


  useEffect(() => {
    setLocalSales(initialSales);
  }, [initialSales]);

  const sortedSales = useMemo(() => {
    return [...localSales].sort((a, b) => {
      const dateA = a.saleDate instanceof Date ? a.saleDate : new Date(a.saleDate || 0);
      const dateB = b.saleDate instanceof Date ? b.saleDate : new Date(b.saleDate || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [localSales]);

  const filteredSales = useMemo(() => {
    return sortedSales.filter(sale => {
      const saleDateObj = typeof sale.saleDate === 'string' ? parseISO(sale.saleDate) : sale.saleDate;
      
      const lowerSearchTerm = searchTerm.toLowerCase();
      const matchesSearchTerm = 
        (sale.id && sale.id.toLowerCase().includes(lowerSearchTerm)) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(lowerSearchTerm)) ||
        (sale.customerShopName && sale.customerShopName.toLowerCase().includes(lowerSearchTerm)) ||
        (sale.paymentSummary && sale.paymentSummary.toLowerCase().includes(lowerSearchTerm)) ||
        (sale.chequeDetails?.number && sale.chequeDetails.number.toLowerCase().includes(lowerSearchTerm)) ||
        (sale.bankTransferDetails?.referenceNumber && sale.bankTransferDetails.referenceNumber.toLowerCase().includes(lowerSearchTerm));


      let matchesDateRange = true;
      if (isValid(saleDateObj)) {
          if (startDate && endDate) {
            matchesDateRange = isWithinInterval(saleDateObj, { start: startOfDay(startDate), end: endOfDay(endDate) });
          } else if (startDate) {
            matchesDateRange = saleDateObj >= startOfDay(startDate);
          } else if (endDate) {
            matchesDateRange = saleDateObj <= endOfDay(endDate);
          }
      } else {
        if (startDate || endDate) matchesDateRange = false;
      }
      
      return matchesSearchTerm && matchesDateRange;
    });
  }, [sortedSales, searchTerm, startDate, endDate]);

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleReprintInvoice = (sale: Sale) => {
    setSelectedInvoiceForReprint(sale);
    setIsBillDialogOpen(true);
  };

  const handleAddPayment = (sale: Sale) => {
    setSaleForPayment(sale);
    setIsPaymentDialogOpen(true);
  };

  const handleOpenCancelDialog = (sale: Sale) => {
    setSaleToCancel(sale);
    setIsCancelAlertOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!saleToCancel || !isAdmin || !cancellationReason.trim()) {
      toast({ variant: "destructive", title: "Reason Required", description: "Please provide a reason for cancelling the invoice." });
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch(`/api/sales/${saleToCancel.id}`, { 
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cancellationReason: cancellationReason.trim() }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "Failed to cancel invoice.");
      }
      toast({ title: "Success", description: "Invoice cancelled and stock restored." });
      refetchSales(); // Refetch all sales data to get the updated state
    } catch (error: any) {
      toast({ variant: "destructive", title: "Cancellation Failed", description: error.message });
    } finally {
      setIsCancelling(false);
      setIsCancelAlertOpen(false);
      setSaleToCancel(null);
      setCancellationReason("");
    }
  };

  const toggleExpandInvoice = (invoiceId: string) => {
    setExpandedInvoice(expandedInvoice === invoiceId ? null : invoiceId);
  };

  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'Rs. 0.00';
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR', 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount).replace('LKR', 'Rs.');
  };

  useEffect(() => {
    setExpandedInvoice(null);
  }, [localSales]);

  const getPaymentStatusBadge = (sale: Sale) => {
    if (sale.status === 'cancelled') {
        return <Badge variant="destructive" className="bg-gray-500 hover:bg-gray-600 text-white text-xs">Cancelled</Badge>;
    }
    const isComplete = sale.outstandingBalance !== undefined ? sale.outstandingBalance <= 0 : sale.totalAmountPaid >= sale.totalAmount;

    if (isComplete) {
      return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white text-xs">Completed</Badge>;
    } else {
      return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-black text-xs">Pending</Badge>;
    }
  };


  return (
    <TooltipProvider>
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Invoice History</CardTitle>
          <CardDescription>Browse through all recorded sales transactions</CardDescription>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ID, Customer, Shop, Payment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 w-full"
              />
            </div>
            {!isMobile && (
              <div className="flex gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-10 justify-start text-left font-normal w-full sm:w-[180px]", !startDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Start Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-10 justify-start text-left font-normal w-full sm:w-[180px]", !endDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>End Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus disabled={(date) => startDate ? date < startDate : false}/>
                  </PopoverContent>
                </Popover>
                <Button variant="ghost" onClick={clearFilters} size="icon" className="h-10 w-10" title="Clear Filters">
                  <FilterX className="h-5 w-5"/>
                </Button>
              </div>
            )}
          </div>
          {isMobile && (
            <div className="mt-3 flex gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal flex-1", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PP") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal flex-1", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PP") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus disabled={(date) => startDate ? date < startDate : false}/>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" onClick={clearFilters} size="sm" className="h-9 px-3" title="Clear Filters">
                <FilterX className="h-4 w-4 mr-1"/>
                Clear
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg text-muted-foreground">Loading invoices...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-destructive">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">Error loading invoices</p>
                <p className="text-sm">{error}</p>
            </div>
          ) : (
            <ScrollArea className={isMobile ? "h-[calc(100vh-24rem)]" : "h-[calc(100vh-24rem)]"}>
              {filteredSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <ReceiptText className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No invoices found</p>
                    {(searchTerm || startDate || endDate) && <p className="text-sm">Try adjusting your search or date filters</p>}
                </div>
              ) : isMobile ? (
                <div className="space-y-2">
                  {filteredSales.map((sale) => (
                    <Card key={sale.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{sale.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(typeof sale.saleDate === 'string' ? parseISO(sale.saleDate) : sale.saleDate, "PP")}
                          </p>
                          <p className="text-xs mt-1">{sale.customerShopName || sale.customerName || "Walk-in"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">{formatCurrency(sale.totalAmount)}</p>
                          {getPaymentStatusBadge(sale)}
                        </div>
                      </div>
                       <p className="text-xs text-muted-foreground mt-1">Summary: {sale.paymentSummary}</p>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-1.5 justify-between text-primary hover:text-primary text-xs h-8"
                        onClick={() => toggleExpandInvoice(sale.id)}
                      >
                        {expandedInvoice === sale.id ? "Hide details" : "Show details"}
                        {expandedInvoice === sale.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </Button>
                      
                      {expandedInvoice === sale.id && (
                        <div className="mt-2 space-y-1 text-xs border-t pt-2">
                          <div className="flex justify-between font-semibold"><span className="text-muted-foreground">Total Paid:</span><span>{formatCurrency(sale.totalAmountPaid)}</span></div>
                          {sale.outstandingBalance > 0 && <div className="flex justify-between font-semibold text-destructive"><span className="text-muted-foreground">Outstanding:</span><span>{formatCurrency(sale.outstandingBalance)}</span></div>}
                          {sale.status === 'cancelled' && sale.cancellationReason && <div className="text-destructive"><span className="text-muted-foreground">Reason:</span><span> {sale.cancellationReason}</span></div>}

                          <div className="pt-2">
                              <p className="font-bold text-xs mb-1">Payment History:</p>
                              <div className="space-y-1.5 pl-2 border-l ml-1">
                                  {(sale.paidAmountCash || sale.paidAmountCheque || sale.paidAmountBankTransfer) && (
                                      <div>
                                          <p className="font-semibold text-muted-foreground">On {format(sale.saleDate, 'PP')}</p>
                                          <div className="pl-2">
                                              {sale.paidAmountCash ? <p>Cash: {formatCurrency(sale.paidAmountCash)}</p> : null}
                                              {sale.paidAmountCheque ? <p>Cheque: {formatCurrency(sale.paidAmountCheque)}</p> : null}
                                              {sale.paidAmountBankTransfer ? <p>Bank Transfer: {formatCurrency(sale.paidAmountBankTransfer)}</p> : null}
                                          </div>
                                      </div>
                                  )}
                                  {sale.additionalPayments?.map((payment, index) => (
                                      <div key={`mobile-add-${index}`}>
                                          <p className="font-semibold text-muted-foreground">On {format(payment.date, 'PP')}</p>
                                          <div className="pl-2">
                                              <p>{payment.method}: {formatCurrency(payment.amount)}</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          
                          <div className="flex gap-2 pt-2 mt-2 border-t">
                              {sale.status !== 'cancelled' && (sale.outstandingBalance ?? 0) > 0 && (
                                  <Button variant="default" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleAddPayment(sale)}>
                                      <WalletCards className="h-3.5 w-3.5 mr-1.5" />
                                      Add Payment
                                  </Button>
                              )}
                              {sale.status !== 'cancelled' && isAdmin && (
                                  <Button variant="destructive" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleOpenCancelDialog(sale)}>
                                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                      Cancel
                                  </Button>
                              )}
                              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => handleReprintInvoice(sale)}>
                                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                                  Print
                              </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead className="w-[130px]">Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Total Due</TableHead>
                      <TableHead className="text-right">Total Paid</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="w-[150px]">Payment Method</TableHead>
                       <TableHead className="text-center w-[100px]">Status</TableHead>
                      <TableHead className="text-center w-[130px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id} className={cn(sale.status === 'cancelled' && 'bg-muted/40 text-muted-foreground hover:bg-muted/50')}>
                        <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                        <TableCell className="text-xs">{format(typeof sale.saleDate === 'string' ? parseISO(sale.saleDate) : sale.saleDate, "PP, p")}</TableCell>
                        <TableCell className="text-sm">{sale.customerShopName || sale.customerName || "Walk-in"}</TableCell>
                        <TableCell className="text-right font-medium text-sm">{formatCurrency(sale.totalAmount)}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(sale.totalAmountPaid)}</TableCell>
                        <TableCell className={cn("text-right text-sm", (sale.outstandingBalance ?? 0) > 0 && sale.status !== 'cancelled' && "text-destructive font-semibold")}>{formatCurrency(sale.outstandingBalance)}</TableCell>
                        <TableCell className="text-xs">
                           <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate block max-w-[140px] cursor-default">{sale.paymentSummary}</span>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs max-w-xs bg-card p-2 border shadow-lg rounded-md">
                                <div className="font-bold text-sm mb-1">Payment History</div>
                                <div className="space-y-2">
                                  {/* Initial Payment */}
                                  {(sale.paidAmountCash || sale.paidAmountCheque || sale.paidAmountBankTransfer) && (
                                    <div>
                                      <p className="font-semibold text-xs text-muted-foreground">On {format(sale.saleDate, 'PP')}</p>
                                      <div className="pl-2 border-l ml-1">
                                        {sale.paidAmountCash ? <p>Cash: {formatCurrency(sale.paidAmountCash)}</p> : null}
                                        {sale.paidAmountCheque ? <p>Cheque: {formatCurrency(sale.paidAmountCheque)} (#{sale.chequeDetails?.number || 'N/A'})</p> : null}
                                        {sale.paidAmountBankTransfer ? <p>Bank Transfer: {formatCurrency(sale.paidAmountBankTransfer)}</p> : null}
                                      </div>
                                    </div>
                                  )}

                                  {/* Additional Payments */}
                                  {sale.additionalPayments?.map((payment, index) => (
                                    <div key={index}>
                                      <p className="font-semibold text-xs text-muted-foreground">On {format(payment.date, 'PP')}</p>
                                      <div className="pl-2 border-l ml-1">
                                        <p>{payment.method}: {formatCurrency(payment.amount)}</p>
                                        {payment.method === 'Cheque' && payment.details && 'number' in payment.details && (
                                          <p className="text-muted-foreground text-[11px]">#{payment.details.number}</p>
                                        )}
                                        {payment.method === 'BankTransfer' && payment.details && 'referenceNumber' in payment.details && (
                                          <p className="text-muted-foreground text-[11px]">Ref: {payment.details.referenceNumber}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}

                                  {!(sale.paidAmountCash || sale.paidAmountCheque || sale.paidAmountBankTransfer) && (!sale.additionalPayments || sale.additionalPayments.length === 0) && (
                                    <p className="text-muted-foreground">No payments recorded for this invoice.</p>
                                  )}
                                  
                                  {sale.status === 'cancelled' && sale.cancellationReason && (
                                    <div className="border-t pt-2 mt-2 text-destructive">
                                      <p className="font-semibold">Cancellation Reason:</p>
                                      <p>{sale.cancellationReason}</p>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">{getPaymentStatusBadge(sale)}</TableCell>
                        <TableCell className="text-center">
                          {sale.status !== 'cancelled' && (sale.outstandingBalance ?? 0) > 0 && (
                            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleAddPayment(sale)}>
                                <WalletCards className="h-4 w-4 mr-1"/>
                                Pay
                            </Button>
                          )}
                           {sale.status !== 'cancelled' && isAdmin && (
                            <Button variant="destructive" size="sm" className="h-8 text-xs ml-1" onClick={() => handleOpenCancelDialog(sale)}>
                                <XCircle className="h-4 w-4 mr-1"/>
                                Cancel
                            </Button>
                           )}
                          <Button variant="ghost" size="icon" onClick={() => handleReprintInvoice(sale)} title="View / Print Invoice" className="h-8 w-8 ml-1">
                            <Printer className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
       <AlertDialog open={isCancelAlertOpen} onOpenChange={setIsCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invoice: {saleToCancel?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              Stock levels will be restored. This action cannot be undone. Please provide a reason for the cancellation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="cancellationReason" className="mb-2 block">Reason for Cancellation *</Label>
            <Textarea
              id="cancellationReason"
              placeholder="e.g., Customer returned items, wrong order..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep Invoice</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-destructive hover:bg-destructive/90" disabled={isCancelling || !cancellationReason.trim()}>
              {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              Yes, Cancel Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedInvoiceForReprint && isBillDialogOpen && (
        <BillDialog
          isOpen={isBillDialogOpen}
          onOpenChange={(open) => {
            if (!open) setSelectedInvoiceForReprint(null);
            setIsBillDialogOpen(open);
          }}
          existingSaleData={selectedInvoiceForReprint}
          onConfirmSale={() => { /* No confirm action needed for reprint */ return Promise.resolve(null); }}
        />
      )}

      {saleForPayment && (
        <PaymentDialog
            isOpen={isPaymentDialogOpen}
            onOpenChange={setIsPaymentDialogOpen}
            sale={saleForPayment}
            onSuccess={() => {
                refetchSales();
                setIsPaymentDialogOpen(false);
                setSaleForPayment(null);
            }}
        />
      )}
    </>
    </TooltipProvider>
  );
}
