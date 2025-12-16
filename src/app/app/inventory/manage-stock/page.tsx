"use client";

import { PlusSquare } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ManageStockForm } from "@/components/inventory/ManageStockForm";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { AccessDenied } from "@/components/AccessDenied";

export default function ManageStockPage() {
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
     return (
      <>
        <GlobalPreloaderScreen message="Loading stock management..." />
      </>
     );
  }
  
  if (currentUser.role !== "admin") {
    return <AccessDenied message="Stock management is not available for your role. Redirecting..." />;
  }

  return (
    <>
      <PageHeader 
        title="Manage Stock / Transactions" 
        description="Add, remove, or transfer product stock."
        icon={PlusSquare}
      />
      <ManageStockForm />
    </>
  );
}
