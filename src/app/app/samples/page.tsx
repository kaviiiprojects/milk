
"use client";

import React from "react";
import { Beaker } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SampleIssuingForm } from "@/components/samples/SampleIssuingForm";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { AccessDenied } from "@/components/AccessDenied";

export default function IssueSamplesPage() {
  const { currentUser } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!currentUser) {
      router.replace("/");
    }
  }, [currentUser, router]);

  if (!currentUser) {
    return <GlobalPreloaderScreen message="Loading sample issuing page..." />;
  }

  const canAccess = currentUser.role === "admin" || currentUser.role === "cashier";

  if (!canAccess) {
    return <AccessDenied message="You do not have permission to issue samples." />;
  }

  return (
    <>
      <PageHeader
        title="Issue Samples"
        description="Issue product samples to pending customers from vehicle stock."
        icon={Beaker}
      />
      <SampleIssuingForm />
    </>
  );
}
