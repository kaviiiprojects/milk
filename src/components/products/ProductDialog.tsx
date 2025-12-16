
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/types";

interface ProductDialogProps {
  product?: Product | null;
  trigger?: React.ReactNode;
  onSave: (product: Product) => Promise<void>;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  loading?: boolean;
}

const defaultProductData: Omit<Product, "id"> = {
  name: "",
  category: "Other",
  price: 0,
  wholesalePrice: undefined, // Initialize as undefined for optional field
  stock: 0,
  description: "",
  sku: "",
  reorderLevel: 10,
  imageUrl: "https://images.unsplash.com/photo-1685967836586-aaefdda7b517?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHx5b2d1cnQlMjBwcm9kdWN0fGVufDB8fHx8MTc1MDA5Mjk4MXww&ixlib=rb-4.1.0&q=80&w=1080",
  aiHint: "product image"
};


export function ProductDialog({
  product,
  trigger,
  onSave,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  loading = false
}: ProductDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const [formData, setFormData] = useState<Omit<Product, "id">>(defaultProductData);
  const [previewImage, setPreviewImage] = useState(defaultProductData.imageUrl);

  useEffect(() => {
    if (isOpen) {
      // Ensure defaultProductData is spread for new products to get `wholesalePrice: undefined`
      const initialData = product ? { ...product } : { ...defaultProductData };
      // If editing and product.wholesalePrice is null/undefined from DB, keep it as undefined
      if (product && product.wholesalePrice == null) {
        initialData.wholesalePrice = undefined;
      }
      setFormData(initialData);
      setPreviewImage(initialData.imageUrl || defaultProductData.imageUrl);
    }
  }, [isOpen, product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "price" || name === "stock" || name === "reorderLevel") {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (name === "wholesalePrice") {
      // Allow empty string to represent 'not set' or 'undefined'
      // parseFloat('') is NaN, so `|| 0` would make it 0. We want undefined.
      setFormData(prev => ({ ...prev, [name]: value === "" ? undefined : (parseFloat(value) || 0) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryChange = (value: Product["category"]) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        setFormData(prev => ({...prev, imageUrl: result}));
      };
      reader.readAsDataURL(file);
    } else {
      const currentImageUrl = product?.imageUrl || defaultProductData.imageUrl;
      setPreviewImage(currentImageUrl);
      setFormData(prev => ({...prev, imageUrl: currentImageUrl}));
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.price < 0) { 
      // Add toast for validation errors here if desired
      return;
    }

    const productToSave: Product = {
      id: product?.id || Date.now().toString(), // Generate temp ID if new
      name: formData.name,
      category: formData.category,
      price: formData.price,
      stock: formData.stock,
      description: formData.description,
      sku: formData.sku,
      reorderLevel: formData.reorderLevel,
      imageUrl: formData.imageUrl,
      aiHint: formData.aiHint,
    };
    
    // Only add wholesalePrice to the object if it's a valid number (including 0)
    if (typeof formData.wholesalePrice === 'number' && !isNaN(formData.wholesalePrice)) {
      productToSave.wholesalePrice = formData.wholesalePrice;
    }
    // If formData.wholesalePrice is undefined, it won't be included in productToSave,
    // which is correct behavior for ProductService.updateProduct to not send `undefined`.
    
    await onSave(productToSave);
    if (isOpen && setIsOpen) { 
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline">{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update the details of this product." : "Fill in the details for the new product."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className="mt-1" 
                required 
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                name="category" 
                value={formData.category} 
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger id="category" className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yogurt">Yogurt</SelectItem>
                  <SelectItem value="Drink">Drink</SelectItem>
                  <SelectItem value="Ice Cream">Ice Cream</SelectItem>
                  <SelectItem value="Dessert">Dessert</SelectItem>
                  <SelectItem value="Curd">Curd</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="price">Retail Price (Rs.) *</Label>
              <Input 
                id="price" 
                name="price" 
                type="number" 
                value={formData.price} 
                onChange={handleChange} 
                className="mt-1" 
                min="0" 
                step="0.01" 
                required 
              />
            </div>
            <div>
              <Label htmlFor="wholesalePrice">Wholesale Price (Rs.)</Label>
              <Input 
                id="wholesalePrice" 
                name="wholesalePrice" 
                type="number" 
                value={formData.wholesalePrice === undefined ? '' : formData.wholesalePrice} 
                onChange={handleChange} 
                className="mt-1" 
                min="0" 
                step="0.01"
                placeholder="Optional" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input 
                id="stock" 
                name="stock" 
                type="number" 
                value={formData.stock} 
                onChange={handleChange} 
                className="mt-1" 
                min="0" 
                required 
              />
            </div>
            <div>
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input 
                id="reorderLevel" 
                name="reorderLevel" 
                type="number" 
                value={formData.reorderLevel} 
                onChange={handleChange} 
                className="mt-1" 
                min="0" 
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
            <Input 
              id="sku" 
              name="sku" 
              value={formData.sku || ""} 
              onChange={handleChange} 
              className="mt-1" 
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              name="description" 
              value={formData.description || ""} 
              onChange={handleChange} 
              className="mt-1" 
              rows={3} 
            />
          </div>
          
          <div>
            <Label htmlFor="aiHint">AI Hint for Image</Label>
            <Input 
              id="aiHint" 
              name="aiHint" 
              value={formData.aiHint || ""} 
              onChange={handleChange} 
              className="mt-1" 
              placeholder="e.g. yogurt product, fruit drink" 
            />
          </div>

          <div>
            <Label htmlFor="imageUrl">Product Image</Label>
            <Input 
              id="imageUrl" 
              name="imageUrl" 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              className="mt-1" 
            />
            {previewImage && (
              <div className="mt-2 rounded-md overflow-hidden border border-muted aspect-video w-full max-w-sm mx-auto">
                <Image 
                  src={previewImage} 
                  alt="Product preview" 
                  width={400} 
                  height={300} 
                  className="object-cover w-full h-full" 
                  data-ai-hint={formData.aiHint || `${formData.category.toLowerCase()} product`} 
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !formData.name || formData.price < 0}
          >
            {loading ? "Saving..." : "Save Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
