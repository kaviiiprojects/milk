
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { UserCheck, DownloadCloud, FileText, FilterX } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { useCustomers } from "@/hooks/useCustomers";
import { useSalesData } from "@/hooks/useSalesData";
import { CustomerReportTable, type CustomerReportData } from "@/components/reports/CustomerReportTable";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from "date-fns";

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount).replace('LKR', 'Rs.');

export default function CustomerReportPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const { sales, isLoading: isLoadingSales } = useSalesData();

  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyWithOutstanding, setShowOnlyWithOutstanding] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role !== "admin") {
      router.replace(currentUser.role === "cashier" ? "/app/sales" : "/app/dashboard");
    }
  }, [currentUser, router]);

  const reportData = useMemo((): CustomerReportData[] => {
    if (isLoadingCustomers || isLoadingSales || !customers || !sales) return [];

    const customerMap = new Map<string, CustomerReportData>();

    customers.forEach(customer => {
      customerMap.set(customer.id, {
        ...customer,
        totalSpent: 0,
        totalSales: 0,
        outstandingBalance: 0,
        sales: [],
      });
    });

    sales.forEach(sale => {
      if (sale.customerId && customerMap.has(sale.customerId)) {
        const customerData = customerMap.get(sale.customerId)!;
        customerData.totalSpent += sale.totalAmount;
        customerData.outstandingBalance += sale.outstandingBalance;
        customerData.totalSales += 1;
        customerData.sales.push(sale);
        if (!customerData.lastPurchaseDate || sale.saleDate > customerData.lastPurchaseDate) {
          customerData.lastPurchaseDate = sale.saleDate;
        }
      }
    });

    customerMap.forEach(customer => {
      customer.sales.sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime());
    });
    
    return Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customers, sales, isLoadingCustomers, isLoadingSales]);
  
  const filteredData = useMemo(() => {
      let result = [...reportData];
      if (showOnlyWithOutstanding) {
          result = result.filter(c => c.outstandingBalance > 0);
      }
      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          result = result.filter(c => 
              c.name.toLowerCase().includes(term) ||
              c.phone.includes(term) ||
              (c.shopName && c.shopName.toLowerCase().includes(term))
          );
      }
      return result;
  }, [reportData, searchTerm, showOnlyWithOutstanding]);

  const pageIsLoading = isLoadingCustomers || isLoadingSales;

  const handleExportPDF = () => {
      const doc = new jsPDF();
      doc.text("Customer Report", 14, 16);
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), 'PP')}`, 14, 22);

      const tableData = filteredData.map(c => [
          c.name,
          c.shopName || 'N/A',
          c.totalSales,
          formatCurrency(c.totalSpent),
          formatCurrency(c.outstandingBalance),
          c.lastPurchaseDate ? format(c.lastPurchaseDate, 'yyyy-MM-dd') : 'N/A'
      ]);

      autoTable(doc, {
          startY: 30,
          head: [['Name', 'Shop', 'Total Sales', 'Total Spent', 'Outstanding', 'Last Purchase']],
          body: tableData,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [30, 18, 57] }
      });
      doc.save(`Customer_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleExportExcel = () => {
      const dataToExport = filteredData.map(c => ({
          'Name': c.name,
          'Shop Name': c.shopName || 'N/A',
          'Phone': c.phone,
          'Address': c.address || 'N/A',
          'Total Sales Count': c.totalSales,
          'Total Spent (Rs.)': c.totalSpent,
          'Outstanding Balance (Rs.)': c.outstandingBalance,
          'Last Purchase Date': c.lastPurchaseDate ? format(c.lastPurchaseDate, 'yyyy-MM-dd') : 'N/A'
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Report");
      XLSX.writeFile(workbook, `Customer_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };


  if (!currentUser) return <GlobalPreloaderScreen message="Loading report..." />;
  if (currentUser.role !== "admin") return <AccessDenied message="Customer reports are not available for your role. Redirecting..." />;

  const pageActions = (
    <div className="flex gap-2">
      <Button onClick={handleExportExcel} variant="outline" size="sm" disabled={pageIsLoading || filteredData.length === 0}><DownloadCloud className="mr-2 h-4 w-4" /> Excel</Button>
      <Button onClick={handleExportPDF} variant="outline" size="sm" disabled={pageIsLoading || filteredData.length === 0}><FileText className="mr-2 h-4 w-4" /> PDF</Button>
    </div>
  );

  return (
    <>
      <PageHeader 
        title="Customer Report" 
        description="Analysis of customer purchasing behavior and payment history."
        icon={UserCheck}
        action={pageActions}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Customer Activity & Sales Report</CardTitle>
          <CardDescription>
            {pageIsLoading ? 'Loading data...' : `${filteredData.length} customers matching filters.`}
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Input
              placeholder="Search by name, phone, or shop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              disabled={pageIsLoading}
            />
            <div className="flex items-center space-x-2">
              <Button
                variant={showOnlyWithOutstanding ? "secondary" : "outline"}
                onClick={() => setShowOnlyWithOutstanding(!showOnlyWithOutstanding)}
                disabled={pageIsLoading}
              >
                Outstanding Balance Only
              </Button>
               <Button variant="ghost" size="icon" onClick={() => {setSearchTerm(''); setShowOnlyWithOutstanding(false)}} disabled={pageIsLoading}>
                  <FilterX className="h-4 w-4" />
               </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CustomerReportTable data={filteredData} isLoading={pageIsLoading && filteredData.length === 0} />
        </CardContent>
      </Card>
    </>
  );
}
