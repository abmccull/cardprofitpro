import Link from 'next/link';
import { Button } from '@/components/ui-migrated/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">
              CardProfit Pro
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-gray-600 hover:text-gray-900">
              Features
            </Link>
            <Link href="#testimonials" className="text-gray-600 hover:text-gray-900">
              Testimonials
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <Link 
            href="/auth/sign-in"
            className="text-gray-600 hover:text-gray-900"
          >
            Sign In
          </Link>
          <Link 
            href="/auth/sign-up"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
} 