
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers"; // Import the new client-side provider

export const metadata: Metadata = {
  title: "N Group Products",
  description: "Point of Sale system for milk products.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full" suppressHydrationWarning>
        <Providers>
          <div className="flex flex-col h-full">
            <main className="flex-grow overflow-y-auto">
              {children}
            </main>
          </div>
          <div className="toaster-wrapper-for-print-hide">
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  );
}
