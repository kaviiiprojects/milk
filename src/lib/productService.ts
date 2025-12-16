
import { type Product } from "./types";

const API_BASE_URL = "/api/products";

export const ProductService = {
  async getAllProducts(): Promise<Product[]> {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }
    return response.json();
  },

  async getProductById(id: string): Promise<Product | null> {
    const response = await fetch(`${API_BASE_URL}?id=${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error("Failed to fetch product");
    }
    return response.json();
  },

  async createProduct(productData: Omit<Product, 'id'>): Promise<Product> {
    const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to add product"}));
        throw new Error(errorData.details || errorData.error || "Failed to create product.");
    }
    return response.json();
  },

  async updateProduct(id: string, productData: Partial<Omit<Product, 'id'>>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to update product"}));
        throw new Error(errorData.details || errorData.error || "Failed to update product.");
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}?id=${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to delete product"}));
        throw new Error(errorData.details || errorData.error || "Failed to delete product.");
    }
  },

  async searchProducts(searchTerm: string): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/search?q=${searchTerm}`);
     if (!response.ok) {
      throw new Error("Failed to search products");
    }
    return response.json();
  }
};
