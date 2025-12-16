
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { ProductService } from "@/lib/productService";

const CACHE_KEY = "productsCache";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedProducts = await ProductService.getAllProducts(); // This will now use the API
      setProducts(fetchedProducts);
      setError(null);
      localStorage.setItem(CACHE_KEY, JSON.stringify(fetchedProducts));
    } catch (err: any) {
      const errorMessage = err.message || "An unknown error occurred while fetching products.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Fetching Products",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          setProducts(JSON.parse(cachedData));
          setIsLoading(false);
        }
      } catch (e) {
        console.warn("Could not read products from cache", e);
      }
      await refetch();
    };

    loadData();
  }, [refetch]);

  const addProduct = async (productData: Omit<Product, "id">): Promise<Product | null> => {
    try {
      const newProduct = await ProductService.createProduct(productData);
      await refetch();
      toast({
        title: "Product Added",
        description: `${newProduct.name} has been successfully added.`,
      });
      return newProduct;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to Add Product",
        description: err.message,
      });
      return null;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Omit<Product, "id">>): Promise<Product | null> => {
    try {
      await ProductService.updateProduct(id, productData);
      await refetch();
      toast({
        title: "Product Updated",
        description: `${productData.name || 'Product'} has been successfully updated.`,
      });
      const updatedProduct = products.find(p => p.id === id);
      return updatedProduct ? { ...updatedProduct, ...productData } : null;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to Update Product",
        description: err.message,
      });
      return null;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      await ProductService.deleteProduct(id);
      await refetch();
      toast({
        title: "Product Deleted",
        description: "The product has been successfully deleted.",
      });
      return true;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to Delete Product",
        description: err.message,
      });
      return false;
    }
  };

  return {
    products,
    isLoading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    refetch,
  };
}
