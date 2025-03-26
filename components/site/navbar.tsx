'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { Button } from '../ui/button';

export function Navbar() {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const dashboardLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/card-discovery', label: 'Card Discovery' },
    { href: '/active-bidding', label: 'Snipes & Bids' },
    { href: '/my-cards', label: 'Cards' },
    { href: '/watchlist', label: 'Watchlist' },
    { href: '/psa', label: 'PSA Tools' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/va-management', label: 'VA Management' },
    { href: '/deal-analyzer', label: 'Deal Analyzer' },
    { href: '/card-lifecycle', label: 'Card Lifecycle' },
    { href: '/transactions', label: 'Transactions' },
  ];

  const publicLinks = [
    { href: '#features', label: 'Features' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#testimonials', label: 'Testimonials' },
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary">
              CardProfit Pro
            </Link>
            
            <div className="hidden md:ml-8 md:flex md:items-center md:space-x-4">
              {isSignedIn ? (
                // Dashboard navigation
                dashboardLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 text-sm font-medium ${
                      pathname === link.href
                        ? 'text-black'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))
              ) : (
                // Public navigation
                isHomePage &&
                publicLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href.substring(1))}
                    className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900"
                  >
                    {link.label}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="ghost">Sign In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button>Get Started</Button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 