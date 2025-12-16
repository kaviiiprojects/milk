
"use client";

import { Ban } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function AccessDenied({ message = "You do not have permission to view this page." }) {
  const { currentUser } = useAuth();
  const homePage = currentUser?.role === "cashier" ? "/app/sales" : "/app/dashboard";

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-8">
      <Ban className="w-16 h-16 text-destructive mb-6" />
      <h2 className="text-3xl font-headline font-semibold mb-4">Access Denied</h2>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      <Link href={currentUser ? homePage : "/"} asChild>
        <Button className="text-lg px-6 py-3">
          Go to {currentUser ? "Your Home Page" : "Login"}
        </Button>
      </Link>
      <p className="text-xs text-muted-foreground mt-4">
        If you believe this is an error, please contact support.
      </p>
    </div>
  );
}

