'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  CreditCard, 
  Search, 
  Award, 
  Eye, 
  BarChart4,
  Users,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui-migrated/button';
import { 
  Sheet,
  SheetContent,
  SheetTrigger 
} from '@/components/ui-migrated/sheet';
import { cn } from '@/lib/utils';

// Map of icon names to their components
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

type IconName = keyof typeof iconMap;

interface NavigationItem {
  name: string;
  href: string;
  iconName: IconName;
}

interface MobileNavProps {
  navigation: NavigationItem[];
}

export function MobileNav({ navigation }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 px-0">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-xl font-bold" onClick={() => setOpen(false)}>
              CardProfit Pro
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
        </div>
        <nav className="flex flex-col px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = iconMap[item.iconName];
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2 my-1 text-sm font-medium rounded-md",
                  isActive 
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                {Icon && <Icon className="mr-3 h-5 w-5" />}
                {item.name}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
} 