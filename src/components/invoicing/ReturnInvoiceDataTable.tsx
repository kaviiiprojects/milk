"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Eye, ChevronDown, ChevronUp, Loader2, AlertTriangle, Undo2, Gift } from "lucide-react";
import { format } from "date-fns";
import type { ReturnTransaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ReturnInvoiceDialog } from "@/components/returns/ReturnInvoiceDialog";

interface ReturnInvoiceDataTableProps {
  returns: ReturnTransaction[];
  isLoading: boolean;
  error?: string | null;
}

const formatCurrency = (amount: number | undefined) => {
  if (typeof amount !== 'number' || isNaN(amount)) return 'Rs. 0.00';
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
  }).format(amount).replace('LKR', 'Rs.');
};

export function ReturnInvoiceDataTable({ returns, isLoading, error }: ReturnInvoiceDataTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<ReturnTransaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const toggleExpand = (returnId: string) => {
    setExpandedRow(prev => prev === returnId ? null : returnId);
  };
  
  const handleViewReceipt = (returnTx: ReturnTransaction) => {
    setSelectedReturn(returnTx);
    setIsReceiptOpen(true);
  };
  
  const calculateNetValue = (returnTx: ReturnTransaction) => {
    const returnValue = returnTx.returnedItems.reduce((sum, item) => sum + item.quantity * item.appliedPrice, 0);
    const exchangeValue = returnTx.exchangedItems.reduce((sum, item) => sum + item.quantity * item.appliedPrice, 0);
    return exchangeValue - returnValue;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading return history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">Error loading returns</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  
  if (returns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Undo2 className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">No Return Invoices Found</p>
        <p className="text-sm">There have been no returns or exchanges processed yet.</p>
      </div>
    );
  }

  return (
    <>
      <Card className="shadow-sm border rounded-lg">
        <CardContent className="p-0">
          <div className="md:hidden p-4">
            <div className="space-y-4">
              {returns.map((returnTx) => {
                const netValue = calculateNetValue(returnTx);
                return (
                  <div key={returnTx.id} className="border rounded-lg p-4">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleExpand(returnTx.id)}
                    >
                      <div>
                        <p className="font-medium">{returnTx.customerName || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(returnTx.returnDate, 'PP')}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {expandedRow === returnTx.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Return ID</p>
                        <p className="font-mono">{returnTx.id.slice(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sale ID</p>
                        <p className="font-mono">{returnTx.originalSaleId.slice(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Net Value</p>
                        <p className={cn("font-semibold", netValue > 0 ? "text-destructive" : "text-green-600")}>
                          {formatCurrency(netValue)}
                        </p>
                      </div>
                      <div className="flex items-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={(e) => { e.stopPropagation(); handleViewReceipt(returnTx); }}
                        >
                          <Eye className="h-4 w-4 mr-1"/> View
                        </Button>
                      </div>
                    </div>

                    {expandedRow === returnTx.id && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        {returnTx.returnedItems.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2 flex items-center">
                              <Undo2 className="h-4 w-4 mr-2" /> Items Returned
                            </h4>
                            <div className="space-y-2 text-sm">
                              {returnTx.returnedItems.map((item, i) => (
                                <div key={`ret-${i}`} className="flex justify-between bg-muted/50 p-2 rounded">
                                  <span>
                                    <Badge variant="secondary" className="mr-2">{item.quantity}x</Badge>
                                    {item.name}
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(item.quantity * item.appliedPrice)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {returnTx.exchangedItems.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2 flex items-center">
                              <Gift className="h-4 w-4 mr-2" /> Items Exchanged For
                            </h4>
                            <div className="space-y-2 text-sm">
                              {returnTx.exchangedItems.map((item, i) => (
                                <div key={`ex-${i}`} className="flex justify-between bg-muted/50 p-2 rounded">
                                  <span>
                                    <Badge variant="secondary" className="mr-2">{item.quantity}x</Badge>
                                    {item.name}
                                  </span>
                                  <span className="font-medium">
                                    {formatCurrency(item.quantity * item.appliedPrice)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hidden md:block">
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Return ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Original Sale</TableHead>
                    <TableHead className="text-right">Net Value</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((returnTx) => {
                    const netValue = calculateNetValue(returnTx);
                    return (
                      <React.Fragment key={returnTx.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/50" 
                          onClick={() => toggleExpand(returnTx.id)}
                        >
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              {expandedRow === returnTx.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            <Badge variant="outline">{returnTx.id.slice(0, 8)}...</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{format(returnTx.returnDate, 'PP')}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(returnTx.returnDate, 'p')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {returnTx.customerName || 'N/A'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            <Badge variant="outline">{returnTx.originalSaleId.slice(0, 8)}...</Badge>
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-semibold",
                            netValue > 0 ? "text-destructive" : "text-green-600"
                          )}>
                            {formatCurrency(netValue)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={(e) => { e.stopPropagation(); handleViewReceipt(returnTx); }}
                              className="hover:bg-primary hover:text-primary-foreground"
                            >
                              <Eye className="mr-2 h-4 w-4"/> View
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expandedRow === returnTx.id && (
                          <TableRow>
                            <TableCell colSpan={7} className="p-0">
                              <div className="p-4 bg-muted/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {returnTx.returnedItems.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2 flex items-center">
                                      <Undo2 className="h-4 w-4 mr-2" /> Items Returned
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      {returnTx.returnedItems.map((item, i) => (
                                        <div 
                                          key={`ret-${i}`} 
                                          className="flex justify-between items-center p-2 rounded hover:bg-muted/30"
                                        >
                                          <div className="flex items-center">
                                            <Badge variant="secondary" className="mr-2">
                                              {item.quantity}x
                                            </Badge>
                                            <span>{item.name}</span>
                                          </div>
                                          <span className="font-medium">
                                            {formatCurrency(item.quantity * item.appliedPrice)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {returnTx.exchangedItems.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2 flex items-center">
                                      <Gift className="h-4 w-4 mr-2" /> Items Exchanged For
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      {returnTx.exchangedItems.map((item, i) => (
                                        <div 
                                          key={`ex-${i}`} 
                                          className="flex justify-between items-center p-2 rounded hover:bg-muted/30"
                                        >
                                          <div className="flex items-center">
                                            <Badge variant="secondary" className="mr-2">
                                              {item.quantity}x
                                            </Badge>
                                            <span>{item.name}</span>
                                          </div>
                                          <span className="font-medium">
                                            {formatCurrency(item.quantity * item.appliedPrice)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
      
      {selectedReturn && (
        <ReturnInvoiceDialog
          isOpen={isReceiptOpen}
          onOpenChange={setIsReceiptOpen}
          returnTransaction={selectedReturn}
        />
      )}
    </>
  );
}
