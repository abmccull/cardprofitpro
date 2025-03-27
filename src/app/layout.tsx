import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import SupabaseProvider from "@/lib/supabase/supabase-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CardProfit Pro",
  description: "The all-in-one platform for sports card investing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkProvider>
          <SupabaseProvider>
            {children}
          </SupabaseProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
