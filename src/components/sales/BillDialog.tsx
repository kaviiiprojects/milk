
"use client";

import type { CartItem, Customer, Sale, ChequeInfo, BankTransferInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AppLogo } from "@/components/AppLogo";
import { Calendar as CalendarIcon, Landmark, Printer, Wallet, AlertTriangle, Gift, Newspaper, Banknote, FileText, CreditCard, Building } from "lucide-react";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isValid, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (amount: number | undefined): string => {
  if (typeof amount !== 'number' || isNaN(amount)) return 'Rs. 0.00';
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount).replace('LKR', 'Rs.');
};

interface BillDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cartItems?: CartItem[];
  customer?: Customer | null;
  currentSubtotal?: number;
  currentDiscountAmount?: number;
  currentTotalAmount?: number; 
  customerCreditBalance?: number;
  onConfirmSale?: (saleData: Omit<Sale, 'id' | 'saleDate' | 'staffId' | 'items'>) => Promise<Sale | null>;
  offerApplied?: boolean; 
  existingSaleData?: Sale;
}

export function BillDialog({ 
  isOpen, 
  onOpenChange, 
  cartItems: newCartItems,
  customer: newCustomer,
  currentSubtotal: newSubtotal,
  currentDiscountAmount: newDiscountAmount,
  currentTotalAmount: newTotalAmountDue, 
  customerCreditBalance,
  onConfirmSale,
  offerApplied: newOfferApplied, 
  existingSaleData
}: BillDialogProps) {
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalSaleData, setFinalSaleData] = useState<Sale | null>(null);

  const [cashTendered, setCashTendered] = useState<string>("");
  const [chequeAmountPaid, setChequeAmountPaid] = useState<string>("");
  const [chequeNumber, setChequeNumber] = useState<string>("");
  const [chequeBank, setChequeBank] = useState<string>("");
  const [chequeDate, setChequeDate] = useState<Date | undefined>(new Date());
  
  const [bankTransferAmountPaid, setBankTransferAmountPaid] = useState<string>("");
  const [bankTransferBankName, setBankTransferBankName] = useState<string>("");
  const [bankTransferReference, setBankTransferReference] = useState<string>("");
  const [creditToApply, setCreditToApply] = useState("0");
  const { toast } = useToast();
  
  useEffect(() => {
    if (finalSaleData) {
        window.print();
    }
  }, [finalSaleData]);

  const saleForPrinting = finalSaleData || existingSaleData;
  const isReprintMode = !!existingSaleData;

  const transactionDate = saleForPrinting ? new Date(saleForPrinting.saleDate) : new Date();
  const displaySaleId = saleForPrinting ? saleForPrinting.id : null;
  const offerWasApplied = isReprintMode ? (saleForPrinting.offerApplied || false) : (newOfferApplied || false);

  const itemsToDisplay: CartItem[] = useMemo(() => {
    const saleData = finalSaleData || existingSaleData;
    if (saleData) {
      return saleData.items.map(item => ({
        ...item,
        name: item.name && item.name !== "N/A" ? item.name : `Product ID: ${item.id}`,
        category: item.category || "Other",
        price: typeof item.price === 'number' ? item.price : 0,
        appliedPrice: typeof item.appliedPrice === 'number' ? item.appliedPrice : 0,
      }));
    }
    return newCartItems || [];
  }, [finalSaleData, existingSaleData, newCartItems]);
  
  const customerForDisplay = useMemo(() => {
    const saleData = finalSaleData || existingSaleData;
    if (saleData) {
        return saleData.customerName ? { 
            id: saleData.customerId || '', 
            name: saleData.customerName, 
            phone: '', // Not needed for display
            shopName: saleData.customerShopName
          } as Partial<Customer> : null;
    }
    return newCustomer;
  }, [finalSaleData, existingSaleData, newCustomer]);

  const subtotalToDisplay = (saleForPrinting ? saleForPrinting.subTotal : newSubtotal) || 0;
  const discountAmountToDisplay = (saleForPrinting ? saleForPrinting.discountAmount : newDiscountAmount) || 0;
  const totalAmountDueForDisplay = (saleForPrinting ? saleForPrinting.totalAmount : newTotalAmountDue) || 0;
  
  const invoiceCloseDate = useMemo(() => {
    if (saleForPrinting && (saleForPrinting.outstandingBalance ?? 0) <= 0 && saleForPrinting.updatedAt) {
      return format(new Date(saleForPrinting.updatedAt), 'PP, p');
    }
    return null;
  }, [saleForPrinting]);

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setFinalSaleData(null); // Reset print data when dialog opens
      setCreditToApply("0");
      if (existingSaleData) {
        setCashTendered("");
        setChequeAmountPaid("");
        setChequeNumber("");
        setChequeBank("");
        setChequeDate(new Date());
        setBankTransferAmountPaid("");
        setBankTransferBankName("");
        setBankTransferReference("");
      } else {
        setCashTendered("");
        setChequeAmountPaid("");
        setChequeNumber("");
        setChequeBank("");
        setChequeDate(new Date());
        setBankTransferAmountPaid("");
        setBankTransferBankName("");
        setBankTransferReference("");
      }
    }
  }, [isOpen, existingSaleData]);

  const parsedCashTendered = parseFloat(cashTendered) || 0;
  const parsedChequeAmountPaid = parseFloat(chequeAmountPaid) || 0;
  const parsedBankTransferAmountPaid = parseFloat(bankTransferAmountPaid) || 0;
  const parsedCreditApplied = useMemo(() => {
    const value = parseFloat(creditToApply) || 0;
    const maxCredit = Math.min(customerCreditBalance || 0, totalAmountDueForDisplay);
    return Math.max(0, Math.min(value, maxCredit));
  }, [creditToApply, customerCreditBalance, totalAmountDueForDisplay]);

  const totalTenderedByMethods = parsedCashTendered + parsedChequeAmountPaid + parsedBankTransferAmountPaid;
  
  const changeGiven = useMemo(() => {
    if (parsedCashTendered > 0 && totalTenderedByMethods > (totalAmountDueForDisplay - parsedCreditApplied)) {
      const cashExcess = parsedCashTendered - ((totalAmountDueForDisplay - parsedCreditApplied) - (parsedChequeAmountPaid + parsedBankTransferAmountPaid));
      return Math.max(0, cashExcess);
    }
    return 0;
  }, [parsedCashTendered, parsedChequeAmountPaid, parsedBankTransferAmountPaid, totalTenderedByMethods, totalAmountDueForDisplay, parsedCreditApplied]);

  const totalPaymentApplied = totalTenderedByMethods + parsedCreditApplied - changeGiven;

  const outstandingBalance = useMemo(() => {
    return Math.max(0, totalAmountDueForDisplay - totalPaymentApplied);
  }, [totalAmountDueForDisplay, totalPaymentApplied]);

  const getPaymentSummary = useCallback(() => {
    const methodsUsed: string[] = [];
    if (parsedCreditApplied > 0) methodsUsed.push(`Credit (${formatCurrency(parsedCreditApplied)})`);
    if (parsedCashTendered > 0) methodsUsed.push(`Cash (${formatCurrency(parsedCashTendered - changeGiven)})`);
    if (parsedChequeAmountPaid > 0) methodsUsed.push(`Cheque (${formatCurrency(parsedChequeAmountPaid)})${chequeNumber.trim() ? ` - #${chequeNumber.trim()}` : ''}`);
    if (parsedBankTransferAmountPaid > 0) methodsUsed.push(`Bank Transfer (${formatCurrency(parsedBankTransferAmountPaid)})${bankTransferReference.trim() ? ` - Ref: ${bankTransferReference.trim()}` : ''}`);

    let summary = "";
    if (methodsUsed.length > 1) {
      summary = `Split (${methodsUsed.join(' + ')})`;
    } else if (methodsUsed.length === 1) {
      summary = methodsUsed[0];
    } else if (totalAmountDueForDisplay > 0 && totalPaymentApplied === 0) {
      summary = "Full Credit";
    } else if (totalAmountDueForDisplay === 0 && totalPaymentApplied === 0) {
      summary = "Paid (Zero Value)";
    } else {
      summary = "N/A";
    }
    
    if (outstandingBalance > 0 && totalPaymentApplied > 0) {
      summary = `Partial (${summary}) - Outstanding: ${formatCurrency(outstandingBalance)}`;
    } else if (outstandingBalance > 0 && totalPaymentApplied === 0) {
      summary = `Full Credit - Outstanding: ${formatCurrency(outstandingBalance)}`;
    }

    return summary;
  }, [parsedCashTendered, parsedChequeAmountPaid, parsedBankTransferAmountPaid, parsedCreditApplied, chequeNumber, bankTransferReference, changeGiven, outstandingBalance, totalAmountDueForDisplay, totalPaymentApplied]);

  const handlePrimaryAction = async () => {
    if (isReprintMode) {
      window.print();
      return;
    }

    if (onConfirmSale) {
      setIsProcessing(true);
      if (parsedChequeAmountPaid > 0 && !chequeNumber.trim()) {
        toast({
          variant: "destructive",
          title: "Cheque Number Required",
          description: "Please enter a cheque number if paying by cheque.",
        });
        setIsProcessing(false);
        return;
      }
      if (parsedBankTransferAmountPaid > 0 && !bankTransferBankName.trim() && !bankTransferReference.trim()) {
         toast({
          variant: "destructive",
          title: "Bank Details Required",
          description: "Bank Name or Reference Number is required for bank transfers.",
        });
        setIsProcessing(false);
        return;
      }
      if (outstandingBalance > 0 && !customerForDisplay) {
        toast({
          variant: "destructive",
          title: "Customer Required",
          description: "A customer must be selected for credit or partially paid sales."
        });
        setIsProcessing(false);
        return;
      }

      const saleData: Omit<Sale, 'id' | 'saleDate' | 'staffId' | 'items'> = {
        customerId: customerForDisplay?.id,
        customerName: customerForDisplay?.name,
        customerShopName: customerForDisplay?.shopName,
        subTotal: subtotalToDisplay,
        discountPercentage: 0,
        discountAmount: discountAmountToDisplay,
        totalAmount: totalAmountDueForDisplay, 
        offerApplied: offerWasApplied, 
        
        paidAmountCash: parsedCashTendered > 0 ? parsedCashTendered : undefined,
        paidAmountCheque: parsedChequeAmountPaid > 0 ? parsedChequeAmountPaid : undefined,
        chequeDetails: parsedChequeAmountPaid > 0 ? {
          number: chequeNumber.trim(),
          bank: chequeBank.trim() || undefined,
          date: chequeDate,
          amount: parsedChequeAmountPaid
        } : undefined,
        paidAmountBankTransfer: parsedBankTransferAmountPaid > 0 ? parsedBankTransferAmountPaid : undefined,
        bankTransferDetails: parsedBankTransferAmountPaid > 0 ? {
            bankName: bankTransferBankName.trim() || undefined,
            referenceNumber: bankTransferReference.trim() || undefined,
            amount: parsedBankTransferAmountPaid
        } : undefined,
        creditUsed: parsedCreditApplied > 0 ? parsedCreditApplied : undefined,
        
        totalAmountPaid: totalPaymentApplied,
        outstandingBalance: outstandingBalance,
        initialOutstandingBalance: outstandingBalance,
        changeGiven: changeGiven > 0 ? changeGiven : undefined,
        paymentSummary: getPaymentSummary(),
      };
      
      try {
        const newSale = await onConfirmSale(saleData);
        if (newSale) {
          setFinalSaleData(newSale);
        } else {
          setIsProcessing(false);
        }
      } catch (error) {
        console.error("Sale confirmation failed:", error);
        setIsProcessing(false);
      }
    }
  };
  
  const isPrimaryButtonDisabled = !isReprintMode && (
    itemsToDisplay.filter(item => !item.isOfferItem || (item.isOfferItem && item.quantity > 0)).length === 0 ||
    (outstandingBalance > 0 && !customerForDisplay) ||
    (parsedChequeAmountPaid > 0 && !chequeNumber.trim()) || 
    isProcessing
  );
  
  const receiptContent = (
    <div 
      id="bill-content" 
      className="p-4 bg-card text-card-foreground"
    >
      <div className="text-center mb-4">
        <div className="flex justify-center mb-1 logo-container">
            <AppLogo size="lg" className="app-logo-text"/>
        </div>
        <p className="text-xs">4/1 Bujjampala, Dankotuwa</p>
        <p className="text-xs">Hotline: 077-1066595, 077-6106616</p>
      </div>

      <Separator className="my-3 summary-separator"/>

      <div className="text-xs mb-3 space-y-0.5">
        <p>Date: {transactionDate.toLocaleDateString()} {transactionDate.toLocaleTimeString()}</p>
        {displaySaleId && <p>Transaction ID: {displaySaleId}</p>}
        {customerForDisplay && <p>Customer: {customerForDisplay.shopName || customerForDisplay.name}</p>}
        <p>Served by: {saleForPrinting?.staffName || saleForPrinting?.staffId || 'Staff Member'}</p>
        {invoiceCloseDate && <p className="font-semibold">Invoice Closed: {invoiceCloseDate}</p>}
      </div>

      <Separator className="my-3 summary-separator"/>
      
      <h3 className="font-semibold mb-2 text-sm">Order Summary:</h3>
      <div className="mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1 font-normal w-[45%]">Item</th>
              <th className="text-center py-1 font-normal w-[15%]">Qty</th>
              <th className="text-right py-1 font-normal w-[20%]">Price (Rs.)</th>
              <th className="text-right py-1 font-normal w-[20%]">Total (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {itemsToDisplay.map((item, index) => (
                <tr 
                  key={`${item.id}-${item.saleType}-${item.isOfferItem ? 'offer' : 'paid'}-${index}`} 
                  className="border-b border-dashed"
                >
                  <td className="py-1.5 break-words">
                    {item.name}
                    {item.isOfferItem && <Gift className="inline-block h-3 w-3 ml-1 text-green-600" />}
                  </td>
                  <td className="text-center py-1.5">{item.quantity}</td>
                  <td className="text-right py-1.5">
                    {item.isOfferItem ? "FREE" : item.appliedPrice.toFixed(2)}
                  </td>
                  <td className="text-right py-1.5 font-semibold">
                    {item.isOfferItem ? "0.00" : (item.appliedPrice * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-1 text-sm mb-4">
         <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(totalAmountDueForDisplay)}</span>
        </div>
        <Separator className="my-1 summary-separator"/>
        <div className="flex justify-between font-bold text-lg text-primary">
          <span>TOTAL AMOUNT DUE:</span>
          <span>{formatCurrency(totalAmountDueForDisplay)}</span>
        </div>
      </div>
      
      <Separator className="my-4 summary-separator"/>

      <div className="space-y-1 text-sm mb-4">
        <h4 className="font-semibold text-base mb-2 mt-2">Final Summary:</h4>
        
        {saleForPrinting ? (
            <div className="text-xs space-y-1">
                {(saleForPrinting.paidAmountCash ?? 0) > 0 && <div className="flex justify-between"><span>Cash Paid:</span><span>{formatCurrency(saleForPrinting.paidAmountCash!)}</span></div>}
                {(saleForPrinting.paidAmountCheque ?? 0) > 0 && <div className="flex justify-between"><span>Cheque:</span><span>{formatCurrency(saleForPrinting.paidAmountCheque!)} (#{saleForPrinting.chequeDetails?.number})</span></div>}
                {(saleForPrinting.paidAmountBankTransfer ?? 0) > 0 && <div className="flex justify-between"><span>Bank Transfer:</span><span>{formatCurrency(saleForPrinting.paidAmountBankTransfer!)}</span></div>}
                {(saleForPrinting.creditUsed ?? 0) > 0 && <div className="flex justify-between text-green-600"><span>Credit Used:</span><span>- {formatCurrency(saleForPrinting.creditUsed!)}</span></div>}
                {(saleForPrinting.changeGiven ?? 0) > 0 && <div className="flex justify-between text-green-600"><span>Change Given:</span><span>{formatCurrency(saleForPrinting.changeGiven!)}</span></div>}
                
                {saleForPrinting.additionalPayments?.map((p, i) => (
                    <div key={i} className="border-t mt-1 pt-1">
                        <p className="font-medium text-muted-foreground">{format(p.date, "PP, p")}</p>
                        <div className="flex justify-between"><span>{p.method} Payment:</span><span>{formatCurrency(p.amount)}</span></div>
                    </div>
                ))}
            </div>
        ) : (
             <div className="text-xs space-y-1">
                {parsedCreditApplied > 0 && <div className="flex justify-between text-green-600"><span>Credit Applied:</span><span>- {formatCurrency(parsedCreditApplied)}</span></div>}
                {parsedCashTendered > 0 && <div className="flex justify-between"><span>Cash Tendered:</span><span>{formatCurrency(parsedCashTendered)}</span></div>}
                {parsedChequeAmountPaid > 0 && <div className="flex justify-between"><span>Cheque Paid:</span><span>{formatCurrency(parsedChequeAmountPaid)}</span></div>}
                {parsedBankTransferAmountPaid > 0 && <div className="flex justify-between"><span>Bank Transfer Paid:</span><span>{formatCurrency(parsedBankTransferAmountPaid)}</span></div>}
                {changeGiven > 0 && <div className="flex justify-between text-green-600"><span>Change Given:</span><span>{formatCurrency(changeGiven)}</span></div>}
            </div>
        )}

        <Separator className="my-2 summary-separator"/>
        <div className="flex justify-between font-semibold">
          <span>Total Paid:</span>
          <span>{formatCurrency(saleForPrinting ? saleForPrinting.totalAmountPaid : totalPaymentApplied)}</span>
        </div>
        <div className={cn("flex justify-between font-bold", (saleForPrinting ? (saleForPrinting.outstandingBalance ?? 0) : outstandingBalance) > 0 ? "text-destructive" : "text-muted-foreground")}>
          <span>Outstanding Balance:</span>
          <span>{formatCurrency(saleForPrinting ? (saleForPrinting.outstandingBalance ?? 0) : outstandingBalance)}</span>
        </div>
      </div>

      <p className="text-center text-xs mt-6 footer-thanks">Thank you for your purchase!</p>
      <p className="text-center text-[8pt] mt-4 footer-limidora">E-business solution by LIMIDORA</p>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!isReprintMode) {
            onOpenChange(open);
        } else if (isReprintMode && !open) {
           onOpenChange(false);
        } else {
           onOpenChange(open);
        }
    }}>
      <DialogContent 
        className={cn(
          "sm:max-w-lg flex flex-col p-0 printable-content",
          isOpen ? "max-h-[90vh]" : "" 
        )}
      >
        <div className="hidden print:block">
            {receiptContent}
        </div>
        <div className="print:hidden flex flex-col flex-grow min-h-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="font-headline text-xl">
              {isReprintMode ? "View Invoice" : "Transaction Receipt & Payment"}
            </DialogTitle>
            <DialogDescription>
              {isReprintMode ? `Details for invoice ${displaySaleId}.` : "Finalize payment and print the receipt."}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-grow px-6">
              {receiptContent}
              {!isReprintMode && (
                  <div className="mb-4 space-y-4">
                      <h3 className="font-semibold text-sm">Payment Details:</h3>
                       {outstandingBalance > 0 && !customerForDisplay && !isReprintMode && (
                          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-destructive text-sm flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <div>
                              <p className="font-semibold">Customer Required</p>
                              <p className="text-xs">A customer must be selected from the POS screen for credit or partially paid sales.</p>
                              </div>
                          </div>
                      )}

                      {(customerCreditBalance ?? 0) > 0 && (
                         <div className="border p-3 rounded-md space-y-3 bg-green-50 dark:bg-green-900/20">
                            <Label htmlFor="creditToApply" className="text-sm font-medium text-green-800 dark:text-green-300">
                                Available Credit: {formatCurrency(customerCreditBalance)}
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input id="creditToApply" type="number" value={creditToApply} onChange={e => setCreditToApply(e.target.value)} placeholder="0.00" className="h-10 bg-background" min="0" max={Math.min(customerCreditBalance || 0, totalAmountDueForDisplay)} step="0.01" disabled={isProcessing}/>
                                <Button type="button" variant="secondary" onClick={() => setCreditToApply(Math.min(customerCreditBalance || 0, totalAmountDueForDisplay).toString())}>Apply Max</Button>
                            </div>
                        </div>
                      )}
                      
                      <div>
                          <Label htmlFor="cashTendered" className="text-xs">Cash Paid (Rs.)</Label>
                          <Input id="cashTendered" type="number" value={cashTendered} onChange={(e) => setCashTendered(e.target.value)} placeholder="0.00" className="h-10 mt-1" min="0" step="0.01" disabled={isProcessing}/>
                      </div>
                      <div className="border p-3 rounded-md space-y-3 bg-muted/50">
                          <p className="text-xs font-medium">Cheque Payment (Optional)</p>
                          <div>
                              <Label htmlFor="chequeAmountPaid" className="text-xs">Cheque Amount (Rs.)</Label>
                              <Input id="chequeAmountPaid" type="number" value={chequeAmountPaid} onChange={(e) => setChequeAmountPaid(e.target.value)} placeholder="0.00" className="h-10 mt-1 bg-background" min="0" step="0.01" disabled={isProcessing}/>
                          </div>
                          <div>
                              <Label htmlFor="chequeNumber" className="text-xs">Cheque Number</Label>
                              <Input id="chequeNumber" type="text" value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} placeholder="Enter cheque number" className="h-10 mt-1 bg-background" disabled={isProcessing || parsedChequeAmountPaid <= 0} required={parsedChequeAmountPaid > 0}/>
                          </div>
                          <div>
                              <Label htmlFor="chequeBank" className="text-xs">Cheque Bank</Label>
                              <Input id="chequeBank" type="text" value={chequeBank} onChange={(e) => setChequeBank(e.target.value)} placeholder="Enter bank name" className="h-10 mt-1 bg-background" disabled={isProcessing || parsedChequeAmountPaid <= 0}/>
                          </div>
                          <div>
                              <Label htmlFor="chequeDate" className="text-xs">Cheque Date</Label>
                               <Popover>
                                  <PopoverTrigger asChild>
                                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-10 mt-1 bg-background", !chequeDate && "text-muted-foreground")} disabled={isProcessing || parsedChequeAmountPaid <= 0}>
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {chequeDate ? format(chequeDate, "PPP") : <span>Pick a date</span>}
                                  </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={chequeDate} onSelect={setChequeDate} initialFocus disabled={isProcessing || parsedChequeAmountPaid <= 0}/></PopoverContent>
                              </Popover>
                          </div>
                      </div>
                       <div className="border p-3 rounded-md space-y-3 bg-muted/50">
                          <p className="text-xs font-medium">Bank Transfer (Optional)</p>
                          <div>
                              <Label htmlFor="bankTransferAmountPaid" className="text-xs">Transfer Amount (Rs.)</Label>
                              <Input id="bankTransferAmountPaid" type="number" value={bankTransferAmountPaid} onChange={(e) => setBankTransferAmountPaid(e.target.value)} placeholder="0.00" className="h-10 mt-1 bg-background" min="0" step="0.01" disabled={isProcessing}/>
                          </div>
                          <div>
                              <Label htmlFor="bankTransferBankName" className="text-xs">Bank Name</Label>
                              <Input id="bankTransferBankName" type="text" value={bankTransferBankName} onChange={(e) => setBankTransferBankName(e.target.value)} placeholder="Enter bank name" className="h-10 mt-1 bg-background" disabled={isProcessing || parsedBankTransferAmountPaid <= 0}/>
                          </div>
                          <div>
                              <Label htmlFor="bankTransferReference" className="text-xs">Reference Number</Label>
                              <Input id="bankTransferReference" type="text" value={bankTransferReference} onChange={(e) => setBankTransferReference(e.target.value)} placeholder="Enter reference number" className="h-10 mt-1 bg-background" disabled={isProcessing || parsedBankTransferAmountPaid <= 0}/>
                          </div>
                      </div>
                  </div>
              )}
          </ScrollArea>

          <DialogFooter className="p-4 border-t flex justify-end gap-2">
             <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancel</Button>
             <Button onClick={handlePrimaryAction} disabled={isPrimaryButtonDisabled || isProcessing}>
               {isProcessing ? <><Banknote className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><Printer className="mr-2 h-4 w-4" /> {isReprintMode ? "Print Receipt" : "Confirm & Print"}</>}
             </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
