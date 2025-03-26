'use client';

import { useState } from 'react';
import { Menu, X, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

// This type must match what's used in the dashboard layout
type IconName = 'LayoutDashboard' | 'CreditCard' | 'Search' | 'Award' | 'Eye' | 'BarChart4' | 'Users' | 'Settings';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export function MobileNav({ navigation }: { navigation: NavItem[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground"
      >
        <span className="sr-only">Toggle menu</span>
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 pt-16">
          <div className="container mx-auto px-6">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center py-2 text-lg font-medium hover:text-foreground/80"
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 