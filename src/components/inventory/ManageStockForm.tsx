
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, PlusCircle, Trash2, ChevronsUpDown, PackageSearch, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductService } from "@/lib/productService";
import { useAuth } from "@/contexts/AuthContext";
import type { Product, StockTransaction, StockTransactionType, Vehicle } from "@/lib/types";
import { useProducts } from "@/hooks/useProducts";
import { useVehicles } from "@/hooks/useVehicles";
import { useVehicleStock } from "@/hooks/useVehicleStock";

interface TransactionItem {
  product: Product;
  quantity: number | string;
}

export function ManageStockForm() {
  const { products: allProducts, isLoading: isLoadingProducts, refetch: refetchProducts } = useProducts();
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();
  const { currentUser } = useAuth();
  
  const [transactionType, setTransactionType] = useState<StockTransactionType>("ADD_STOCK_INVENTORY");
  const [transactionDate, setTransactionDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);
  const [startMeter, setStartMeter] = useState<string>("");
  const [endMeter, setEndMeter] = useState<string>("");
  
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
  
  const [productSearchPopoverOpen, setProductSearchPopoverOpen] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { vehicleStock, isLoading: isVehicleStockLoading, refetch: refetchVehicleStock } = useVehicleStock(
    selectedVehicleId,
    transactionType === 'UNLOAD_FROM_VEHICLE' || transactionType === 'LOAD_TO_VEHICLE'
  );

  useEffect(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - (offset * 60000));
    setTransactionDate(localDate.toISOString().slice(0, 16));
  }, []);
  
  useEffect(() => {
    // Reset meter readings when transaction type changes
    setStartMeter("");
    setEndMeter("");
  }, [transactionType]);


  const handleAddProductToTransaction = (productId: string) => {
    const productToAdd = allProducts.find(p => p.id === productId);
    if (productToAdd && !transactionItems.some(item => item.product.id === productId)) {
      setTransactionItems(prev => [...prev, { product: productToAdd, quantity: "" }]);
    }
    setProductSearchPopoverOpen(false);
    setProductSearchValue("");
  };

  const handleRemoveProductFromTransaction = (productId: string) => {
    setTransactionItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleTransactionItemQuantityChange = (productId: string, quantity: string) => {
    const numQuantity = quantity === "" ? "" : Number(quantity);
    setTransactionItems(prev => 
      prev.map(item => 
        item.product.id === productId ? { ...item, quantity: numQuantity } : item
      )
    );
  };

  const resetForm = () => {
    setTransactionItems([]);
    setNotes("");
    setSelectedVehicleId(undefined);
    setStartMeter("");
    setEndMeter("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (transactionItems.length === 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please add at least one product to the transaction." });
      setIsSubmitting(false);
      return;
    }

    if ((transactionType === "LOAD_TO_VEHICLE" || transactionType === "UNLOAD_FROM_VEHICLE") && !selectedVehicleId) {
      toast({ variant: "destructive", title: "Validation Error", description: "Vehicle is required for vehicle load/unload transactions." });
      setIsSubmitting(false);
      return;
    }

    if (transactionType === 'UNLOAD_FROM_VEHICLE' && vehicleStock) {
        for (const item of transactionItems) {
            const stockInVehicle = vehicleStock.get(item.product.id) || 0;
            const quantityToUnload = Number(item.quantity);
            if (quantityToUnload <= 0) {
                toast({
                    variant: "destructive",
                    title: "Invalid Quantity",
                    description: `Please enter a valid quantity greater than 0 for ${item.product.name}.`,
                });
                setIsSubmitting(false);
                return;
            }
            if (quantityToUnload > stockInVehicle) {
                toast({
                    variant: "destructive",
                    title: "Insufficient Stock in Vehicle",
                    description: `Cannot unload ${quantityToUnload} of ${item.product.name}. Only ${stockInVehicle} available in the selected vehicle.`,
                });
                setIsSubmitting(false);
                return;
            }
        }
    }


    for (const item of transactionItems) {
      if (item.quantity === "" || Number(item.quantity) <= 0) {
        toast({ variant: "destructive", title: "Validation Error", description: `Please enter a valid quantity for ${item.product.name}.` });
        setIsSubmitting(false);
        return;
      }
      
      const isStockRemoval = ["LOAD_TO_VEHICLE", "REMOVE_STOCK_WASTAGE", "STOCK_ADJUSTMENT_MANUAL"].includes(transactionType);
      if (isStockRemoval && item.product.stock < Number(item.quantity)) {
        toast({ 
          variant: "destructive", 
          title: "Stock Error", 
          description: `Not enough stock for ${item.product.name}. Available: ${item.product.stock}, Trying to transact: ${item.quantity}.` 
        });
        setIsSubmitting(false);
        return;
      }
    }

    try {
        for (const item of transactionItems) {
            const product = item.product;
            const quantity = Number(item.quantity);
            const previousStock = product.stock;
            let newStock = previousStock;
            
            const baseTransactionData = {
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                quantity: quantity,
                transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
                notes: notes || undefined,
                userId: currentUser?.username || 'system',
            };

            if (transactionType === "UNLOAD_FROM_VEHICLE") {
                // First, record the UNLOAD from vehicle (no change to main stock)
                await fetch('/api/stock-transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                    ...baseTransactionData,
                    type: 'UNLOAD_FROM_VEHICLE',
                    previousStock: previousStock,
                    newStock: previousStock, 
                    vehicleId: selectedVehicleId,
                    endMeter: endMeter ? Number(endMeter) : undefined,
                    })
                });

                // Then, record the ADD to main inventory and update the product
                newStock = previousStock + quantity;
                await fetch('/api/stock-transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                    ...baseTransactionData,
                    type: 'ADD_STOCK_INVENTORY',
                    previousStock: previousStock,
                    newStock: newStock,
                    notes: `Unloaded from vehicle ${selectedVehicleId}`
                    })
                });
                await ProductService.updateProduct(product.id, { stock: newStock });
                // Refetch vehicle stock immediately after unload
                if (selectedVehicleId) {
                  await refetchVehicleStock();
                }

            } else { // Handle all other transaction types
                switch (transactionType) {
                    case "ADD_STOCK_INVENTORY":
                        newStock += quantity;
                        break;
                    case "LOAD_TO_VEHICLE":
                    case "REMOVE_STOCK_WASTAGE":
                    case "STOCK_ADJUSTMENT_MANUAL":
                        newStock -= quantity;
                        break;
                }
                
                await fetch('/api/stock-transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                    ...baseTransactionData,
                    type: transactionType,
                    previousStock: previousStock,
                    newStock: newStock,
                    vehicleId: (transactionType === 'LOAD_TO_VEHICLE') ? selectedVehicleId : undefined,
                    startMeter: transactionType === 'LOAD_TO_VEHICLE' && startMeter ? Number(startMeter) : undefined,
                    })
                });
                await ProductService.updateProduct(product.id, { stock: newStock });
                // Refetch vehicle stock immediately after vehicle transactions
                if (transactionType === 'LOAD_TO_VEHICLE' && selectedVehicleId) {
                  await refetchVehicleStock();
                }
            }
        }

        toast({
            title: "Success",
            description: `Stock transaction recorded for ${transactionItems.length} product(s)`,
        });
        
        resetForm();
        await refetchProducts();
        // Refetch vehicle stock after successful transaction
        if (selectedVehicleId && (transactionType === 'LOAD_TO_VEHICLE' || transactionType === 'UNLOAD_FROM_VEHICLE')) {
          await refetchVehicleStock();
        }

    } catch (error) {
        console.error("Error updating stock:", error);
        toast({
            title: "Error",
            description: "Failed to update stock. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };


  const transactionTypes: { value: StockTransactionType; label: string }[] = [
    { value: "ADD_STOCK_INVENTORY", label: "Add Stock to Inventory" },
    { value: "LOAD_TO_VEHICLE", label: "Load Stock to Vehicle" },
    { value: "UNLOAD_FROM_VEHICLE", label: "Unload Stock from Vehicle" },
    { value: "REMOVE_STOCK_WASTAGE", label: "Remove Stock (Wastage)" },
    { value: "STOCK_ADJUSTMENT_MANUAL", label: "Manual Stock Adjustment" },
  ];

  const availableProductsForSelection = allProducts.filter(
    p => !transactionItems.some(item => item.product.id === p.id)
  );

  if (isLoadingProducts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 px-6 py-5 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Manage Stock Transactions</CardTitle>
            <CardDescription className="mt-1">
              Record stock movements and adjustments for multiple products.
            </CardDescription>
          </div>
          <Badge variant="outline" className="hidden sm:flex">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="transactionType">Transaction Type *</Label>
              <Select 
                value={transactionType} 
                onValueChange={(value) => setTransactionType(value as StockTransactionType)}
              >
                <SelectTrigger id="transactionType" className="h-11">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value} className="text-sm">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="transactionDate">Date & Time *</Label>
              <Input 
                id="transactionDate" 
                type="datetime-local" 
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="h-11" 
                required
              />
            </div>

            {(transactionType === "LOAD_TO_VEHICLE" || transactionType === "UNLOAD_FROM_VEHICLE") && (
              <div className="space-y-1.5">
                <Label htmlFor="selectedVehicleId">Select Vehicle *</Label>
                <Select 
                  value={selectedVehicleId} 
                  onValueChange={setSelectedVehicleId}
                  disabled={isLoadingVehicles}
                >
                  <SelectTrigger id="selectedVehicleId" className="h-11">
                    <SelectValue placeholder={isLoadingVehicles ? "Loading vehicles..." : "Choose vehicle"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.length > 0 ? (
                      vehicles.map(vehicle => (
                        <SelectItem key={vehicle.id} value={vehicle.id} className="text-sm">
                          {vehicle.vehicleNumber} {vehicle.driverName ? `(${vehicle.driverName})` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      !isLoadingVehicles && <div className="p-2 text-center text-sm text-muted-foreground">No vehicles found.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
             {(transactionType === "LOAD_TO_VEHICLE") && (
              <div className="space-y-1.5">
                <Label htmlFor="startMeter">Start Meter (km)</Label>
                <Input
                  id="startMeter"
                  type="number"
                  value={startMeter}
                  onChange={(e) => setStartMeter(e.target.value)}
                  className="h-11"
                  placeholder="Enter starting vehicle mileage"
                  min="0"
                />
              </div>
            )}
            {(transactionType === "UNLOAD_FROM_VEHICLE") && (
              <div className="space-y-1.5">
                <Label htmlFor="endMeter">End Meter (km)</Label>
                <Input
                  id="endMeter"
                  type="number"
                  value={endMeter}
                  onChange={(e) => setEndMeter(e.target.value)}
                  className="h-11"
                  placeholder="Enter ending vehicle mileage"
                  min={startMeter || "0"}
                />
              </div>
            )}
          </div>

          <Card className="border-dashed border-muted-foreground/30">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-lg font-medium">Products for Transaction</CardTitle>
              <CardDescription className="text-xs">Add products and specify quantities.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <Popover open={productSearchPopoverOpen} onOpenChange={setProductSearchPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productSearchPopoverOpen}
                    className="w-full justify-between h-11 text-muted-foreground hover:text-foreground"
                  >
                    {productSearchValue || "Search and add product..."}
                    <PackageSearch className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command
                    filter={(value, search) => {
                      const product = allProducts.find(p => p.id === value);
                      if (!product) return 0;
                      const nameMatch = product.name.toLowerCase().includes(search.toLowerCase());
                      const skuMatch = product.sku?.toLowerCase().includes(search.toLowerCase());
                      return (nameMatch || skuMatch) ? 1 : 0;
                    }}
                  >
                    <CommandInput placeholder="Search product by name or SKU..." />
                    <CommandList>
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandGroup heading="Available Products">
                        <ScrollArea className="h-[200px]">
                          {availableProductsForSelection.map((product) => (
                            <CommandItem
                              key={product.id}
                              value={product.id}
                              onSelect={() => handleAddProductToTransaction(product.id)}
                              className="cursor-pointer"
                            >
                              <div className="flex justify-between w-full items-center">
                                <div>
                                  {product.name}
                                  {product.sku && <span className="text-xs text-muted-foreground ml-2">({product.sku})</span>}
                                </div>
                                <Badge variant="outline" className="text-xs">Stock: {product.stock}</Badge>
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {transactionItems.length > 0 ? (
                <ScrollArea className="max-h-[300px] mt-2 pr-3 overflow-auto">
                  <div className="space-y-3">
                    {transactionItems.map((item) => (
                      <Card key={item.product.id} className="p-3 bg-muted/20 relative group">
                        <div className="flex flex-col sm:flex-row gap-3 items-start">
                          <div className="flex-grow">
                            <p className="font-medium text-sm">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">
                                SKU: {item.product.sku || 'N/A'} | Main Stock: {item.product.stock}
                                {transactionType === 'UNLOAD_FROM_VEHICLE' && vehicleStock && (
                                    <span className="font-semibold text-blue-600 ml-2">
                                        | Vehicle Stock: {isVehicleStockLoading ? '...' : (vehicleStock.get(item.product.id) || 0)}
                                    </span>
                                )}
                            </p>
                          </div>
                          <div className="w-full sm:w-32 shrink-0">
                            <Label htmlFor={`quantity-${item.product.id}`} className="sr-only">Quantity</Label>
                            <Input
                              id={`quantity-${item.product.id}`}
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleTransactionItemQuantityChange(item.product.id, e.target.value)}
                              placeholder="Qty"
                              min="1"
                              required
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100"
                          onClick={() => handleRemoveProductFromTransaction(item.product.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No products added to this transaction yet.
                </p>
              )}
            </CardContent>
          </Card>
          
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              className="min-h-[80px]" 
              placeholder="Additional information about this transaction..."
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2 border-t border-border/50">
            <Button 
              type="button" 
              variant="outline" 
              onClick={resetForm}
              disabled={isSubmitting}
              className="h-11"
            >
              Clear Form
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || transactionItems.length === 0}
              className="min-w-[200px] h-11"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : "Record Transactions"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
