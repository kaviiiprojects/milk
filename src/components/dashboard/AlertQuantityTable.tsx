
"use client";

import type { Product } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Package, Loader2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts"; // Import useProducts
import { useMemo } from "react";

export function AlertQuantityTable() {
  const { 
    products: allProducts, 
    isLoading: isLoadingProducts, 
    error: productsError 
  } = useProducts();

  const productsToReorder = useMemo(() => {
    if (isLoadingProducts || !allProducts || allProducts.length === 0) return [];
    return allProducts.filter(
      product => product.stock <= (product.reorderLevel || 10)
    );
  }, [allProducts, isLoadingProducts]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3 mb-1">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <CardTitle className="font-headline text-xl">Low Stock Alerts</CardTitle>
        </div>
        <CardDescription>Products that have reached or fallen below their reorder quantity.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingProducts ? (
          <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-lg">Loading stock alerts...</p>
          </div>
        ) : productsError ? (
          <Alert variant="destructive" className="h-[350px] flex flex-col items-center justify-center text-center">
            <AlertTriangle className="w-12 h-12 mb-4" />
            <CardTitle className="text-lg">Error Loading Alerts</CardTitle>
            <AlertDescription>
              Could not load low stock information. Please try again later.
              <p className="text-xs mt-1">{productsError}</p>
            </AlertDescription>
          </Alert>
        ) : productsToReorder.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
            <Package className="w-16 h-16 mb-4 text-green-500" />
            <p className="text-xl">All Products Well Stocked!</p>
            <p>No products currently need reordering.</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px] hidden sm:table-cell">SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Alert Qty</TableHead>
                  <TableHead className="text-right">Current Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsToReorder.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs hidden sm:table-cell">{product.sku || "N/A"}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right">{product.reorderLevel || 10}</TableCell>
                    <TableCell className="text-right text-destructive font-semibold">{product.stock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
