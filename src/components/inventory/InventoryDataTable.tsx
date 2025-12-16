
"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { PackageSearch, Loader2, AlertTriangle } from "lucide-react";
import { useProducts } from "@/hooks/useProducts"; // Import the hook
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

export function InventoryDataTable() {
  const { products, isLoading, error } = useProducts(); // Use the hook
  const [searchTerm, setSearchTerm] = useState("");

  const getStockStatus = (stock: number, reorderLevel?: number) => {
    if (reorderLevel === undefined) reorderLevel = 10; // Default reorder level
    if (stock <= 0) return { text: "Out of Stock", color: "bg-red-500 text-destructive-foreground", variant: "destructive" as const };
    if (stock <= reorderLevel) return { text: "Low Stock", color: "bg-orange-500 text-destructive-foreground", variant: "default" as const }; // Changed color for better visibility
    return { text: "In Stock", color: "bg-green-500 text-primary-foreground", variant: "default" as const };
  };

  const filteredProducts = useMemo(() => {
    if (isLoading || !products) return [];
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, searchTerm, isLoading]);

  const formatCurrency = (value: number | undefined): string => {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value).replace('LKR', 'Rs.');
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Inventory Status</CardTitle>
        <CardDescription>Current stock levels for all products.</CardDescription>
        <div className="relative mt-4">
          <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by product name or SKU..."
            className="pl-10 w-full sm:w-1/2 lg:w-1/3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-md">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-destructive">
              <AlertTriangle className="w-16 h-16 mb-4" />
              <p className="text-xl font-semibold">Error loading products</p>
              <p className="text-sm">{error}</p>
          </div>
        ) : filteredProducts.length === 0 && products.length > 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <PackageSearch className="w-16 h-16 mb-4" />
              <p className="text-xl">No products found matching your search.</p>
          </div>
        ) : products.length === 0 && !searchTerm ? (
           <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <PackageSearch className="w-16 h-16 mb-4" />
              <p className="text-xl">No products in inventory.</p>
              <p className="text-sm">Add products via the Product Management page.</p>
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[80px] sm:table-cell">Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead className="hidden lg:table-cell">SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead className="hidden md:table-cell text-right">Reorder Level</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Retail Price</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Wholesale Price</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const status = getStockStatus(product.stock, product.reorderLevel);

              return (
                <TableRow key={product.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={product.name}
                      className="aspect-square rounded-md object-cover"
                      height="48"
                      src={product.imageUrl || "https://placehold.co/48x48.png"}
                      width="48"
                      data-ai-hint={product.aiHint || `${product.category.toLowerCase()} inventory`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="hidden lg:table-cell font-mono text-xs">{product.sku || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{product.stock}</TableCell>
                  <TableCell className="hidden md:table-cell text-right">{product.reorderLevel || 10}</TableCell>
                  <TableCell className="hidden lg:table-cell text-right">{formatCurrency(product.price)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-right">{formatCurrency(product.wholesalePrice)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(status.color, "text-xs")}>{status.text}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
