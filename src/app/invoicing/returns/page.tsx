
"use client";

import React from "react";
import { PageHeader } from "@/components/PageHeader";
import { Undo2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useReturns } from "@/hooks/useReturns";
import { ReturnInvoiceDataTable } from "@/components/invoicing/ReturnInvoiceDataTable";

export default function ReturnInvoicesPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { returns, isLoading, error } = useReturns();

  React.useEffect(() => {
    if (!currentUser) {
      router.replace("/");
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return <GlobalPreloaderScreen message="Loading return invoices..." />;
  }

  return (
    <>
      <PageHeader
        title="Return Invoice History"
        description="View and manage all processed returns and exchanges."
        icon={Undo2}
      />
      <Card>
        <CardHeader>
          <CardTitle>All Returns</CardTitle>
          <CardDescription>
            A complete log of all return and exchange transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <ReturnInvoiceDataTable 
                returns={returns}
                isLoading={isLoading}
                error={error}
            />
        </CardContent>
      </Card>
    </>
  );
}
