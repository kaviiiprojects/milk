
"use client";

import { MoreHorizontal, Edit, Trash2, PlusCircle, Users2, Search, PhoneCall, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Customer } from "@/lib/types";
import { CustomerDialog } from "./CustomerDialog";
import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCustomers } from "@/hooks/useCustomers"; // Import the hook
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase();

export function CustomerDataTable() {
  const { 
    customers, 
    isLoading: isLoadingCustomers, 
    error: customersError, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer,
    hasMore,
    loadMoreCustomers,
  } = useCustomers(true); // Use paginated fetching
  

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const userRole = currentUser?.role;

  // Granular permissions
  const canAddCustomers = userRole === 'admin' || userRole === 'cashier';
  const canEditCustomers = userRole === 'admin';
  const canDeleteCustomers = userRole === 'admin';
  const canActivateCustomers = userRole === 'admin' || userRole === 'cashier';
  
  // Determines if the "Actions" column or dropdown should be visible at all
  const canPerformAnyAction = canEditCustomers || canDeleteCustomers || canActivateCustomers;



  const handleOpenAddDialog = useCallback(() => {
    if (!canAddCustomers) return;
    setEditingCustomer(null);
    setIsCustomerDialogOpen(true);
  }, [canAddCustomers]);

  const handleOpenEditDialog = useCallback((customer: Customer) => {
    if (!canEditCustomers) return;
    setEditingCustomer(customer);
    setIsCustomerDialogOpen(true);
  }, [canEditCustomers]);

  const handleSaveCustomer = async (customerToSave: Customer) => {
    let result: Customer | null = null;
    let action: 'add' | 'update' | null = null;
    
    if (editingCustomer) { // Edit mode
      if (!canEditCustomers) {
        toast({ variant: "destructive", title: "Permission Denied" });
        return;
      }
      result = await updateCustomer(customerToSave.id, customerToSave);
      action = 'update';
    } else { // Add mode
      if (!canAddCustomers) {
        toast({ variant: "destructive", title: "Permission Denied" });
        return;
      }
      result = await addCustomer({
        name: customerToSave.name,
        phone: customerToSave.phone,
        address: customerToSave.address,
        shopName: customerToSave.shopName,
        status: customerToSave.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
       action = 'add';
    }

    if (result) {
      toast({
        title: action === 'add' ? "Customer Added" : "Customer Updated",
        description: `${customerToSave.name} has been successfully ${action === 'add' ? 'added' : 'updated'}.`,
      });
      setIsCustomerDialogOpen(false);
      setEditingCustomer(null);
    }
  };
  
  const handleActivateCustomer = async (customer: Customer) => {
    if (!canActivateCustomers) {
        toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to activate customers." });
        return;
    }
    const result = await updateCustomer(customer.id, { status: 'active' });
    if (result) {
        toast({
            title: "Customer Activated",
            description: `${customer.name} is now an active customer.`,
        });
    }
  };

  const openDeleteConfirmation = useCallback((customer: Customer) => {
    if (!canDeleteCustomers) return;
    setCustomerToDelete(customer);
    setIsDeleteAlertOpen(true);
  }, [canDeleteCustomers]);

  const handleDeleteConfirmed = async () => {
    if (!canDeleteCustomers || !customerToDelete) return;
    const customerName = customerToDelete.name;
    const success = await deleteCustomer(customerToDelete.id);
    if (success) {
      toast({
        title: "Customer Deleted",
        description: `${customerName} has been successfully deleted.`,
      });
    }
    setIsDeleteAlertOpen(false);
    setCustomerToDelete(null);
  };

  const handleCallCustomer = useCallback((customerName: string) => {
    toast({
      title: "Premium Feature Locked",
      description: `Direct calling ${customerName} is a Limidora premium feature. Please contact Limidora to enable this.`,
    });
  }, [toast]);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter(customer => customer.status === activeTab)
      .filter(customer => {
        const term = searchTerm.toLowerCase();
        return (
          customer.name.toLowerCase().includes(term) ||
          (customer.shopName && customer.shopName.toLowerCase().includes(term)) ||
          customer.phone.toLowerCase().includes(term)
        );
      });
  }, [customers, searchTerm, activeTab]);

  const isLoading = isLoadingCustomers && customers.length === 0;

  if (customersError) {
    return (
      <Card className="shadow-none border-0">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-2xl font-bold text-destructive">Error Loading Customers</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <p className="text-muted-foreground">
            Could not load customer data. Please try again later.
          </p>
          <p className="text-xs text-destructive mt-1">Details: {customersError}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <TooltipProvider>
      <Card className="shadow-none border-0">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'pending')}>
          <CardHeader className="p-4 sm:p-6 pb-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <TabsList>
                <TabsTrigger value="active">Active Customers</TabsTrigger>
                <TabsTrigger value="pending">Pending Customers</TabsTrigger>
              </TabsList>

              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    className="pl-9 h-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {canAddCustomers && (
                  <Button onClick={handleOpenAddDialog} className="h-10 gap-1">
                    <PlusCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Customer</span>
                    <span className="inline sm:hidden">Add</span>
                  </Button>
                )}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mt-4">{activeTab === 'active' ? 'Active' : 'Pending'} Customers</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin inline-block" /> : `${filteredCustomers.length} ${filteredCustomers.length === 1 ? 'customer' : 'customers'}`}
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 pt-0">
            <TabsContent value={activeTab} className="mt-0">
              <div className="md:hidden">
                <ScrollArea className="h-[calc(100vh-280px)] w-full rounded-lg">
                  {isLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-lg" /> 
                      ))}
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <Users2 className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">No {activeTab} customers found</p>
                      {searchTerm && <p className="text-sm">Try a different search term</p>}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredCustomers.map((customer) => (
                        <Card key={customer.id} className="hover:shadow-sm transition-shadow">
                          <div className="flex items-start p-4">
                            <Avatar className="h-10 w-10 mr-3">
                              {customer.avatar ? (
                                <AvatarImage src={customer.avatar} alt={customer.name} />
                              ) : (
                                <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{customer.name}</p>
                                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCallCustomer(customer.name)}>
                                        <PhoneCall className="h-4 w-4 text-green-600" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Call {customer.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  {canPerformAnyAction && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-40">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        {activeTab === 'pending' && canActivateCustomers && (
                                            <DropdownMenuItem onClick={() => handleActivateCustomer(customer)} className="text-green-600 focus:text-green-700">
                                                <CheckCircle className="mr-2 h-4 w-4" /> Activate
                                            </DropdownMenuItem>
                                        )}
                                        {canEditCustomers && (
                                            <DropdownMenuItem onClick={() => handleOpenEditDialog(customer)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                        )}
                                        {canDeleteCustomers && (
                                            <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => openDeleteConfirmation(customer)}
                                            >
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                              {customer.shopName && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                  {customer.shopName}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <div className="hidden md:block">
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[200px]">Customer</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Shop</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead className="w-[50px] text-center">Call</TableHead>
                        {canPerformAnyAction && <TableHead className="w-[50px] text-center">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        [...Array(5)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-8 mx-auto" /></TableCell>
                            {canPerformAnyAction && <TableCell><Skeleton className="h-6 w-8 mx-auto" /></TableCell>}
                          </TableRow>
                        ))
                      ) : filteredCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={canPerformAnyAction ? 6 : 5} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center text-muted-foreground py-8">
                              <Users2 className="w-12 h-12 mb-4 opacity-50" />
                              <p className="text-lg font-medium">No {activeTab} customers found</p>
                              {searchTerm && <p className="text-sm">Try a different search term</p>}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <TableRow key={customer.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  {customer.avatar ? (
                                    <AvatarImage src={customer.avatar} alt={customer.name} />
                                  ) : (
                                    <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                                  )}
                                </Avatar>
                                <span className="font-medium">{customer.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{customer.phone}</TableCell>
                            <TableCell>
                              {customer.shopName ? (
                                <Badge variant="outline">{customer.shopName}</Badge>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {customer.address || <span className="text-muted-foreground">N/A</span>}
                            </TableCell>
                            <TableCell className="text-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCallCustomer(customer.name)}>
                                    <PhoneCall className="h-4 w-4 text-green-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Call {customer.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            {canPerformAnyAction && (
                              <TableCell className="text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    {activeTab === 'pending' && canActivateCustomers && (
                                        <DropdownMenuItem onClick={() => handleActivateCustomer(customer)} className="text-green-600 focus:text-green-700">
                                            <CheckCircle className="mr-2 h-4 w-4" /> Activate
                                        </DropdownMenuItem>
                                    )}
                                    {canEditCustomers && (
                                        <DropdownMenuItem onClick={() => handleOpenEditDialog(customer)}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                    )}
                                    {canDeleteCustomers && (
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => openDeleteConfirmation(customer)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {hasMore && (
                <div className="text-center mt-6">
                  <Button
                    onClick={loadMoreCustomers}
                    disabled={isLoadingCustomers}
                    variant="outline"
                  >
                    {isLoadingCustomers ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Load More
                  </Button>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {isCustomerDialogOpen && (
        <CustomerDialog
          customer={editingCustomer}
          onSave={handleSaveCustomer}
          open={isCustomerDialogOpen}
          onOpenChange={setIsCustomerDialogOpen}
          isEditMode={!!editingCustomer}
          initialStatus={activeTab}
        />
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {customerToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAlertOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
