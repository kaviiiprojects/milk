
"use client"; 

import { Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CustomerDataTable } from "@/components/customers/CustomerDataTable";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect } from "react"; 
import { useRouter } from "next/navigation"; 
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";

export default function CustomersPage() {
  const { currentUser } = useAuth(); 
  const router = useRouter(); 

  useEffect(() => { 
    if (!currentUser) {
      router.replace("/");
    }
  }, [currentUser, router]);

  if (!currentUser) { 
     return (
      <>
        <GlobalPreloaderScreen message="Loading customers..." />
      </>
     );
  }

  return (
    <>
      <PageHeader 
        title="Customer Management" 
        description="Add, view, and manage your customers."
        icon={Users}
      />
      <CustomerDataTable />
    </>
  );
}
