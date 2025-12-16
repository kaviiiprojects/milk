
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Expense } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { AccessDenied } from "@/components/AccessDenied";
import { PlusCircle, Wallet, Loader2, Trash2, Truck, UserCircle, Search } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useVehicles } from "@/hooks/useVehicles";
import { format } from "date-fns";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount).replace("LKR", "Rs.");

export default function ExpensesPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { expenses, setExpenses, isLoading: isLoadingExpenses, addExpense, deleteExpense, fetchExpenses } = useExpenses();
  const { vehicles, isLoading: isLoadingVehicles } = useVehicles();
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [category, setCategory] = useState("Fuel");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const canAccessPage = currentUser?.role === 'admin' || currentUser?.role === 'cashier';

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (!canAccessPage) {
      router.replace("/app/dashboard");
    }
  }, [currentUser, router, canAccessPage]);

  const handleFetchExpenses = () => {
    if (!dateRange || !dateRange.from) {
      toast({ variant: "destructive", title: "Date Range Required", description: "Please select a date range to view expenses." });
      return;
    }
    fetchExpenses(dateRange);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = category === "Other" ? customCategory.trim() : category;
    const numericAmount = parseFloat(amount);

    if (!finalCategory) {
      toast({ variant: "destructive", title: "Error", description: "Category is required." });
      return;
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a valid positive amount." });
      return;
    }

    setIsSubmitting(true);
    const newExpenseData: Omit<Expense, 'id'> = {
      category: finalCategory,
      amount: numericAmount,
      expenseDate: new Date(),
      description: finalCategory,
      staffId: currentUser?.username,
      vehicleId: selectedVehicleId && selectedVehicleId !== "none" ? selectedVehicleId : undefined,
    };

    const newExpense = await addExpense(newExpenseData);
    if (newExpense) {
      setCategory("Fuel");
      setCustomCategory("");
      setAmount("");
      setSelectedVehicleId("");
      // Add to local state if it's within the currently displayed range
      if (dateRange?.from) {
        const from = dateRange.from;
        const to = dateRange.to || from;
        const expenseDate = new Date(newExpense.expenseDate);
        if (expenseDate >= from && expenseDate <= to) {
            setExpenses(prev => [newExpense, ...prev].sort((a,b) => b.expenseDate.getTime() - a.expenseDate.getTime()));
        }
      }
    }
    setIsSubmitting(false);
  };

  const handleDelete = (expense: Expense) => {
    if (currentUser?.role !== 'admin') {
      toast({ variant: "destructive", title: "Permission Denied", description: "Only admins can delete expenses." });
      return;
    }
    setExpenseToDelete(expense);
  };

  const confirmDelete = async () => {
    if (expenseToDelete) {
      await deleteExpense(expenseToDelete.id);
      // The hook now optimistically updates, so no need to call setExpenses here
      setExpenseToDelete(null);
    }
  };

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const isLoading = isLoadingVehicles; // Only vehicles loading blocks the form initially
  const vehicleMap = useMemo(() => new Map(vehicles.map(v => [v.id, v.vehicleNumber])), [vehicles]);


  if (!currentUser) return <GlobalPreloaderScreen message="Loading expenses page..." />;
  if (!canAccessPage) return <AccessDenied message="You do not have permission to access this page." />;

  return (
    <>
      <PageHeader
        title="Manage Expenses"
        description="Log business expenses to accurately track net revenue."
        icon={Wallet}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Add New Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fuel">Fuel</SelectItem>
                    <SelectItem value="Foods">Foods</SelectItem>
                    <SelectItem value="Other">Other (Specify)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {category === "Other" && (
                <div>
                  <Label htmlFor="customCategory">Custom Category</Label>
                  <Input
                    id="customCategory"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g., Vehicle Repair"
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="amount">Amount (Rs.)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="vehicle">Vehicle (Optional)</Label>
                <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId} disabled={isLoadingVehicles}>
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.vehicleNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Expense
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <CardTitle className="font-headline">Expense History</CardTitle>
                    <CardDescription>
                      Total For Period:{" "}
                      <span className="font-bold text-primary">{formatCurrency(totalExpenses)}</span>
                    </CardDescription>
                </div>
                <div className="flex gap-2 items-center w-full sm:w-auto">
                    <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} className="flex-grow"/>
                    <Button onClick={handleFetchExpenses} disabled={isLoadingExpenses} className="h-10">
                        {isLoadingExpenses ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                        <span className="sr-only sm:not-sr-only sm:ml-2">View</span>
                    </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-27rem)]">
              {isLoadingExpenses ? (
                <div className="flex justify-center items-center h-48">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : expenses.length === 0 ? (
                 <div className="text-center py-10 text-muted-foreground">
                    <p>No expenses found for the selected period.</p>
                    <p className="text-sm">Select a date range and click "View".</p>
                </div>
              ) : isMobile ? (
                  <div className="space-y-2">
                    {expenses.map(expense => (
                      <Card key={expense.id} className="p-3">
                         <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium capitalize">{expense.category}</p>
                                <p className="text-xs text-muted-foreground">{format(expense.expenseDate, "PP")}</p>
                                {expense.vehicleId && (
                                  <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-1">
                                    <Truck className="h-3 w-3"/>
                                    {vehicleMap.get(expense.vehicleId) || expense.vehicleId}
                                  </p>
                                )}
                                {expense.staffId && (
                                    <p className="text-xs text-purple-600 font-medium flex items-center gap-1 mt-1">
                                        <UserCircle className="h-3 w-3"/>
                                        {expense.staffName || expense.staffId}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                                {currentUser?.role === 'admin' && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(expense)}>
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                            </div>
                         </div>
                      </Card>
                    ))}
                  </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {currentUser?.role === 'admin' && <TableHead className="text-center">Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{format(expense.expenseDate, "yyyy-MM-dd")}</TableCell>
                        <TableCell className="capitalize">{expense.category}</TableCell>
                        <TableCell>
                            {expense.staffId ? (
                                <span className="flex items-center gap-1 text-sm">
                                    <UserCircle className="h-3.5 w-3.5 text-muted-foreground"/>
                                    {expense.staffName || expense.staffId}
                                </span>
                            ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {expense.vehicleId ? (
                            <span className="flex items-center gap-1 text-sm">
                              <Truck className="h-3.5 w-3.5 text-muted-foreground"/>
                              {vehicleMap.get(expense.vehicleId) || expense.vehicleId}
                            </span>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                        {currentUser?.role === 'admin' && (
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(expense)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the expense of {expenseToDelete ? formatCurrency(expenseToDelete.amount) : ''} for "{expenseToDelete?.category}". This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
