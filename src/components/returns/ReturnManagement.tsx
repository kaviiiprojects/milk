

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, Package, Hash, Loader2, Users, ChevronsUpDown, Check, ArrowRight, Undo2, XCircle, PlusCircle, MinusCircle, Trash2, CalendarIcon, Wallet, Gift, Tag, Truck, Warehouse } from "lucide-react";
import type { Customer, Sale, CartItem, Product, ReturnTransaction, ChequeInfo, BankTransferInfo, StockTransaction } from "@/lib/types";
import { useCustomers } from "@/hooks/useCustomers";
import { useSalesData } from "@/hooks/useSalesData";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ReturnInvoiceDialog } from "./ReturnInvoiceDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { useVehicles } from "@/hooks/useVehicles";

interface ReturnItem extends CartItem {
  returnQuantity: number;
  isResellable: boolean;
  maxReturnable: number;
}

const formatCurrency = (amount: number) => `Rs. ${amount.toFixed(2)}`;

export function ReturnManagement() {
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const { sales, isLoading: isLoadingSales, refetchSales } = useSalesData(false);
  const { products: allProducts, isLoading: isLoadingProducts, refetch: refetchProducts } = useProducts();
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const isCashier = currentUser?.role === 'cashier';

  // Search State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState<string>("");
  const [openCustomerPopover, setOpenCustomerPopover] = useState(false);
  const [isSearchingSale, setIsSearchingSale] = useState(false);

  // Return Processing State
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [itemsToReturn, setItemsToReturn] = useState<ReturnItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [applyCredit, setApplyCredit] = useState(true);
  
  // Exchange State
  const [exchangeItems, setExchangeItems] = useState<CartItem[]>([]);
  const [openProductPopover, setOpenProductPopover] = useState(false);
  const [currentExchangeSaleType, setCurrentExchangeSaleType] = useState<'retail' | 'wholesale'>('retail');
  const [viewMode, setViewMode] = useState<'main' | 'vehicle'>(isCashier ? 'vehicle' : 'main');
  const [vehicleStock, setVehicleStock] = useState<Product[] | null>(null);
  const [isVehicleStockLoading, setIsVehicleStockLoading] = useState(false);
  const [selectedVehicleIdForExchange, setSelectedVehicleIdForExchange] = useState<string | null>(null);

  // Payment State (for when customer owes money)
  const [cashTendered, setCashTendered] = useState<string>("");
  const [chequeAmountPaid, setChequeAmountPaid] = useState<string>("");
  const [chequeNumber, setChequeNumber] = useState<string>("");
  const [chequeBank, setChequeBank] = useState<string>("");
  const [chequeDate, setChequeDate] = useState<Date | undefined>(new Date());
  
  const [bankTransferAmountPaid, setBankTransferAmountPaid] = useState<string>("");
  const [bankTransferBankName, setBankTransferBankName] = useState<string>("");
  const [bankTransferReference, setBankTransferReference] = useState<string>("");

  // Receipt State
  const [returnReceiptData, setReturnReceiptData] = useState<ReturnTransaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    if (isCashier) {
        setViewMode('vehicle');
    }
  }, [isCashier]);

  const customerOptions = useMemo(() => {
    if (!customers) return [];
    return customers.map(customer => ({
      value: customer.id,
      label: `${customer.name} (${customer.shopName || customer.phone})`,
      customerObject: customer
    }));
  }, [customers]);

  useEffect(() => {
    if (selectedCustomer && sales.length > 0) {
      const filteredSales = sales
        .filter(sale => sale.customerId === selectedCustomer.id)
        .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
      setCustomerSales(filteredSales);
    } else {
      setCustomerSales([]);
    }
    setSelectedSaleId("");
    setSelectedSale(null);
    setItemsToReturn([]);
  }, [selectedCustomer, sales]);
  
  const handleSearchSale = () => {
    if (!selectedSaleId) return;
    setIsSearchingSale(true);
    const sale = customerSales.find(s => s.id === selectedSaleId);
    if (sale) {
        setSelectedSale(sale);
        const returnableItems = sale.items
            .filter(item => !item.isOfferItem)
            .map(item => {
                const alreadyReturned = item.returnedQuantity || 0;
                const maxReturnable = item.quantity - alreadyReturned;
                if (maxReturnable <= 0) return null;

                return {
                    ...item,
                    maxReturnable,
                    returnQuantity: 0,
                    isResellable: true
                };
            })
            .filter((item): item is ReturnItem => item !== null);
        setItemsToReturn(returnableItems);
    } else {
        toast({ variant: "destructive", title: "Sale not found" });
        setSelectedSale(null);
        setItemsToReturn([]);
    }
    setTimeout(() => setIsSearchingSale(false), 500);
  };
  
  const handleReturnQuantityChange = (productId: string, saleType: 'retail' | 'wholesale', newQuantityStr: string) => {
    const newQuantity = parseInt(newQuantityStr) || 0;
    setItemsToReturn(prev => 
        prev.map(item => {
            if (item.id === productId && item.saleType === saleType) {
                const validQuantity = Math.max(0, Math.min(newQuantity, item.maxReturnable));
                return {...item, returnQuantity: validQuantity};
            }
            return item;
        })
    );
  };
  
  const handleResellableChange = useCallback((productId: string, saleType: 'retail' | 'wholesale', isResellable: boolean) => {
    setItemsToReturn(prev => 
        prev.map(item =>
            (item.id === productId && item.saleType === saleType) ? { ...item, isResellable } : item
        )
    );
  }, []);

  const resetSearch = () => {
    setSelectedCustomer(null);
    setCustomerSales([]);
    setSelectedSaleId("");
    setSelectedSale(null);
    setItemsToReturn([]);
    setExchangeItems([]);
    setApplyCredit(true);
    // Reset payment fields
    setCashTendered("");
    setChequeAmountPaid("");
    setChequeNumber("");
    setChequeBank("");
    setChequeDate(new Date());
    setBankTransferAmountPaid("");
    setBankTransferBankName("");
    setBankTransferReference("");
  };

  const handleFetchVehicleStock = async (vehicleId: string) => {
    if (!vehicleId) {
      setVehicleStock(null);
      setSelectedVehicleIdForExchange(null);
      return;
    }

    setIsVehicleStockLoading(true);
    setVehicleStock(null);
    setSelectedVehicleIdForExchange(vehicleId);

    const targetVehicle = vehicles.find(v => v.id === vehicleId);

    if (!targetVehicle) {
      toast({ variant: "destructive", title: "Error", description: `Vehicle not found.` });
      setIsVehicleStockLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/stock-transactions?vehicleId=${targetVehicle.id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.details || errorData.error || 'Failed to fetch vehicle stock data.';
        throw new Error(message);
      }
      const transactions: StockTransaction[] = await response.json();

      if (transactions.length === 0) {
        setVehicleStock([]);
        setIsVehicleStockLoading(false);
        return;
      }
      
      const stockMap = new Map<string, number>();
      transactions.forEach(tx => {
        const currentQty = stockMap.get(tx.productId) || 0;
        if (tx.type === 'LOAD_TO_VEHICLE') {
          stockMap.set(tx.productId, currentQty + tx.quantity);
        } else if (tx.type === 'UNLOAD_FROM_VEHICLE') {
          stockMap.set(tx.productId, currentQty - tx.quantity);
        }
      });

      const vehicleProducts: Product[] = [];
      for (const [productId, vehicleQty] of stockMap.entries()) {
        const baseProduct = allProducts.find(p => p.id === productId);
        if (baseProduct && vehicleQty > 0) {
          vehicleProducts.push({
            ...baseProduct,
            stock: vehicleQty,
          });
        }
      }
      setVehicleStock(vehicleProducts);

    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: error.message || "Could not load vehicle stock." });
      setVehicleStock([]);
    } finally {
      setIsVehicleStockLoading(false);
    }
  };

  const productsForDisplay = viewMode === 'vehicle' ? vehicleStock : allProducts.filter(p => p.stock > 0);

  const handleAddToExchange = (productToAdd: Product) => {
    const quantityInCart = exchangeItems.find(item => item.id === productToAdd.id && item.saleType === currentExchangeSaleType)?.quantity ?? 0;

    if (quantityInCart >= productToAdd.stock) {
        toast({
            variant: "destructive",
            title: "Out of Stock",
            description: `No more ${productToAdd.name} available in the selected stock.`,
        });
        return;
    }

    const existingItemIndex = exchangeItems.findIndex(
        item => item.id === productToAdd.id && item.saleType === currentExchangeSaleType
    );

    const priceToUse = (currentExchangeSaleType === 'wholesale' && productToAdd.wholesalePrice)
        ? productToAdd.wholesalePrice
        : productToAdd.price;
        
    setExchangeItems(prev => {
        if (existingItemIndex > -1) {
            const newItems = [...prev];
            newItems[existingItemIndex].quantity += 1;
            return newItems;
        } else {
            return [...prev, {
                ...productToAdd,
                quantity: 1,
                appliedPrice: priceToUse,
                saleType: currentExchangeSaleType,
                isOfferItem: false,
            }];
        }
    });

    setOpenProductPopover(false);
  }

  const handleUpdateExchangeQuantity = (productId: string, saleType: 'retail' | 'wholesale', newQuantity: number) => {
      if (newQuantity < 1) {
          handleRemoveFromExchange(productId, saleType);
          return;
      }
      
      const sourceProducts = viewMode === 'vehicle' ? vehicleStock : allProducts;
      if (!sourceProducts) return;

      const productInStock = sourceProducts.find(p => p.id === productId);
      if (!productInStock) return;

      if (newQuantity > productInStock.stock) {
          toast({
              variant: "destructive",
              title: "Stock Limit Exceeded",
              description: `Cannot add more than ${productInStock.stock} units of ${productInStock.name}.`,
          });
          setExchangeItems(prev => prev.map(item => 
            (item.id === productId && item.saleType === saleType) 
            ? {...item, quantity: productInStock.stock} 
            : item
          ));
          return;
      }

      setExchangeItems(prev => prev.map(item => 
        (item.id === productId && item.saleType === saleType) 
        ? {...item, quantity: newQuantity} 
        : item
      ));
  }

  const handleRemoveFromExchange = (productId: string, saleType: 'retail' | 'wholesale') => {
      setExchangeItems(prev => prev.filter(item => !(item.id === productId && item.saleType === saleType)));
  }

  const {
    returnTotalValue,
    outstandingToSettle,
    netCreditAfterSettle,
    finalAmountDue,
    refundToCustomer
  } = useMemo(() => {
    const outstandingBalance = selectedSale?.outstandingBalance || 0;
    const returnValue = itemsToReturn.reduce((total, item) => total + (item.appliedPrice * item.returnQuantity), 0);
    const exchangeValue = exchangeItems.reduce((total, item) => total + item.appliedPrice * item.quantity, 0);

    const toSettle = applyCredit && outstandingBalance > 0 ? Math.min(returnValue, outstandingBalance) : 0;
    const creditAfter = returnValue - toSettle;
    const finalDiff = exchangeValue - creditAfter;

    return {
      returnTotalValue: returnValue,
      outstandingToSettle: toSettle,
      netCreditAfterSettle: creditAfter,
      finalAmountDue: finalDiff > 0 ? finalDiff : 0,
      refundToCustomer: finalDiff < 0 ? Math.abs(finalDiff) : 0,
    };
  }, [itemsToReturn, exchangeItems, selectedSale, applyCredit]);

  const parsedCashTendered = parseFloat(cashTendered) || 0;
  const parsedChequeAmountPaid = parseFloat(chequeAmountPaid) || 0;
  const parsedBankTransferAmountPaid = parseFloat(bankTransferAmountPaid) || 0;
  const totalTenderedByMethods = parsedCashTendered + parsedChequeAmountPaid + parsedBankTransferAmountPaid;
  
  const changeGiven = useMemo(() => {
    if (finalAmountDue <= 0) return 0;
    if (parsedCashTendered > 0 && totalTenderedByMethods > finalAmountDue) {
      const cashExcess = parsedCashTendered - (finalAmountDue - (parsedChequeAmountPaid + parsedBankTransferAmountPaid));
      return Math.max(0, cashExcess);
    }
    return 0;
  }, [parsedCashTendered, parsedChequeAmountPaid, parsedBankTransferAmountPaid, totalTenderedByMethods, finalAmountDue]);

  const totalPaymentApplied = totalTenderedByMethods - changeGiven;

  const getPaymentSummary = useCallback(() => {
    const methodsUsed: string[] = [];
    if (parsedCashTendered > 0) methodsUsed.push(`Cash (${(parsedCashTendered - changeGiven).toFixed(2)})`);
    if (parsedChequeAmountPaid > 0) methodsUsed.push(`Cheque (${parsedChequeAmountPaid.toFixed(2)})${chequeNumber.trim() ? ` - #${chequeNumber.trim()}` : ''}`);
    if (parsedBankTransferAmountPaid > 0) methodsUsed.push(`Bank Transfer (${parsedBankTransferAmountPaid.toFixed(2)})`);
    return methodsUsed.join(' + ');
  }, [parsedCashTendered, parsedChequeAmountPaid, parsedBankTransferAmountPaid, chequeNumber, changeGiven]);
  
  const handleProcessExchange = async () => {
    if (!selectedSale || !currentUser) return;

    const activeReturnedItems = itemsToReturn.filter(item => item.returnQuantity > 0);
    if (activeReturnedItems.length === 0 && exchangeItems.length === 0) {
        toast({ variant: "destructive", title: "Nothing to Process", description: "Please specify items to return or exchange." });
        return;
    }
    if (finalAmountDue > 0 && totalPaymentApplied < finalAmountDue) {
        toast({ variant: "destructive", title: "Insufficient Payment", description: `Amount to pay is ${formatCurrency(finalAmountDue)}, but only ${formatCurrency(totalPaymentApplied)} was provided.` });
        return;
    }

    setIsProcessing(true);
    try {
        const payload: any = {
            saleId: selectedSale.id,
            returnedItems: activeReturnedItems.map(item => ({ 
                id: item.id,
                saleType: item.saleType,
                quantity: item.returnQuantity,
                isResellable: item.isResellable,
                name: item.name,
                category: item.category,
                price: item.price,
                appliedPrice: item.appliedPrice,
                sku: item.sku
            })),
            exchangedItems: exchangeItems.map(item => ({ 
                id: item.id,
                quantity: item.quantity,
                name: item.name,
                category: item.category,
                price: item.price,
                appliedPrice: item.appliedPrice,
                sku: item.sku,
                saleType: item.saleType
            })),
            staffId: currentUser.username,
            customerId: selectedSale.customerId,
            customerName: selectedSale.customerName,
            settleOutstandingAmount: outstandingToSettle > 0 ? outstandingToSettle : undefined,
            refundAmount: refundToCustomer > 0 ? refundToCustomer : undefined,
            vehicleId: viewMode === 'vehicle' ? selectedVehicleIdForExchange : undefined,
        };
        
        if (finalAmountDue > 0) {
            payload.payment = {
                amountPaid: totalPaymentApplied,
                paymentSummary: getPaymentSummary(),
                changeGiven: changeGiven > 0 ? changeGiven : undefined,
                chequeDetails: parsedChequeAmountPaid > 0 ? {
                    number: chequeNumber, bank: chequeBank, date: chequeDate, amount: parsedChequeAmountPaid
                } : undefined,
                bankTransferDetails: parsedBankTransferAmountPaid > 0 ? {
                    bankName: bankTransferBankName, referenceNumber: bankTransferReference, amount: parsedBankTransferAmountPaid
                } : undefined
            }
        }

        const response = await fetch('/api/returns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.details || result.error || 'Failed to process the exchange.');
        }

        toast({
            title: "Transaction Successful",
            description: `Return ID: ${result.returnId}`,
        });

        setReturnReceiptData(result.returnData);
        setIsReceiptOpen(true);

        await refetchProducts();
        await refetchSales();

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Transaction Failed",
            description: error.message,
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const isLoading = isLoadingCustomers || isLoadingSales || isLoadingProducts;
  const currentCustomerLabel = selectedCustomer
    ? `${selectedCustomer.name} (${selectedCustomer.shopName || selectedCustomer.phone})`
    : "Select a customer...";

  const availableProductsForExchange = useMemo(() => {
    if (viewMode === 'main') {
        return allProducts.filter(p => p.stock > 0);
    }
    return vehicleStock || [];
  }, [viewMode, allProducts, vehicleStock]);


  const renderInitialSearchView = () => (
    <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Process a Return</CardTitle>
          <CardDescription>Start by finding the customer and original sale.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="customer-search">Customer *</Label>
             <Popover open={openCustomerPopover} onOpenChange={setOpenCustomerPopover}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={openCustomerPopover} className="w-full justify-between" disabled={isLoading}>
                  <span className="truncate">{isLoading ? "Loading..." : currentCustomerLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command filter={(value, search) => customerOptions.find(opt => opt.value === value)?.label.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
                  <CommandInput placeholder="Search by name, shop, or phone..." />
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                       {customerOptions.map((option) => (
                        <CommandItem key={option.value} value={option.value} onSelect={() => { setSelectedCustomer(option.customerObject); setOpenCustomerPopover(false); }}>
                           <Check className={cn("mr-2 h-4 w-4", selectedCustomer?.id === option.value ? "opacity-100" : "opacity-0")} />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="saleId">Original Sale ID *</Label>
            <div className="flex gap-2">
               <Select value={selectedSaleId} onValueChange={setSelectedSaleId} disabled={!selectedCustomer || customerSales.length === 0}>
                <SelectTrigger id="saleId"><SelectValue placeholder={!selectedCustomer ? "Select customer first" : "Select a sale..."} /></SelectTrigger>
                <SelectContent>
                  {customerSales.map(sale => (<SelectItem key={sale.id} value={sale.id}>{sale.id} ({format(new Date(sale.saleDate), "PP")})</SelectItem>))}
                </SelectContent>
              </Select>
              <Button onClick={handleSearchSale} disabled={!selectedSaleId || isSearchingSale}>
                {isSearchingSale ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {selectedCustomer && customerSales.length === 0 && !isLoadingSales && (
              <p className="text-xs text-muted-foreground mt-1">No recent sales found for this customer.</p>
            )}
          </div>
        </CardContent>
    </Card>
  );

  const renderReturnProcessingView = () => (
    <>
        <Card className="lg:col-span-1">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Return Details</CardTitle>
                        <CardDescription>Specify what is being returned.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetSearch}><XCircle className="h-4 w-4"/></Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="text-sm space-y-1">
                    <p><strong>Customer:</strong> {selectedCustomer?.name}</p>
                    <p><strong>Original Sale ID:</strong> <span className="font-mono text-xs">{selectedSale?.id}</span></p>
                    <p><strong>Sale Date:</strong> {selectedSale ? format(new Date(selectedSale.saleDate), 'PPp') : ''}</p>
                    <p className={cn("font-semibold", (selectedSale?.outstandingBalance ?? 0) > 0 ? "text-destructive" : "text-green-600")}>
                        Bill Outstanding: {formatCurrency(selectedSale?.outstandingBalance || 0)}
                    </p>
                 </div>
                 <Separator/>
                <div className="space-y-2">
                    <Label>Items to Return</Label>
                    <ScrollArea className="h-60 rounded-md border p-2">
                        {itemsToReturn.length > 0 ? itemsToReturn.map(item => (
                            <div key={`${item.id}-${item.saleType}`} className="flex flex-col gap-2 text-sm p-2 bg-background rounded-md mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <p className="font-medium truncate">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">Purchased: {item.quantity} @ {formatCurrency(item.appliedPrice)}</p>
                                        <p className="text-xs text-blue-600 font-medium">Returnable: {item.maxReturnable}</p>
                                    </div>
                                    <Input 
                                        type="number" 
                                        className="w-20 h-8 text-center" 
                                        value={item.returnQuantity}
                                        onChange={e => handleReturnQuantityChange(item.id, item.saleType, e.target.value)}
                                        min={0}
                                        max={item.maxReturnable}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 pl-1">
                                    <Checkbox
                                        id={`resellable-${item.id}-${item.saleType}`}
                                        checked={item.isResellable}
                                        onCheckedChange={(checked) => handleResellableChange(item.id, item.saleType, !!checked)}
                                    />
                                    <Label htmlFor={`resellable-${item.id}-${item.saleType}`} className="text-xs font-normal">
                                        Return to stock (Resellable)
                                    </Label>
                                </div>
                            </div>
                        )) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                All items from this sale have been returned.
                            </div>
                        )}
                    </ScrollArea>
                </div>
                 <div className="pt-2 border-t text-right">
                    <p className="text-sm text-muted-foreground">Total Return Value</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(returnTotalValue)}</p>
                </div>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                 <CardTitle>Transaction Summary</CardTitle>
                 <CardDescription>Select exchange items and settle the final balance.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-20rem)] -mr-4 pr-4">
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="whitespace-nowrap">Exchange From</Label>
                        {!isCashier && (
                          <div className="flex items-center space-x-2 bg-muted p-1 rounded-md shrink-0">
                            <Switch
                                id="view-mode-toggle"
                                checked={viewMode === 'vehicle'}
                                onCheckedChange={(checked) => {
                                setViewMode(checked ? 'vehicle' : 'main');
                                setVehicleStock(null);
                                setSelectedVehicleIdForExchange(null);
                                }}
                                aria-label="Toggle View Mode"
                            />
                            <Label htmlFor="view-mode-toggle" className="flex items-center gap-1 text-sm font-medium px-2 cursor-pointer">
                                {viewMode === 'vehicle' ? <Truck className="h-4 w-4" /> : <Warehouse className="h-4 w-4" />}
                                {viewMode === 'vehicle' ? 'Vehicle' : 'Main'}
                            </Label>
                          </div>
                        )}
                      </div>
                      {viewMode === 'vehicle' && (
                          <Select 
                          value={selectedVehicleIdForExchange ?? ''} 
                          onValueChange={handleFetchVehicleStock} 
                          disabled={isVehicleStockLoading || isLoadingVehicles}
                          >
                          <SelectTrigger className="h-10 text-sm flex-1">
                              <SelectValue placeholder={isLoadingVehicles ? "Loading vehicles..." : "Select a vehicle"} />
                          </SelectTrigger>
                          <SelectContent>
                              {vehicles.map(v => (
                              <SelectItem key={v.id} value={v.id}>{v.vehicleNumber}</SelectItem>
                              ))}
                          </SelectContent>
                          </Select>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <Label className="whitespace-nowrap">Exchange Items</Label>
                       <div className="flex items-center space-x-2 bg-muted p-1 rounded-md shrink-0">
                          <Switch
                            id="exchange-sale-type-toggle"
                            checked={currentExchangeSaleType === 'wholesale'}
                            onCheckedChange={(checked) => setCurrentExchangeSaleType(checked ? 'wholesale' : 'retail')}
                            aria-label="Toggle exchange sale type"
                            className="data-[state=checked]:bg-blue-600"
                          />
                          <Label htmlFor="exchange-sale-type-toggle" className="flex items-center gap-1 text-sm font-medium px-2 cursor-pointer">
                            <Tag className="h-4 w-4" />
                            {currentExchangeSaleType === 'wholesale' ? 'Wholesale' : 'Retail'}
                          </Label>
                        </div>
                      <Popover open={openProductPopover} onOpenChange={setOpenProductPopover}>
                          <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start mt-1" disabled={viewMode === 'vehicle' && !selectedVehicleIdForExchange}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add product to exchange...
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                              <Command>
                                <CommandInput placeholder="Search products..." />
                                <CommandList>
                                  {isVehicleStockLoading ? <div className="text-center p-4 text-sm">Loading vehicle stock...</div> : (
                                    <>
                                      <CommandEmpty>No products found.</CommandEmpty>
                                      <CommandGroup>
                                          {availableProductsForExchange.map(product => (
                                              <CommandItem key={product.id} onSelect={() => handleAddToExchange(product)}>
                                                  <div className="flex justify-between w-full">
                                                    <span>{product.name}</span>
                                                    <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                                                  </div>
                                              </CommandItem>
                                          ))}
                                      </CommandGroup>
                                    </>
                                  )}
                                </CommandList>
                              </Command>
                          </PopoverContent>
                      </Popover>
                    </div>

                    {exchangeItems.length > 0 && (
                      <div className="p-2 space-y-2 rounded-md border">
                          {exchangeItems.map(item => (
                              <div key={`${item.id}-${item.saleType}`} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                  <div className="flex-1">
                                      <p className="text-sm font-medium">{item.name} {item.saleType === 'wholesale' && <span className="text-xs text-blue-600">(W)</span>}</p>
                                      <p className="text-xs text-muted-foreground">{formatCurrency(item.appliedPrice)}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateExchangeQuantity(item.id, item.saleType, item.quantity - 1)}>
                                          <MinusCircle className="h-4 w-4"/>
                                      </Button>
                                      <span>{item.quantity}</span>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateExchangeQuantity(item.id, item.saleType, item.quantity + 1)}>
                                          <PlusCircle className="h-4 w-4"/>
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveFromExchange(item.id, item.saleType)}>
                                          <Trash2 className="h-4 w-4"/>
                                      </Button>
                                  </div>
                                  <p className="w-20 text-right font-medium text-sm">{formatCurrency(item.quantity * item.appliedPrice)}</p>
                              </div>
                          ))}
                      </div>
                    )}
                </div>
                
                <Separator className="my-4"/>

                <div className="space-y-3">
                    <h3 className="text-base font-semibold">Financial Summary</h3>
                    <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Total Return Value:</span><span className="font-medium">{formatCurrency(returnTotalValue)}</span></div>

                    {selectedSale && selectedSale.outstandingBalance > 0 && (
                      <div className="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <Checkbox id="apply-credit" checked={applyCredit} onCheckedChange={(checked) => setApplyCredit(!!checked)} />
                        <Label htmlFor="apply-credit" className="text-sm font-normal text-blue-800">
                          Apply credit towards outstanding bill of {formatCurrency(selectedSale.outstandingBalance)}?
                        </Label>
                      </div>
                    )}
                    
                    {outstandingToSettle > 0 && <div className="flex justify-between items-center text-sm text-blue-600"><span className="text-muted-foreground pl-4">Outstanding Settled:</span><span className="font-medium">- {formatCurrency(outstandingToSettle)}</span></div>}
                    <Separator className="!my-1"/>
                    <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Net Credit:</span><span className="font-medium">{formatCurrency(netCreditAfterSettle)}</span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">New Items Total:</span><span className="font-medium">- {formatCurrency(exchangeItems.reduce((sum, item) => sum + item.quantity * item.appliedPrice, 0))}</span></div>
                    <Separator className="!my-1"/>
                    
                    <div className={cn("flex justify-between items-center font-bold text-lg", finalAmountDue > 0 ? "text-destructive" : "text-green-600")}>
                        <span>{finalAmountDue > 0 ? 'Amount to Pay:' : 'Refund to Customer:'}</span>
                        <span>{formatCurrency(finalAmountDue > 0 ? finalAmountDue : refundToCustomer)}</span>
                    </div>
                </div>

                {finalAmountDue > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2"><Wallet className="h-4 w-4"/>Settle Payment</h3>
                     <div>
                        <Label htmlFor="cashTendered" className="text-xs">Cash Paid (Rs.)</Label>
                        <Input id="cashTendered" type="number" value={cashTendered} onChange={(e) => setCashTendered(e.target.value)} placeholder="0.00" className="h-9 mt-1" min="0" step="0.01"/>
                    </div>
                     <div className="border p-2 rounded-md space-y-2 bg-muted/50">
                        <p className="text-xs font-medium">Cheque Payment (Optional)</p>
                        <Input type="number" value={chequeAmountPaid} onChange={(e) => setChequeAmountPaid(e.target.value)} placeholder="Cheque Amount" className="h-9 bg-background" />
                        <Input value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} placeholder="Cheque Number" className="h-9 bg-background" />
                    </div>
                    <div className="flex justify-between items-center font-semibold text-sm">
                      <span>Change Given:</span>
                      <span>{formatCurrency(changeGiven)}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                     <Button 
                        onClick={handleProcessExchange} 
                        disabled={isProcessing || (itemsToReturn.every(i => i.returnQuantity === 0) && exchangeItems.length === 0)}
                    >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                        {isProcessing ? 'Processing...' : 'Complete Transaction'}
                    </Button>
                </div>
              </ScrollArea>
            </CardContent>
        </Card>
    </>
  );
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        { selectedSale ? renderReturnProcessingView() : renderInitialSearchView() }
        {returnReceiptData && (
          <ReturnInvoiceDialog
            isOpen={isReceiptOpen}
            onOpenChange={(open) => {
              if (!open) {
                setIsReceiptOpen(false);
                setReturnReceiptData(null);
                resetSearch();
              } else {
                setIsReceiptOpen(open);
              }
            }}
            returnTransaction={returnReceiptData}
          />
        )}
    </div>
  );
}
