import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { useState, type ReactNode } from "react";
import { ThemeProvider } from "@/contexts/theme-context";
import { I18nProvider } from "@/contexts/i18n-context";
import { AuthProvider } from "@/contexts/auth-context";
import { DataProvider } from "@/contexts/data-context";
import { OnboardingProvider } from "@/features/onboarding/hooks/useOnboarding";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            // Mobile apps resume frequently; refetching every time the window
            // regains focus causes a burst of network + re-renders on each
            // app-switch. Rely on staleTime + explicit invalidation instead.
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <ThemeProvider>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DataProvider>
              <OnboardingProvider>
                {/* reducedMotion="user" makes every Framer animation honor the
                    OS "Reduce Motion" setting (incl. infinite loops). */}
                <MotionConfig reducedMotion="user">
                  {children}
                  <Toaster richColors position="top-center" />
                </MotionConfig>
              </OnboardingProvider>
            </DataProvider>
          </AuthProvider>
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
