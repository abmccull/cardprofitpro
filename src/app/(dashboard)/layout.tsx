'use client';

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { 
  LayoutDashboard, 
  CreditCard, 
  Search, 
  Award, 
  Eye, 
  BarChart4,
  Users,
  Settings,
  Star,
  Calculator,
  PlusCircle,
  LucideIcon
} from "lucide-react";
import { MobileNav } from "../../../components/dashboard/mobile-nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Cards", href: "/my-cards", icon: CreditCard },
  { name: "Card Discovery", href: "/card-discovery", icon: Search },
  { name: "PSA Tools", href: "/psa", icon: Award },
  { name: "Snipes & Bids", href: "/active-bidding", icon: Eye },
  { name: "Analytics", href: "/analytics", icon: BarChart4 },
  { name: "Watchlist", href: "/watchlist", icon: Star },
  { name: "Deal Analyzer", href: "/deal-analyzer", icon: Calculator },
  { name: "VA Management", href: "/va-management", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-border flex flex-col">
        <div className="h-16 px-4 border-b border-border flex items-center">
          <Link href="/dashboard" className="text-xl font-bold text-primary truncate">
            CardProfit Pro
          </Link>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="p-4">
            <Button
              asChild
              className="w-full justify-start gap-2"
            >
              <Link href="/my-cards/new">
                <PlusCircle className="h-4 w-4 shrink-0" />
                <span>Add New Card</span>
              </Link>
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            {navigation.slice(0, -1).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-4 py-2 text-sm text-muted-foreground hover:bg-gray-50 hover:text-foreground"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="ml-3 truncate">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Top navbar */}
        <nav className="h-16 border-b border-border bg-white sticky top-0 z-50">
          <div className="h-full px-6 flex items-center justify-end gap-6">
            <Link
              href="/settings"
              className="p-2 text-muted-foreground hover:text-foreground rounded-md"
            >
              <Settings className="h-5 w-5" />
            </Link>
            <UserButton afterSignOutUrl="/" />
            <div className="md:hidden">
              <MobileNav navigation={navigation} />
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1">
          <div className="mx-auto max-w-[1400px] px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 