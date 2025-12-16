
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AppLogo } from "@/components/AppLogo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, CalendarIcon, Printer } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Sale, Payment, ChequeInfo, BankTransferInfo } from "@/lib/types";

interface PaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  sale: Sale | null;
  onSuccess: () => void;
}

interface PaymentReceiptData {
  saleId: string;
  customerName?: string;
  customerShopName?: string;
  paymentAmount: number;
  paymentDate: Date;
  paymentMethod: string;
  newOutstandingBalance: number;
  staffId: string;
}

export function PaymentDialog({ isOpen, onOpenChange, sale, onSuccess }: PaymentDialogProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<Payment["method"]>("Cash");
  const [notes, setNotes] = useState("");

  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeBank, setChequeBank] = useState("");
  const [chequeDate, setChequeDate] = useState<Date | undefined>(new Date());
  
  const [bankTransferBankName, setBankTransferBankName] = useState("");
  const [bankTransferReference, setBankTransferReference] = useState("");

  const [paymentReceiptData, setPaymentReceiptData] = useState<PaymentReceiptData | null>(null);

  useEffect(() => {
    if (isOpen && sale) {
      setPaymentAmount(sale.outstandingBalance.toString());
      setPaymentMethod("Cash");
      setNotes("");
      setChequeNumber("");
      setChequeBank("");
      setChequeDate(new Date());
      setBankTransferBankName("");
      setBankTransferReference("");
      setPaymentReceiptData(null);
    }
  }, [isOpen, sale]);
  
  useEffect(() => {
    if (paymentReceiptData) {
        window.print();
    }
  }, [paymentReceiptData]);

  const handleConfirmPayment = async () => {
    if (!sale) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid payment amount." });
      return;
    }
    if (amount > sale.outstandingBalance) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Payment amount cannot be greater than the outstanding balance." });
      return;
    }
    if (paymentMethod === "Cheque" && !chequeNumber.trim()) {
        toast({ variant: "destructive", title: "Cheque Number Required", description: "Please enter a cheque number." });
        return;
    }

    setIsProcessing(true);
    try {
      let details: ChequeInfo | BankTransferInfo | undefined = undefined;
      if (paymentMethod === "Cheque") {
          details = { number: chequeNumber, bank: chequeBank, date: chequeDate };
      } else if (paymentMethod === "BankTransfer") {
          details = { bankName: bankTransferBankName, referenceNumber: bankTransferReference };
      }
      
      const response = await fetch(`/api/sales/${sale.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentAmount: amount,
          paymentMethod,
          paymentDate: new Date(),
          notes,
          details,
          staffId: currentUser?.username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to record payment.');
      }
      
      const updatedSale = await response.json();

      toast({ title: "Payment Recorded", description: "The payment has been successfully recorded." });
      
      setPaymentReceiptData({
        saleId: sale.id,
        customerName: sale.customerName,
        customerShopName: sale.customerShopName,
        paymentAmount: amount,
        paymentDate: new Date(),
        paymentMethod: paymentMethod,
        newOutstandingBalance: updatedSale.outstandingBalance,
        staffId: currentUser?.username || 'N/A'
      });

    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
      setIsProcessing(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && paymentReceiptData) {
        onSuccess();
    }
    onOpenChange(open);
  };

  const formatCurrency = (val: number) => `Rs. ${val.toFixed(2)}`;
  
  const receipt = paymentReceiptData || {
      saleId: sale?.id,
      customerName: sale?.customerName,
      customerShopName: sale?.customerShopName,
      paymentAmount: parseFloat(paymentAmount) || 0,
      paymentDate: new Date(),
      paymentMethod: paymentMethod,
      newOutstandingBalance: sale ? sale.outstandingBalance - (parseFloat(paymentAmount) || 0) : 0,
      staffId: currentUser?.username
  };

  const receiptContent = (
    <div id="payment-receipt-content" className="p-4 bg-card text-card-foreground">
        <div className="text-center mb-4">
          <div className="flex justify-center mb-1 logo-container">
            <AppLogo size="md"/>
          </div>
          <p className="text-xs">4/1 Bujjampala, Dankotuwa</p>
          <p className="text-xs">Hotline: 077-1066595, 077-6106616</p>
        </div>
        <h2 className="text-center font-bold text-lg mb-4">PAYMENT RECEIPT</h2>
          <Separator className="my-2 summary-separator"/>
        <div className="text-xs space-y-0.5">
            <p><strong>Original Invoice ID:</strong> {receipt.saleId}</p>
            <p><strong>Customer:</strong> {receipt.customerShopName || receipt.customerName || 'N/A'}</p>
            <p><strong>Payment Date:</strong> {format(receipt.paymentDate, "PP, p")}</p>
            <p><strong>Received by:</strong> {receipt.staffId}</p>
        </div>
          <Separator className="my-2 summary-separator"/>
        <div className="text-sm space-y-1 mt-4">
            <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-medium">{receipt.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-primary">
                <span>Amount Paid:</span>
                <span>{formatCurrency(receipt.paymentAmount)}</span>
            </div>
              <div className="flex justify-between">
                <span>New Outstanding Balance:</span>
                <span className="font-medium">{formatCurrency(receipt.newOutstandingBalance)}</span>
            </div>
        </div>
          <p className="text-center text-xs mt-6">Thank you for your payment!</p>
          <p className="text-center text-[8pt] mt-4">E-business solution by LIMIDORA</p>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={cn("sm:max-w-lg flex flex-col max-h-[90vh] printable-content")}>
        <div className="hidden print:block">
          {receiptContent}
        </div>
        <div className="print:hidden flex flex-col flex-grow min-h-0">
            <DialogHeader>
              <DialogTitle className="font-headline text-xl">Add Payment for Invoice</DialogTitle>
              <DialogDescription>Invoice ID: {sale?.id}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow pr-6 -mr-6 py-4">
                <div className="space-y-4">
                    <div>
                        <Label>Outstanding Balance</Label>
                        <Input value={formatCurrency(sale?.outstandingBalance || 0)} disabled className="font-bold text-base h-11 bg-muted" />
                    </div>
                    <div>
                        <Label htmlFor="paymentAmount">Payment Amount (Rs.)</Label>
                        <Input id="paymentAmount" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="h-11" />
                    </div>
                    <div>
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={(val: Payment["method"]) => setPaymentMethod(val)}>
                            <SelectTrigger id="paymentMethod" className="h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Cheque">Cheque</SelectItem>
                                <SelectItem value="BankTransfer">Bank Transfer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {paymentMethod === 'Cheque' && (
                        <div className="border p-3 rounded-md space-y-3 bg-muted/50">
                           <Label>Cheque Details</Label>
                            <Input placeholder="Cheque Number" value={chequeNumber} onChange={e => setChequeNumber(e.target.value)} />
                            <Input placeholder="Bank Name" value={chequeBank} onChange={e => setChequeBank(e.target.value)} />
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start font-normal h-11 bg-background">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {chequeDate ? format(chequeDate, "PPP") : "Cheque Date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={chequeDate} onSelect={setChequeDate} /></PopoverContent>
                            </Popover>
                        </div>
                    )}
                    {paymentMethod === 'BankTransfer' && (
                         <div className="border p-3 rounded-md space-y-3 bg-muted/50">
                           <Label>Bank Transfer Details</Label>
                            <Input placeholder="Bank Name" value={bankTransferBankName} onChange={e => setBankTransferBankName(e.target.value)} />
                            <Input placeholder="Reference Number" value={bankTransferReference} onChange={e => setBankTransferReference(e.target.value)} />
                        </div>
                    )}
                    <div>
                         <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                </div>
            </ScrollArea>
             <DialogFooter className="pt-4 border-t">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                <Button onClick={handleConfirmPayment} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4" />}
                    Confirm & Print Receipt
                </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
