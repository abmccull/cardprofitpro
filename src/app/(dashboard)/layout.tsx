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
  Settings
} from "lucide-react";
import { MobileNav } from "@/components/dashboard/mobile-nav";

// Define the mapping for icons
const iconMap = {
  LayoutDashboard,
  CreditCard,
  Search,
  Award,
  Eye,
  BarChart4,
  Users,
  Settings
};

// IconName type should match the keys of iconMap
type IconName = keyof typeof iconMap;

// Create a strongly typed navigation array
const navigation = [
  { name: "Dashboard", href: "/dashboard", iconName: "LayoutDashboard" as IconName },
  { name: "Cards", href: "/my-cards", iconName: "CreditCard" as IconName },
  { name: "Card Discovery", href: "/card-discovery", iconName: "Search" as IconName },
  { name: "Submissions", href: "/psa", iconName: "Award" as IconName },
  { name: "Snipes & Bids", href: "/active-bidding", iconName: "Eye" as IconName },
  { name: "Analytics", href: "/analytics", iconName: "BarChart4" as IconName },
  { name: "VA Management", href: "/va-management", iconName: "Users" as IconName },
  { name: "Settings", href: "/settings", iconName: "Settings" as IconName },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center flex-1">
              <div className="flex-shrink-0">
                <Link href="/dashboard" className="text-xl font-bold text-primary">
                  CardProfit Pro
                </Link>
              </div>
              <div className="hidden md:ml-10 md:flex md:space-x-4 overflow-x-auto flex-1 justify-center">
                {navigation.map((item) => {
                  const IconComponent = iconMap[item.iconName];
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-50 rounded-md whitespace-nowrap"
                    >
                      {IconComponent && <IconComponent className="mr-1.5 h-4 w-4" />}
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-6 ml-4">
              <MobileNav navigation={navigation} />
              <div className="flex items-center">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
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
  );
} 