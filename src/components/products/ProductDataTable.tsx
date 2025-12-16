
"use client";

import Image from "next/image";
import { MoreHorizontal, Edit, Trash2, PlusCircle, PackageSearch, Package, FileDigit, Maximize, Minimize } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProductDialog } from "./ProductDialog";
import { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";
import { useProducts } from "@/hooks/useProducts";

export function ProductDataTable() {
  const { products, isLoading, error, addProduct, updateProduct, deleteProduct } = useProducts();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const isAdmin = currentUser?.role === 'admin';

  const handleOpenAddDialog = () => {
    setEditingProduct(null);
    setIsProductDialogOpen(true);
  };

  const handleOpenEditDialog = (product: Product) => {
    setEditingProduct(product);
    setIsProductDialogOpen(true);
  };
  
  const handleSaveProduct = async (productToSave: Product) => {
    let success = false;
    if (editingProduct) {
      success = !!(await updateProduct(productToSave.id, productToSave));
    } else {
      success = !!(await addProduct(productToSave));
    }

    if (success) {
      setIsProductDialogOpen(false);
      setEditingProduct(null);
    }
  };

  const openDeleteConfirmation = (productId: string) => {
    if (!isAdmin) return;
    setProductToDeleteId(productId);
    setIsDeleteAlertOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!isAdmin || !productToDeleteId) return;
    await deleteProduct(productToDeleteId);
    setIsDeleteAlertOpen(false);
    setProductToDeleteId(null);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const filteredDisplayProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className={cn(
        "shadow-lg flex flex-col", 
        isFullScreen ? "fixed inset-0 z-50 bg-card" : "flex-1 min-h-0"
      )}>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 p-4 sm:p-6">
          <CardTitle className="font-headline shrink-0">{isFullScreen ? "Products (Fullscreen)" : "Product List"}</CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or SKU..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isAdmin && (
               <Button size="sm" className="w-full sm:w-auto shrink-0" onClick={handleOpenAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Product
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullScreen}
              className="hidden md:inline-flex h-9 w-9 shrink-0"
              title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              <span className="sr-only">{isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className={cn("p-4 overflow-auto flex-1 min-h-0")}>
          {filteredDisplayProducts.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <PackageSearch className="w-16 h-16 mb-4" />
                <p className="text-xl">No products found.</p>
                {searchTerm && <p>Try adjusting your search term.</p>}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 overflow-auto h-[450px]">
                {filteredDisplayProducts.map((product) => (
                  <Card key={product.id} className="w-full overflow-hidden">
                    <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                            <Image
                                alt={product.name}
                                className="object-cover rounded-md h-12 w-12 flex-shrink-0"
                                src={product.imageUrl || "https://placehold.co/48x48.png"}
                                width={48}
                                height={48}
                                data-ai-hint={product.aiHint || `${product.category.toLowerCase()} product`}
                            />
                            <div className="flex-grow min-w-0">
                                <div className="flex justify-between items-start">
                                    <div className="flex-grow min-w-0 pr-2">
                                        <CardTitle className="text-sm font-semibold leading-tight truncate" title={product.name}>
                                          {product.name}
                                        </CardTitle>
                                        <Badge variant="secondary" className="mt-0.5 text-xs px-1.5 py-0.5">{product.category}</Badge>
                                    </div>
                                    {isAdmin && (
                                        <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0 -mt-1 -mr-1">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleOpenEditDialog(product)}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => openDeleteConfirmation(product.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>

                                <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                                    <div className="flex items-center">
                                        <Package className="mr-1.5 h-3.5 w-3.5 text-primary/80 flex-shrink-0" />
                                        <span>Stock: <span className="font-medium text-foreground/90 ml-1">{product.stock} units</span></span>
                                    </div>
                                    <div className="flex items-center">
                                        <FileDigit className="mr-1.5 h-3.5 w-3.5 text-primary/80 flex-shrink-0" />
                                        <span>SKU: <span className="font-medium text-foreground/90 ml-1">{product.sku || "N/A"}</span></span>
                                    </div>
                                    <p className="text-md font-bold text-primary pt-1">
                                        Rs. {product.price.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">(Retail)</span>
                                    </p>
                                    {product.wholesalePrice !== undefined && product.wholesalePrice > 0 && (
                                        <p className="text-sm font-semibold text-black dark:text-white">
                                           Rs. {product.wholesalePrice.toFixed(2)} <span className="text-xs font-normal text-muted-foreground">(Wholesale)</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-auto h-[450px]">
                <Table>
                  <TableHeader className="md:sticky md:top-0 md:z-10 md:bg-card">
                    <TableRow>
                      <TableHead className="w-[80px] xl:w-[100px] md:bg-card">Image</TableHead>
                      <TableHead className="md:bg-card">Name</TableHead>
                      <TableHead className="md:bg-card">Category</TableHead>
                      <TableHead className="md:bg-card">SKU</TableHead>
                      <TableHead className="md:bg-card">Stock</TableHead>
                      <TableHead className="text-right md:bg-card">Wholesale Price</TableHead>
                      <TableHead className="text-right md:bg-card">Retail Price</TableHead>
                      {isAdmin && (
                        <TableHead className="text-right md:bg-card">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDisplayProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Image
                            alt={product.name}
                            className="aspect-square rounded-md object-cover"
                            height="64"
                            src={product.imageUrl || "https://placehold.co/64x64.png"}
                            width="64"
                            data-ai-hint={product.aiHint || `${product.category.toLowerCase()} product`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>{product.sku || "N/A"}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell className="text-right">
                          {product.wholesalePrice !== undefined && product.wholesalePrice > 0 ? `Rs. ${product.wholesalePrice.toFixed(2)}` : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">Rs. {product.price.toFixed(2)}</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleOpenEditDialog(product)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => openDeleteConfirmation(product.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit/Add Product Dialog */}
      {isAdmin && isProductDialogOpen && (
        <ProductDialog
          product={editingProduct}
          onSave={handleSaveProduct}
          open={isProductDialogOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) setEditingProduct(null);
            setIsProductDialogOpen(isOpen);
          }}
          loading={isLoading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProduct} className="bg-destructive hover:bg-destructive/90">
              {isLoading ? "Deleting..." : "Yes, delete product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
