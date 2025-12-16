
"use client"; 

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-8">
      <AlertTriangle className="w-16 h-16 text-destructive mb-6" />
      <h2 className="text-3xl font-headline font-semibold mb-4">Oops! Something went wrong.</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        We encountered an unexpected issue. Please try again, or contact support if the problem persists.
      </p>
      <Button onClick={() => reset()} className="text-lg px-6 py-3">
        Try Again
      </Button>
      {error.digest && (
        <p className="text-xs text-muted-foreground mt-4">Error Digest: {error.digest}</p>
      )}
    </div>
    </>
  );
}
