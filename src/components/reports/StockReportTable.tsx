"use client";

import type { StockTransaction } from "@/lib/types";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Warehouse, Info, Filter, Download, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getTransactionTypeBadge = (type: StockTransaction["type"]) => {
  switch (type) {
    case "ADD_STOCK_INVENTORY":
      return <Badge className="bg-green-600 hover:bg-green-700 text-white">Stock In</Badge>;
    case "LOAD_TO_VEHICLE":
      return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Load to Vehicle</Badge>;
    case "UNLOAD_FROM_VEHICLE":
      return <Badge className="bg-cyan-600 hover:bg-cyan-700 text-white">Unload from Vehicle</Badge>;
    case "REMOVE_STOCK_WASTAGE":
      return <Badge variant="destructive">Wastage</Badge>;
    case "STOCK_ADJUSTMENT_MANUAL":
      return <Badge variant="secondary">Manual Adjust</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

interface StockReportTableProps {
  data: (StockTransaction & { vehicleNumber?: string })[];
  isLoading?: boolean;
}

export function StockReportTable({ data, isLoading }: StockReportTableProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center space-y-4 max-w-md">
          <Warehouse className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-medium">No stock transactions found</h3>
          <p className="text-muted-foreground text-sm">
            Try adjusting your filters or check back later
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Adjust Filters
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-2 p-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Stock Transactions</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {data.map((tx) => {
          const isExpanded = expandedRow === tx.id;
          const isPositive = ["ADD_STOCK_INVENTORY", "UNLOAD_FROM_VEHICLE"].includes(tx.type);
          
          return (
            <div 
              key={tx.id}
              className={`rounded-lg border p-3 transition-all ${isExpanded ? "bg-muted/50" : ""}`}
              onClick={() => setExpandedRow(isExpanded ? null : tx.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{tx.productName}</p>
                  <p className="text-xs text-muted-foreground">{tx.productSku || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${isPositive ? "text-green-600" : "text-destructive"}`}>
                    {isPositive ? '+' : '-'}{tx.quantity}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
              
              <div className="mt-2 flex justify-between items-center">
                <div>
                  {getTransactionTypeBadge(tx.type)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(tx.transactionDate, "PP")}
                </div>
              </div>
              
              {isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Previous Stock</p>
                    <p>{tx.previousStock}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">New Stock</p>
                    <p>{tx.newStock}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">{tx.vehicleId ? "Vehicle" : "User"}</p>
                    <p>{tx.vehicleId ? (tx.vehicleNumber || tx.vehicleId) : tx.userId}</p>
                  </div>
                  {tx.notes && (
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Notes</p>
                      <p className="text-right">{tx.notes}</p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Time</p>
                    <p>{format(tx.transactionDate, "p")}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Stock Transactions</h3>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>
      
      <TooltipProvider>
        <div className="relative rounded-lg border shadow-sm">
          <ScrollArea className="h-[calc(100vh-17rem)] w-full">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[150px]">Date & Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="w-[150px]">Type</TableHead>
                  <TableHead className="w-[100px] text-right">Quantity</TableHead>
                  <TableHead className="w-[100px] text-right">Prev. Stock</TableHead>
                  <TableHead className="w-[100px] text-right">New Stock</TableHead>
                  <TableHead className="w-[150px]">User / Vehicle</TableHead>
                  <TableHead className="w-[100px] text-center">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((tx) => {
                  const isPositive = ["ADD_STOCK_INVENTORY", "UNLOAD_FROM_VEHICLE"].includes(tx.type);
                  
                  return (
                    <TableRow key={tx.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-xs">
                        <div>{format(tx.transactionDate, "PP")}</div>
                        <div className="text-muted-foreground">{format(tx.transactionDate, "p")}</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>{tx.productName}</div>
                        <div className="text-muted-foreground text-xs">{tx.productSku || 'N/A'}</div>
                      </TableCell>
                      <TableCell>{getTransactionTypeBadge(tx.type)}</TableCell>
                      <TableCell className={`text-right font-semibold ${isPositive ? "text-green-600" : "text-destructive"}`}>
                        {`${isPositive ? '+' : '-'}${tx.quantity}`}
                      </TableCell>
                      <TableCell className="text-right">{tx.previousStock}</TableCell>
                      <TableCell className="text-right">{tx.newStock}</TableCell>
                      <TableCell className="text-xs">
                        {tx.vehicleId ? (
                          <div>
                            <div className="font-medium">Vehicle</div>
                            <div>{tx.vehicleNumber || tx.vehicleId}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">User</div>
                            <div>{tx.userId}</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {tx.notes ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Info className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{tx.notes}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </TooltipProvider>
    </div>
  );
}