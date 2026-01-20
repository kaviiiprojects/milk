
import { NextResponse, type NextRequest } from 'next/server';
import {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct
} from '@/lib/firestoreService';
import type { Product, FirestoreProduct } from '@/lib/types';

// GET /api/products - Fetch all products
// GET /api/products?id=<productId> - Fetch a single product
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('id');

  try {
    if (productId) {
      const product = await getProduct(productId);
      if (product) {
        return NextResponse.json(product);
      } else {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
    } else {
      const products = await getProducts();
      return NextResponse.json(products);
    }
  } catch (error) {
    console.error('Error fetching product(s):', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch product(s)', details: errorMessage }, { status: 500 });
  }
}

// POST /api/products - Add a new product
export async function POST(request: NextRequest) {
  try {
    const productData = (await request.json()) as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

    if (!productData || !productData.name || !productData.category || productData.price === undefined || productData.stock === undefined) {
      return NextResponse.json({ error: 'Missing required product fields (name, category, price, stock)' }, { status: 400 });
    }

    const productId = await addProduct(productData);
    return NextResponse.json({ id: productId, ...productData }, { status: 201 });
  } catch (error) {
    console.error('Error adding product:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to add product', details: errorMessage }, { status: 500 });
  }
}

// PUT /api/products?id=<productId> - Update an existing product
export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('id');

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required for updating' }, { status: 400 });
  }

  try {
    const productUpdateData = (await request.json()) as Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>;

    // Ensure no critical fields are empty if provided
    if (productUpdateData.name === '' || (productUpdateData.category as any) === '' || (productUpdateData.price !== undefined && productUpdateData.price < 0) || (productUpdateData.stock !== undefined && productUpdateData.stock < 0)) {
      return NextResponse.json({ error: 'Invalid data provided for update.' }, { status: 400 });
    }

    await updateProduct(productId, productUpdateData);
    return NextResponse.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if (errorMessage.includes("Failed to update product.") || errorMessage.includes("not found")) { // A bit generic, but helps distinguish
      return NextResponse.json({ error: 'Product not found or failed to update', details: errorMessage }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update product', details: errorMessage }, { status: 500 });
  }
}

// DELETE /api/products?id=<productId> - Delete a product
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('id');

  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required for deletion' }, { status: 400 });
  }

  try {
    await deleteProduct(productId);
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    if (errorMessage.includes("Failed to delete product.") || errorMessage.includes("not found")) {
      return NextResponse.json({ error: 'Product not found or failed to delete', details: errorMessage }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete product', details: errorMessage }, { status: 500 });
  }
}
