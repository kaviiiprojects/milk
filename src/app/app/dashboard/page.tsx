
"use client";

import { Banknote, Users, TrendingUp, Activity, AlertTriangle, Loader2, ShoppingBag, BarChart2, Package, type LucideIcon, Wallet, Beaker } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { AlertQuantityTable } from "@/components/dashboard/AlertQuantityTable";
import type { Sale, ReturnTransaction, SalesChartData } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { useCustomers } from "@/hooks/useCustomers";
import { useSalesData } from "@/hooks/useSalesData";
import { useProducts } from "@/hooks/useProducts";
import { useReturns } from "@/hooks/useReturns";
import { useExpenses } from "@/hooks/useExpenses";
import { useStockTransactions } from "@/hooks/useStockTransactions";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isSameDay, addDays } from "date-fns";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  
  const { customers, isLoading: isLoadingCustomers, error: customersError } = useCustomers(false);
  
  const { 
    sales: allSales, 
    isLoading: isLoadingAllSales, 
    error: allSalesError,
    totalRevenue: totalRevenueAllTime
  } = useSalesData(true);

  const { 
    products: allProducts, 
    isLoading: isLoadingProducts, 
    error: productsError 
  } = useProducts();
  const { returns, isLoading: isLoadingReturns, error: returnsError } = useReturns(true);
  const { expenses, isLoading: isLoadingExpenses, error: expensesError } = useExpenses();
  const { transactions: stockTransactions, isLoading: isLoadingStock, error: stockError } = useStockTransactions(true);
  
  const [monthlySalesData, setMonthlySalesData] = useState<SalesChartData[]>(MONTH_NAMES.map(name => ({ name, sales: 0 })));
  const [monthlyComparison, setMonthlyComparison] = useState<number[]>(Array(12).fill(0));

  useEffect(() => {
    try {
      const cachedChartData = localStorage.getItem("dashboardChartData");
      if (cachedChartData) {
        const { salesData, comparisonData } = JSON.parse(cachedChartData);
        if (salesData && comparisonData) {
            setMonthlySalesData(salesData);
            setMonthlyComparison(comparisonData);
        }
      }
    } catch (e) {
      console.warn("Could not read dashboard chart data from cache", e);
    }
  }, []);

  const {
    revenueToday,
    salesCountToday,
  } = useMemo(() => {
    if (isLoadingAllSales || !allSales) {
      return { revenueToday: 0, salesCountToday: 0 };
    }
  
    const today = new Date();
    const activeSalesToday = allSales.filter(s => isSameDay(s.saleDate, today) && s.status !== 'cancelled');
    
    return {
      revenueToday: activeSalesToday.reduce((sum, sale) => sum + sale.totalAmount, 0),
      salesCountToday: activeSalesToday.length,
    };
  }, [allSales, isLoadingAllSales]);
  
  const { liveLowStockItemsCount, criticalStockItemsCount } = useMemo(() => {
    if (isLoadingProducts || !allProducts || allProducts.length === 0) {
      return { liveLowStockItemsCount: 0, criticalStockItemsCount: 0 };
    }
    
    const lowStockItems = allProducts.filter(p => p.stock <= (p.reorderLevel || 10));
    const criticalStockItems = allProducts.filter(p => p.stock <= (p.reorderLevel ? p.reorderLevel / 2 : 5));
    
    return {
      liveLowStockItemsCount: lowStockItems.length,
      criticalStockItemsCount: criticalStockItems.length
    };
  }, [allProducts, isLoadingProducts]);

  const topSellingProducts = useMemo(() => {
    if (isLoadingAllSales || isLoadingProducts || !allSales || !allProducts) {
      return [];
    }

    const productSales: Record<string, {
      name: string;
      price: number;
      quantity: number;
      revenue: number;
      category?: string;
    }> = {};

    allSales.forEach(sale => {
      if (sale.status === 'cancelled') return;
      sale.items.forEach(item => {
        if (!item.isOfferItem) {
          if (!productSales[item.id]) {
            const productDetails = allProducts.find(p => p.id === item.id);
            if (productDetails) {
              productSales[item.id] = {
                name: productDetails.name,
                price: productDetails.price,
                quantity: 0,
                revenue: 0,
                category: productDetails.category
              };
            }
          }
          if (productSales[item.id]) {
            productSales[item.id].quantity += item.quantity;
            productSales[item.id].revenue += (item.appliedPrice * item.quantity);
          }
        }
      });
    });

    return Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

  }, [allSales, allProducts, isLoadingAllSales, isLoadingProducts]);

  const recentFiveSales = useMemo(() => {
    if (!allSales) return [];
    return allSales
        .filter(s => s.status !== 'cancelled')
        .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
        .slice(0, 5);
  }, [allSales]);


  useEffect(() => {
    if (!isLoadingAllSales && allSales && allSales.length > 0) {
      const activeSales = allSales.filter(s => s.status !== 'cancelled');
      const monthlyTotals: Record<number, number> = {};
      const monthlyTotalsPrevYear: Record<number, number> = {};
      const currentYear = new Date().getFullYear();

      activeSales.forEach(sale => {
        const saleDate = sale.saleDate instanceof Date ? sale.saleDate : new Date(sale.saleDate);
        const month = saleDate.getMonth();
        const year = saleDate.getFullYear();
        
        if (year === currentYear) {
          monthlyTotals[month] = (monthlyTotals[month] || 0) + (sale.totalAmount || 0);
        } else if (year === currentYear - 1) {
          monthlyTotalsPrevYear[month] = (monthlyTotalsPrevYear[month] || 0) + (sale.totalAmount || 0);
        }
      });
      
      const newComparisonData = MONTH_NAMES.map((_, index) => {
        const current = monthlyTotals[index] || 0;
        const previous = monthlyTotalsPrevYear[index] || 0;
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      });

      const newSalesData = MONTH_NAMES.map((name, index) => ({
        name,
        sales: monthlyTotals[index] || 0
      }));

      setMonthlySalesData(newSalesData);
      setMonthlyComparison(newComparisonData);

      try {
        localStorage.setItem("dashboardChartData", JSON.stringify({
            salesData: newSalesData,
            comparisonData: newComparisonData
        }));
      } catch (e) {
        console.warn("Could not write dashboard chart data to cache", e);
      }
    }
  }, [allSales, isLoadingAllSales]);


  const customerGrowth = useMemo(() => {
    if (isLoadingCustomers || !customers) return 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthCustomers = customers.filter(c => {
      const joinDate = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt || 0);
      return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
    }).length;
    
    const prevMonthCustomers = customers.filter(c => {
      const joinDate = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt || 0);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return joinDate.getMonth() === prevMonth && joinDate.getFullYear() === prevYear;
    }).length;
    
    return prevMonthCustomers > 0 
      ? ((currentMonthCustomers - prevMonthCustomers) / prevMonthCustomers) * 100
      : currentMonthCustomers > 0 ? 100 : 0;
  }, [customers, isLoadingCustomers]);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role === "cashier") {
      router.replace("/app/sales");
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return <GlobalPreloaderScreen message="Loading dashboard..." />;
  }

  if (currentUser.role === "cashier") {
    return <AccessDenied message="Dashboard is not available for your role. Redirecting..." />;
  }

  const formatCurrency = (value: number): string => {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'Rs. 0.00'; 
    }
    return new Intl.NumberFormat('en-LK', { 
      style: 'currency',
      currency: 'LKR', 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value).replace('LKR', 'Rs.'); 
  };

  const renderStatsCard = (
    title: string,
    value: string | number,
    icon: LucideIcon,
    iconColor: string,
    description?: string,
    trend?: number,
    additionalInfo?: string
  ) => {
    return (
      <StatsCard
        title={title}
        value={value}
        icon={icon}
        iconColor={iconColor}
        description={description}
        trend={trend}
        additionalInfo={additionalInfo}
      />
    );
  };

  const renderLoadingCard = (title: string, icon: LucideIcon, iconColor: string) => (
    <Card className="shadow-lg h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Loader2 className={`${iconColor} h-5 w-5 animate-spin`} />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );

  const renderErrorCard = (title: string, icon: LucideIcon, iconColor: string) => (
    <Card className="shadow-lg h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <AlertTriangle className={`${iconColor} h-5 w-5`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-headline text-destructive">Error</div>
        <p className="text-xs text-muted-foreground pt-1">Could not load data</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Overview"
        description="Welcome back! Here's what's happening with your business."
        icon={Activity}
      />
      
      {customersError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Customer Data Error</AlertTitle><AlertDescription>{customersError}</AlertDescription></Alert>}
      {allSalesError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>All Sales Data Error</AlertTitle><AlertDescription>{allSalesError}</AlertDescription></Alert>}
      {productsError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Product Data Error</AlertTitle><AlertDescription>{productsError}</AlertDescription></Alert>}
      {returnsError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Returns Data Error</AlertTitle><AlertDescription>{returnsError}</AlertDescription></Alert>}
      {expensesError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Expenses Data Error</AlertTitle><AlertDescription>{expensesError}</AlertDescription></Alert>}
      {stockError && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Stock Transaction Error</AlertTitle><AlertDescription>{stockError}</AlertDescription></Alert>}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingAllSales && !allSales.length ? (
          renderLoadingCard("Total Gross Revenue", Banknote, "text-green-600")
        ) : allSalesError ? (
          renderErrorCard("Total Gross Revenue", Banknote, "text-green-600")
        ) : (
          renderStatsCard(
            "Total Gross Revenue",
            formatCurrency(totalRevenueAllTime),
            Banknote,
            "text-green-600",
            "From all successful transactions.",
            undefined, 
            "All Time"
          )
        )}

        {isLoadingAllSales && !allSales.length ? (
          renderLoadingCard("Today's Gross Revenue", TrendingUp, "text-purple-600")
        ) : allSalesError ? (
          renderErrorCard("Today's Gross Revenue", TrendingUp, "text-purple-600")
        ) : (
          renderStatsCard(
            "Today's Gross Revenue",
            formatCurrency(revenueToday),
            TrendingUp,
            "text-purple-600",
             `From ${salesCountToday} transactions`,
            undefined,
            "Today"
          )
        )}

        {isLoadingCustomers ? (
          renderLoadingCard("Total Customers", Users, "text-blue-600")
        ) : customersError ? (
          renderErrorCard("Total Customers", Users, "text-blue-600")
        ) : (
          renderStatsCard(
            "Total Customers",
            customers?.length.toLocaleString() || "0",
            Users,
            "text-blue-600",
            "Registered customers",
            customerGrowth
          )
        )}

        {isLoadingProducts ? (
          renderLoadingCard("Inventory Status", Package, "text-orange-600")
        ) : productsError ? (
          renderErrorCard("Inventory Status", Package, "text-orange-600")
        ) : (
          renderStatsCard(
            "Inventory Status",
            `${liveLowStockItemsCount} Low Stock`,
            Package,
            "text-orange-600",
            `${criticalStockItemsCount} critical items`,
            undefined
          )
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SalesChart
            data={monthlySalesData} 
            title="Monthly Sales Performance"
            description={isLoadingAllSales && !allSales.length ? "Loading sales data..." : "Current year vs previous year"}
            comparisonData={monthlyComparison}
          />
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
              <CardDescription>
                {isLoadingAllSales && !allSales.length ? 'Loading...' : 'Latest five sales activities'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAllSales && !allSales.length ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : allSalesError ? (
                <div className="text-center text-destructive py-10">
                  <p>Could not load transactions.</p>
                </div>
              ) : (!recentFiveSales || recentFiveSales.length === 0) ? (
                <div className="text-center text-muted-foreground py-10">
                  No transactions yet.
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentFiveSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">#{sale.id}</TableCell>
                          <TableCell>
                            {sale.customerShopName || sale.customerName || "Walk-in Customer"}
                            {sale.customerShopName && (
                              <div className="text-xs text-muted-foreground">{sale.customerName}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(sale.totalAmount)}</TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={sale.outstandingBalance > 0 ? 'destructive' : 'default'}
                              className={cn(sale.outstandingBalance === 0 && "bg-green-600 hover:bg-green-700")}
                            >
                              {sale.outstandingBalance > 0 ? 'Pending' : 'Completed'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                Top Selling Products
              </CardTitle>
              <CardDescription>
                {isLoadingAllSales || isLoadingProducts ? 'Calculating...' : 'By revenue'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(isLoadingAllSales && !allSales.length) || (isLoadingProducts && !allProducts.length) ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : allSalesError || productsError ? (
                <div className="text-center text-destructive py-10">
                  <p>Could not load products.</p>
                </div>
              ) : topSellingProducts.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                  No sales data available yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {topSellingProducts.map((product) => (
                    <div key={product.id} className="flex items-center">
                      <div className="ml-4 space-y-1 flex-1">
                        <p className="text-sm font-medium leading-none">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.category || 'Uncategorized'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{product.quantity} sold</p>
                        <p className="text-sm text-green-600">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <AlertQuantityTable />
        </div>
      </div>
    </div>
  );
}

    