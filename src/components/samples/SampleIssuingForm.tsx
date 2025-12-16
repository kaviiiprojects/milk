
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown, PackageSearch, Loader2, Trash2, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { Product, StockTransaction, Customer, Vehicle } from "@/lib/types";
import { useProducts } from "@/hooks/useProducts";
import { useVehicles } from "@/hooks/useVehicles";
import { useCustomers } from "@/hooks/useCustomers";
import { useVehicleStock } from "@/hooks/useVehicleStock";
import { Input } from "../ui/input";

interface SampleItem {
  product: Product;
  quantity: number | string;
}

const getCustomerDisplayLabel = (customer: Customer | null): string => {
    if (!customer) return "Select customer...";
    if (customer.shopName) {
      return `${customer.shopName} (${customer.name})`;
    }
    return customer.name;
};

export function SampleIssuingForm() {
  const { products: allProducts, isLoading: isLoadingProducts, refetch: refetchProducts } = useProducts();
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const { currentUser } = useAuth();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");
  
  const [sampleItems, setSampleItems] = useState<SampleItem[]>([]);
  
  const [productSearchPopoverOpen, setProductSearchPopoverOpen] = useState(false);
  const [customerPopoverOpen, setCustomerPopoverOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { vehicleStock, isLoading: isVehicleStockLoading, refetch: refetchVehicleStock } = useVehicleStock(
    selectedVehicleId,
    !!selectedVehicleId
  );

  const selectableCustomers = useMemo(() => customers.filter(c => c.status === 'pending' || c.status === 'active'), [customers]);
  
  // Clear sample items when vehicle changes
  useEffect(() => {
    if (selectedVehicleId) {
      setSampleItems([]);
    }
  }, [selectedVehicleId]);


  const handleAddProductToSamples = (product: Product) => {
    if (!sampleItems.some(item => item.product.id === product.id)) {
      setSampleItems(prev => [...prev, { product, quantity: "" }]);
    }
    setProductSearchPopoverOpen(false);
  };

  const handleRemoveProduct = (productId: string) => {
    setSampleItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleSampleQuantityChange = (productId: string, quantity: string) => {
    const numQuantity = quantity === "" ? "" : Number(quantity);
    setSampleItems(prev => 
      prev.map(item => 
        item.product.id === productId ? { ...item, quantity: numQuantity } : item
      )
    );
  };

  const resetForm = () => {
    setSampleItems([]);
    setNotes("");
    setSelectedVehicleId(undefined);
    setSelectedCustomerId(undefined);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!selectedVehicleId || !selectedCustomerId) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please select a customer and a vehicle." });
      setIsSubmitting(false);
      return;
    }
    if (sampleItems.length === 0) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please add at least one sample item." });
      setIsSubmitting(false);
      return;
    }

    for (const item of sampleItems) {
      const quantityToIssue = Number(item.quantity);
      if (quantityToIssue <= 0) {
        toast({ variant: "destructive", title: "Invalid Quantity", description: `Please enter a valid quantity for ${item.product.name}.` });
        setIsSubmitting(false);
        return;
      }
      const stockInVehicle = vehicleStock?.get(item.product.id) || 0;
      if (quantityToIssue > stockInVehicle) {
        toast({
          variant: "destructive",
          title: "Insufficient Stock in Vehicle",
          description: `Cannot issue ${quantityToIssue} of ${item.product.name}. Only ${stockInVehicle} available.`,
        });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const customerName = customers.find(c => c.id === selectedCustomerId)?.name || 'Unknown Customer';
      const fullNotes = `Sample for ${customerName}.${notes ? `\nNotes: ${notes}` : ''}`;
      
      for (const item of sampleItems) {
        const product = item.product;
        const quantity = Number(item.quantity);
        
        const transactionData: Omit<StockTransaction, 'id'> = {
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            type: 'ISSUE_SAMPLE',
            quantity: quantity,
            previousStock: product.stock, // Main inventory is unchanged
            newStock: product.stock,      // Main inventory is unchanged
            transactionDate: new Date(),
            notes: fullNotes,
            vehicleId: selectedVehicleId,
            userId: currentUser?.username || 'system',
        };

        await fetch('/api/stock-transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData),
        });
      }

      toast({
        title: "Success",
        description: `Samples issued successfully for ${sampleItems.length} product(s).`,
      });
      
      resetForm();
      // Refetch vehicle stock immediately after issuing samples
      if (selectedVehicleId) {
        await refetchVehicleStock();
      }

    } catch (error) {
      console.error("Error issuing samples:", error);
      toast({
        title: "Error",
        description: "Failed to issue samples. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableProductsForSelection = useMemo(() => {
    if (!vehicleStock || !allProducts) return [];
    return allProducts.filter(p => (vehicleStock.get(p.id) || 0) > 0);
  }, [vehicleStock, allProducts]);

  const isLoading = isLoadingCustomers || isLoadingVehicles;
  
  if (isLoading && !customers.length && !vehicles.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <Card className="shadow-xl border-0">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Issue Samples</CardTitle>
        <CardDescription>
          Record product samples issued to customers from a vehicle.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="customer">Customer *</Label>
              <Popover open={customerPopoverOpen} onOpenChange={setCustomerPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="customer"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between h-11"
                    disabled={isLoadingCustomers}
                  >
                    <span className="truncate">
                      {getCustomerDisplayLabel(selectableCustomers.find(c => c.id === selectedCustomerId) || null)}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search customers..." />
                    <CommandList>
                      <CommandEmpty>No customers found.</CommandEmpty>
                      <CommandGroup>
                        {selectableCustomers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={getCustomerDisplayLabel(customer)}
                            onSelect={() => { setSelectedCustomerId(customer.id); setCustomerPopoverOpen(false); }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedCustomerId === customer.id ? "opacity-100" : "opacity-0")} />
                            {getCustomerDisplayLabel(customer)}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle">Source Vehicle *</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId} disabled={isLoadingVehicles}>
                <SelectTrigger id="vehicle" className="h-11">
                  <SelectValue placeholder={isLoadingVehicles ? "Loading..." : "Select vehicle"} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.vehicleNumber}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Card className="border-dashed">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-lg font-medium">Sample Items</CardTitle>
              <CardDescription className="text-xs">Add products available in the selected vehicle.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <Popover open={productSearchPopoverOpen} onOpenChange={setProductSearchPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-11 text-muted-foreground hover:text-foreground" disabled={!selectedVehicleId || isVehicleStockLoading}>
                    {isVehicleStockLoading ? "Loading vehicle stock..." : "Search product to add..."}
                    <PackageSearch className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search product by name or SKU..." />
                    <CommandList>
                      <CommandEmpty>No product found in vehicle.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-[200px]">
                          {availableProductsForSelection.map((product) => (
                            <CommandItem key={product.id} value={product.name} onSelect={() => handleAddProductToSamples(product)}>
                              <div className="flex justify-between w-full items-center">
                                <span>{product.name}</span>
                                <Badge variant="outline">Stock: {vehicleStock?.get(product.id) || 0}</Badge>
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {sampleItems.length > 0 ? (
                <ScrollArea className="max-h-[300px] mt-2 pr-3">
                  <div className="space-y-3">
                    {sampleItems.map(item => (
                      <Card key={item.product.id} className="p-3 bg-muted/20 relative group">
                        <div className="flex flex-col sm:flex-row gap-3 items-start">
                          <div className="flex-grow">
                            <p className="font-medium text-sm">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">Vehicle Stock: {vehicleStock?.get(item.product.id) || 0}</p>
                          </div>
                          <div className="w-full sm:w-32 shrink-0">
                            <Label htmlFor={`quantity-${item.product.id}`} className="sr-only">Quantity</Label>
                            <Input id={`quantity-${item.product.id}`} type="number" value={item.quantity} onChange={(e) => handleSampleQuantityChange(item.product.id, e.target.value)} placeholder="Qty" min="1" required className="h-9" />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100" onClick={() => handleRemoveProduct(item.product.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sample items added yet.
                </p>
              )}
            </CardContent>
          </Card>
          
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g., For promotional event at..." />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
              Clear
            </Button>
            <Button type="submit" disabled={isSubmitting || sampleItems.length === 0}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : <><ArrowRight className="mr-2 h-4 w-4" />Issue Samples</>}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
