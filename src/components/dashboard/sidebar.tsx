'use client';

import Link from 'next/link';
import { PlusCircle, Eye, Award, List, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  return (
    <aside className={cn('w-64 bg-gray-50 border-r h-full py-4 hidden md:block', className)}>
      <div className="px-4 space-y-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-2">
          Quick Links
        </h3>
        
        <Button asChild className="w-full" variant="default">
          <Link href="/my-cards/add">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Card
          </Link>
        </Button>
        
        <nav className="space-y-1">
          <Link
            href="/watchlist"
            className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <Eye className="mr-3 h-4 w-4 text-gray-500" />
            View Watchlist
          </Link>
          
          <Link
            href="/psa"
            className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <Award className="mr-3 h-4 w-4 text-gray-500" />
            Check PSA Status
          </Link>
          
          <div>
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            >
              <div className="flex items-center">
                <List className="mr-3 h-4 w-4 text-gray-500" />
                Quick Actions
              </div>
              {quickActionsOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            {quickActionsOpen && (
              <div className="pl-10 space-y-1 mt-1">
                <Link
                  href="/card-discovery"
                  className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Search eBay
                </Link>
                <Link
                  href="/active-bidding"
                  className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Set Snipe
                </Link>
                <Link
                  href="/psa"
                  className="flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Submit PSA
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
} 