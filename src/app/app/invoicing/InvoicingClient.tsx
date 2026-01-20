"use client";

import React, { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceDataTable } from "@/components/invoicing/InvoiceDataTable";
import { fetchMoreSales } from "@/actions/sales";

type Props = {
  initialSales: any[];
  pageSize: number;
};

export default function InvoicingClient({
  initialSales,
  pageSize,
}: Props) {
  const [sales, setSales] = useState(initialSales);
  const [hasMore, setHasMore] = useState(initialSales.length === pageSize);
  const [isPending, startTransition] = useTransition();

  const loadMore = () => {
    const lastId = sales[sales.length - 1]?.id;

    startTransition(async () => {
      const newSales = await fetchMoreSales(lastId, pageSize);

      setSales(prev => [...prev, ...newSales]);
      setHasMore(newSales.length === pageSize);
    });
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <InvoiceDataTable sales={sales} />
        </CardContent>
      </Card>

      {hasMore && (
        <div className="text-center mt-4">
          <Button onClick={loadMore} disabled={isPending}>
            {isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Load More
          </Button>
        </div>
      )}
    </>
  );
}
