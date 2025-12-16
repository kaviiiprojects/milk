
"use client";

import { ReceiptText, AlertTriangle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { InvoiceDataTable } from "@/components/invoicing/InvoiceDataTable";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useSalesData } from "@/hooks/useSalesData";
import { Button } from "@/components/ui/button";

export default function InvoicingPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  
  // The hook now fetches all data at once.
  const { sales, isLoading, error, refetchSales, hasMore, loadMoreSales } = useSalesData(true);

  useEffect(() => {
    if (currentUser === null) { 
      router.replace("/");
    }
  }, [currentUser, router]);

  if (currentUser === undefined) {
    return <GlobalPreloaderScreen message="Authenticating..." />;
  }
  
  if (currentUser === null) {
      return <GlobalPreloaderScreen message="Redirecting..." />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader
        title="Invoice Management"
        description="View, search, and manage past sales invoices."
        icon={ReceiptText}
      />

      {error && !isLoading && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            {error}. Data may be incomplete.
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <InvoiceDataTable 
            sales={sales} 
            isLoading={isLoading && sales.length === 0}
            error={error}
            refetchSales={refetchSales}
          />
        </CardContent>
      </Card>
      {hasMore && (
        <div className="text-center mt-4">
            <Button onClick={loadMoreSales} disabled={isLoading}>
                {isLoading && sales.length > 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Load More
            </Button>
        </div>
      )}
    </div>
  );
}
