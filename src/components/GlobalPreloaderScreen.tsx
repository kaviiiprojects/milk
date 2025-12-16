
import { AppLogo } from "@/components/AppLogo";
import { Loader2 } from "lucide-react";

export function GlobalPreloaderScreen({ message = "Loading page..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <AppLogo size="lg" />
      <Loader2 className="mt-6 h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">{message}</p>
    </div>
  );
}
