
"use client";

import { AppThemeProvider } from '@/components/providers/AppThemeProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { FullscreenProvider } from '@/contexts/FullscreenContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <FullscreenProvider>
          {children}
        </FullscreenProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}
