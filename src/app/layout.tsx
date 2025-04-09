import type { Metadata } from 'next'
import { fontSans } from '@/lib/fonts'
import { ClerkProvider } from '@clerk/nextjs'
import SupabaseProvider from '@/lib/supabase/supabase-provider'
import './globals.css'
import { cn } from '@/lib/utils'
import { ErrorBoundary } from '@/components/error-boundary'
import { Toaster } from '@/components/ui-migrated/toaster'
import { AuthProvider } from '@/contexts/auth-context'

export const metadata: Metadata = {
  title: 'CardProfitPro - Track, Analyze, and Maximize Your Sports Card Investments',
  description: 'Discover undervalued sports cards, track your collection performance, and make data-driven decisions with CardProfitPro.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        fontSans.variable
      )}>
        <ClerkProvider>
          <SupabaseProvider>
            <AuthProvider>
              <ErrorBoundary>
                {children}
                <Toaster />
              </ErrorBoundary>
            </AuthProvider>
          </SupabaseProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
