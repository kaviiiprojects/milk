"use client";

import { Package } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ProductDataTable } from "@/components/products/ProductDataTable";
import { useAuth } from "@/contexts/AuthContext";
import { AccessDenied } from "@/components/AccessDenied";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";

export default function ProductsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.replace("/");
      return;
    }
    if (currentUser.role === "cashier") {
      router.replace("/app/sales"); 
    }
  }, [currentUser, router]);

  if (!currentUser) {
     return <GlobalPreloaderScreen message="Loading products..." />;
  }

  if (currentUser.role === "cashier") {
    return <AccessDenied message="Product management is not available for your role. Redirecting..." />;
  }

  return (
    <>
      <PageHeader 
        title="Product Management" 
        description="Add, view, and manage your products."
        icon={Package}
      />
      <ProductDataTable />
    </>
  );
}