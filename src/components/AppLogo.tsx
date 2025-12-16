
"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

export function AppLogo({ size = "md" }: { size?: "sm" | "md" | "lg" | "iconOnly" }) {
  const sizeMap = {
    sm: { class: "h-6 w-6", width: 24, height: 24 },
    md: { class: "h-8 w-8", width: 32, height: 32 },
    lg: { class: "h-10 w-10", width: 40, height: 40 },
    iconOnly: { class: "h-7 w-7", width: 28, height: 28 },
  };

  const { class: sizeClass, width, height } = sizeMap[size];

  const logoImage = (
    <Image
      src="/logo.png"
      alt="N Group Products Logo"
      width={width}
      height={height}
      className="object-contain"
      priority // Ensures the logo loads quickly, especially on the login page
    />
  );

  if (size === "iconOnly") {
    return (
      <div className={cn(sizeClass, "flex items-center justify-center")}>
        {logoImage}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={cn(sizeClass)}>
        {logoImage}
      </div>
      <span 
        className={cn(
            `font-headline font-bold text-primary app-logo-text`,
            size === 'sm' && 'text-2xl',
            size === 'md' && 'text-2xl',
            size === 'lg' && 'text-3xl'
        )}
      >
        N Group Products
      </span>
    </div>
  );
}
