
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, UserCheck, Loader2, ShoppingCart, TrendingUp } from "lucide-react";
import type { Customer, Sale } from "@/lib/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

export interface CustomerReportData extends Customer {
  totalSpent: number;
  totalSales: number;
  lastPurchaseDate?: Date;
  outstandingBalance: number;
  sales: Sale[];
}

interface CustomerReportTableProps {
  data: CustomerReportData[];
  isLoading: boolean;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount).replace('LKR', 'Rs.');
const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase();

export function CustomerReportTable({ data, isLoading }: CustomerReportTableProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [expandedCustomerId, setExpandedCustomerId] = React.useState<string | null>(null);

  const toggleExpand = (customerId: string) => {
    setExpandedCustomerId(prev => (prev === customerId ? null : customerId));
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <UserCheck className="mx-auto h-12 w-12 mb-4" />
        <p>No customer data to display.</p>
        <p className="text-sm">Try adjusting your filters.</p>
      </div>
    );
  }

  // Mobile View
  if (isMobile) {
    return (
      <ScrollArea className="h-[calc(100vh-30rem)]">
        <div className="space-y-3">
          {data.map((customer) => (
            <Card key={customer.id} className="p-3" onClick={() => toggleExpand(customer.id)}>
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={customer.avatar} alt={customer.name} />
                  <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold text-primary">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.shopName || customer.phone}</p>
                    </div>
                     <Button variant="ghost" size="icon" className="h-7 w-7">
                        {expandedCustomerId === customer.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                     </Button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> Total Spent</p>
                          <p className="font-semibold">{formatCurrency(customer.totalSpent)}</p>
                      </div>
                       <div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Outstanding</p>
                          <p className={cn("font-semibold", customer.outstandingBalance > 0 ? 'text-destructive' : '')}>
                              {formatCurrency(customer.outstandingBalance)}
                          </p>
                      </div>
                  </div>
                </div>
              </div>
              {expandedCustomerId === customer.id && (
                <div className="mt-2 pt-2 border-t">
                  <h4 className="font-semibold text-xs mb-1">Purchase History</h4>
                  {customer.sales.length > 0 ? (
                    <div className="space-y-1">
                      {customer.sales.slice(0, 5).map(sale => (
                        <div key={sale.id} className="text-xs flex justify-between p-1 rounded bg-muted/50">
                          <div>
                            <p className="font-mono">{sale.id}</p>
                            <p className="text-muted-foreground">{format(sale.saleDate, 'PP')}</p>
                          </div>
                          <div className="text-right">
                             <p>{formatCurrency(sale.totalAmount)}</p>
                             <Badge variant={sale.outstandingBalance > 0 ? 'destructive' : 'default'} className={cn("text-[10px] h-4 px-1", sale.outstandingBalance <= 0 && 'bg-green-600')}>
                                {sale.outstandingBalance > 0 ? 'Pending' : 'Paid'}
                              </Badge>
                          </div>
                        </div>
                      ))}
                      {customer.sales.length > 5 && <p className="text-center text-xs text-muted-foreground mt-1">...and {customer.sales.length - 5} more</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">No sales recorded.</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </ScrollArea>
    )
  }

  // Desktop View
  return (
    <ScrollArea className="h-[calc(100vh-25rem)]">
      <Table>
        <TableHeader className="sticky top-0 bg-card z-10">
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-center">Total Sales</TableHead>
            <TableHead className="text-right">Total Spent</TableHead>
            <TableHead className="text-right">Outstanding Balance</TableHead>
            <TableHead>Last Purchase</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((customer) => (
            <React.Fragment key={customer.id}>
              <TableRow onClick={() => toggleExpand(customer.id)} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {expandedCustomerId === customer.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={customer.avatar} alt={customer.name} />
                      <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.shopName || customer.phone}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">{customer.totalSales}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(customer.totalSpent)}</TableCell>
                <TableCell className={cn("text-right font-semibold", customer.outstandingBalance > 0 ? 'text-destructive' : '')}>
                  {formatCurrency(customer.outstandingBalance)}
                </TableCell>
                <TableCell>{customer.lastPurchaseDate ? format(customer.lastPurchaseDate, "PP") : "N/A"}</TableCell>
              </TableRow>
              {expandedCustomerId === customer.id && (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <div className="p-4 bg-muted/30">
                      <h4 className="font-semibold mb-2">Purchase History for {customer.name}</h4>
                      {customer.sales.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Sale ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Payment</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customer.sales.map(sale => (
                                <TableRow key={sale.id}>
                                  <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                                  <TableCell>{format(sale.saleDate, 'PP p')}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(sale.totalAmount)}</TableCell>
                                  <TableCell>
                                    <Badge variant={sale.outstandingBalance > 0 ? 'destructive' : 'default'} className={sale.outstandingBalance <= 0 ? 'bg-green-600 hover:bg-green-700' : ''}>
                                      {sale.outstandingBalance > 0 ? 'Pending' : 'Paid'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No sales recorded for this customer.</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
