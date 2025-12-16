"use client";

import { Button } from "@/components/ui/button";
import { SearchX } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function NotFound() {
  const { currentUser } = useAuth();
  const homePath = currentUser ? "/app/dashboard" : "/";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-8">
      <SearchX className="w-24 h-24 text-destructive mb-6" />
      <h1 className="text-6xl font-bold text-primary font-headline">404</h1>
      <h2 className="text-3xl font-semibold mt-4 mb-2">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Sorry, we couldn't find the page you're looking for. It might have been
        moved, deleted, or maybe you just mistyped the URL.
      </p>
      <Link href={homePath} passHref>
        <Button size="lg">
          {currentUser ? "Go to Dashboard" : "Go to Login"}
        </Button>
      </Link>
    </div>
  );
}
