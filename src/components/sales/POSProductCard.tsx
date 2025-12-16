"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface POSProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  currentSaleType: 'retail' | 'wholesale';
}

export function POSProductCard({ product, onAddToCart, currentSaleType }: POSProductCardProps) {
  const displayPrice = (currentSaleType === 'wholesale' && product.wholesalePrice && product.wholesalePrice > 0)
    ? product.wholesalePrice
    : product.price;

  const isOutOfStock = product.stock <= 0;

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full border rounded-lg">
      
      {/* Mobile View */}
      <div className="flex flex-col md:hidden p-3 gap-2 h-full">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 flex-shrink-0">
            <Image
              src={product.imageUrl || "https://placehold.co/64x64.png"}
              alt={product.name}
              fill
              sizes="64px"
              className="object-cover rounded-full border-2 border-background shadow-sm"
              data-ai-hint={product.aiHint || `${product.category.toLowerCase()} product`}
            />
            {isOutOfStock && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">OUT</span>
                </div>
            )}
          </div>
          <div className="flex-grow">
            <CardTitle className="text-sm font-medium line-clamp-2 leading-tight" title={product.name}>
              {product.name}
            </CardTitle>
            <Badge variant="secondary" className="mt-1 text-xs px-1.5 py-0.5">{product.category}</Badge>
          </div>
        </div>
        <div className="flex items-end justify-between mt-auto pt-2">
          <div className="space-y-0">
            <p className="text-lg font-bold text-primary">
              Rs. {displayPrice.toFixed(2)}
            </p>
            <span className={`text-xs font-medium ${isOutOfStock ? 'text-destructive' : 'text-green-600'}`}>
              {isOutOfStock ? 'Out of stock' : `${product.stock} available`}
            </span>
          </div>
          <Button
            size="sm"
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className="rounded-full"
          >
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
      
      {/* Desktop View */}
      <div className="hidden md:flex flex-col h-full">
        <CardHeader className="p-0 relative h-40">
          <Image
            src={product.imageUrl || "https://placehold.co/600x400.png"}
            alt={product.name}
            fill
            sizes="(max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            data-ai-hint={product.aiHint || `${product.category.toLowerCase()} product`}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-destructive text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider">
                OUT OF STOCK
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-3 flex-grow flex flex-col">
          <CardTitle className="text-base font-semibold line-clamp-2 leading-tight" title={product.name}>
            {product.name}
          </CardTitle>
          <div className="flex justify-between items-center mt-1.5 text-xs">
            <Badge variant="outline">{product.category}</Badge>
            <span className={`font-medium ${isOutOfStock ? 'text-destructive' : 'text-green-600'}`}>
              {product.stock} in stock
            </span>
          </div>
        </CardContent>
        <CardFooter className="p-3 border-t flex justify-between items-center mt-auto">
          <div>
            <p className="text-xl font-bold text-primary">
              Rs. {displayPrice.toFixed(2)}
            </p>
            {currentSaleType === 'wholesale' && product.wholesalePrice && (
              <p className="text-xs text-muted-foreground line-through">
                Rs. {product.price.toFixed(2)}
              </p>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => onAddToCart(product)}
            disabled={isOutOfStock}
            className="rounded-full"
          >
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
