
"use client";

import * as React from "react";
import type { CartItem, Customer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MinusCircle, PlusCircle, Trash2, Users, Check, ChevronsUpDown, ShoppingCart, Loader2, AlertTriangle, Gift, CreditCard } from "lucide-react";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number' || isNaN(amount)) return 'Rs. 0.00';
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('LKR', 'Rs.');
};


interface CartViewProps {
  cartItems: CartItem[];
  selectedCustomer: Customer | null;
  customerOutstandingBalance?: number;
  customerCreditBalance?: number;
  onUpdateQuantity: (productId: string, quantity: number, saleType: 'retail' | 'wholesale') => void;
  onRemoveItem: (productId: string, saleType: 'retail' | 'wholesale', isOfferItem: boolean) => void;
  onSelectCustomer: (customer: Customer | null) => void;
  onCheckout: () => void;
  onCancelOrder: () => void;
  onUpdatePrice: (productId: string, saleType: 'retail' | 'wholesale', newPrice: number) => void;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  className?: string;
}

export function CartView({
  cartItems,
  selectedCustomer,
  customerOutstandingBalance,
  customerCreditBalance,
  onUpdateQuantity,
  onRemoveItem,
  onSelectCustomer,
  onCheckout,
  onCancelOrder,
  onUpdatePrice,
  subtotal,
  discountAmount,
  totalAmount,
  className
}: CartViewProps) {
  const [openCustomerPopover, setOpenCustomerPopover] = React.useState(false);
  const [customerSearch, setCustomerSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [searchedCustomers, setSearchedCustomers] = React.useState<Customer[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Debounce effect for customer search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(customerSearch);
    }, 400); // 400ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [customerSearch]);


  React.useEffect(() => {
    const searchCustomers = async () => {
      if (debouncedSearch.length < 2) {
        setSearchedCustomers([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await fetch(`/api/customers/search?q=${debouncedSearch}`);
        if (response.ok) {
          const data: Customer[] = await response.json();
          setSearchedCustomers(data);
        } else {
          setSearchedCustomers([]);
        }
      } catch (error) {
        console.error("Failed to search customers:", error);
        setSearchedCustomers([]);
      } finally {
        setIsSearching(false);
      }
    };
    
    searchCustomers();
  }, [debouncedSearch]);


  const getCustomerDisplayLabel = (customer: Customer | null): string => {
    if (!customer) return "Walk-in / Guest";
    if (customer.shopName) {
      return `${customer.shopName} (${customer.name})`;
    }
    return customer.name;
  };

  const currentCustomerLabel = getCustomerDisplayLabel(selectedCustomer);


  return (
    <Card className={cn("rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col h-full overflow-hidden", className)}>
      <CardHeader className="p-4 border-b">
        <CardTitle className="font-semibold tracking-tight font-headline text-lg">Current Order</CardTitle>
        <div className="flex items-center gap-2 pt-2">
          <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <Popover open={openCustomerPopover} onOpenChange={setOpenCustomerPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCustomerPopover}
                className="w-full justify-between flex-1 h-9 text-sm"
              >
                <span className="truncate">
                  {currentCustomerLabel || "Select Customer..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Search by name, shop, or phone..." 
                  className="h-9"
                  value={customerSearch}
                  onValueChange={setCustomerSearch}
                />
                <CommandList>
                  {isSearching && <div className="p-2 text-center text-sm text-muted-foreground">Searching...</div>}
                  <CommandEmpty>{!isSearching && "No customer found."}</CommandEmpty>
                  <CommandGroup>
                     <CommandItem
                        key="guest-customer"
                        value="Walk-in / Guest"
                        onSelect={() => {
                          onSelectCustomer(null);
                          setOpenCustomerPopover(false);
                        }}
                      >
                         <Check className={cn("mr-2 h-4 w-4", !selectedCustomer ? "opacity-100" : "opacity-0")}/>
                         Walk-in / Guest
                      </CommandItem>
                    {searchedCustomers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={getCustomerDisplayLabel(customer)}
                        onSelect={() => {
                          onSelectCustomer(customer);
                          setOpenCustomerPopover(false);
                          setCustomerSearch("");
                          setSearchedCustomers([]);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCustomer?.id === customer.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {getCustomerDisplayLabel(customer)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
         {selectedCustomer && (customerOutstandingBalance ?? 0) > 0 && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-50 p-2 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                <CreditCard className="h-5 w-5 flex-shrink-0" />
                <div className="text-sm">
                    <span className="font-semibold">Outstanding Balance:</span>
                    <span className="ml-1 font-bold">{formatCurrency(customerOutstandingBalance!)}</span>
                </div>
            </div>
        )}
         {selectedCustomer && (customerCreditBalance ?? 0) > 0 && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-50 p-2 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                <Gift className="h-5 w-5 flex-shrink-0" />
                <div className="text-sm">
                    <span className="font-semibold">Available Credit:</span>
                    <span className="ml-1 font-bold">{formatCurrency(customerCreditBalance!)}</span>
                </div>
            </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Add products from the list to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {cartItems.map((item, index) => (
                <div key={`${item.id}-${item.saleType}-${item.isOfferItem ? 'offer' : 'paid'}-${index}`} className="flex items-start p-3 gap-3">
                  <Image
                    src={item.imageUrl || "https://placehold.co/48x48.png"}
                    alt={item.name}
                    width={48}
                    height={48}
                    className="rounded-md aspect-square object-cover flex-shrink-0 mt-0.5"
                    data-ai-hint={`${item.category.toLowerCase()} product`}
                  />
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium truncate" title={item.name}>
                        {item.name}
                        {item.isOfferItem && <Gift className="inline-block h-4 w-4 ml-1 text-green-600" />}
                        {item.saleType === 'wholesale' && !item.isOfferItem && <span className="text-blue-500 ml-1 font-semibold">(W)</span>}
                      </p>
                      
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full -mr-1 -mt-0.5 flex-shrink-0" onClick={() => onRemoveItem(item.id, item.saleType, item.isOfferItem || false)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove {item.name}</span>
                        </Button>
                      
                    </div>

                    {!item.isOfferItem ? (
                      <div className="flex items-center justify-between mt-1.5 gap-2">
                        <div className="flex items-center space-x-1.5">
                           <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1, item.saleType)}
                            disabled={item.quantity <= 1}
                          >
                            <MinusCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1, item.saleType)}
                            className="h-7 w-10 text-center px-1 text-sm"
                            min="1"
                            aria-label={`Quantity for ${item.name}`}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1, item.saleType)}
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-muted-foreground mr-1 text-xs">@</span>
                          <Input
                            type="number"
                            value={item.appliedPrice}
                            onChange={(e) => onUpdatePrice(item.id, item.saleType, parseFloat(e.target.value) || 0)}
                            className="h-7 w-[70px] text-right text-sm font-medium p-1"
                            step="0.01"
                            min="0"
                            aria-label={`Price for ${item.name}`}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1.5">Free Item (Qty: {item.quantity})</p>
                    )}
                     <p className="text-sm font-semibold text-right mt-1">
                        {item.isOfferItem ? <span className="text-green-600">Rs. 0.00</span> : `Rs. ${(item.appliedPrice * item.quantity).toFixed(2)}`}
                      </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      {cartItems.length > 0 && (
        <CardFooter className="flex flex-col gap-2.5 p-4 border-t">
          <div className="w-full flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>
           {discountAmount > 0 && (
             <div className="w-full flex justify-between items-center text-sm text-destructive">
                <span>Total Discount:</span>
                <span>- Rs. {discountAmount.toFixed(2)}</span>
              </div>
           )}
          <Separator className="my-1" />
          <div className="w-full flex justify-between text-base font-bold">
            <span>Total:</span>
            <span>Rs. {totalAmount.toFixed(2)}</span>
          </div>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5">
            <Button
              variant="outline"
              size="lg" 
              className="py-2.5"
              onClick={onCancelOrder}
            >
              Cancel Order
            </Button>
            <Button
              size="lg" 
              className="py-2.5"
              onClick={onCheckout}
              disabled={cartItems.filter(item => !item.isOfferItem).length === 0}
            >
              Checkout
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
