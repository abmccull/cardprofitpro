'use client';

import Link from 'next/link';
import { UserButton, SignInButton, SignUpButton, useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { Button } from '@/components/ui-migrated/button';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const { isSignedIn } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navItems = isSignedIn
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/my-cards', label: 'Cards' },
        { href: '/card-discovery', label: 'Card Discovery' },
        { href: '/psa', label: 'PSA Tools' },
        { href: '/active-bidding', label: 'Snipes & Bids' },
        { href: '/analytics', label: 'Analytics' },
        { href: '/watchlist', label: 'Watchlist' },
        { href: '/deal-analyzer', label: 'Deal Analyzer' },
        { href: '/va-management', label: 'VA Management' },
        { href: '/settings', label: 'Settings' },
      ]
    : [
        { href: '/#features', label: 'Features' },
        { href: '/#pricing', label: 'Pricing' },
        { href: '/#testimonials', label: 'Testimonials' },
      ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center" onClick={closeMenu}>
              <span className="text-xl font-bold text-primary">CardProfit Pro</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-primary hover:bg-gray-50"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="outline" size="sm">
                    Sign in
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">Sign up</Button>
                </SignUpButton>
              </>
            )}
          </div>
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-primary hover:bg-gray-50"
                onClick={closeMenu}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4 space-x-4">
              {isSignedIn ? (
                <div className="flex-shrink-0">
                  <UserButton afterSignOutUrl="/" />
                </div>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <Button variant="outline" size="sm" className="w-full">
                      Sign in
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button size="sm" className="w-full">
                      Sign up
                    </Button>
                  </SignUpButton>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 