"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";

// This page is a placeholder and should redirect.
// The actual login page is at the root src/app/page.tsx
export default function AppBasePage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to a default dashboard or login page
        router.replace('/app/dashboard');
    }, [router]);
    
    return <GlobalPreloaderScreen message="Redirecting..." />;
}
