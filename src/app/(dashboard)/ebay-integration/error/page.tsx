import { Button } from '@/components/ui-migrated/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

interface ErrorPageProps {
  searchParams: {
    message?: string;
  };
}

export default async function EbayErrorPage({ searchParams }: ErrorPageProps) {
  // Await searchParams to prevent Next.js error
  const params = await searchParams;
  const errorMessage = params.message || 'An unexpected error occurred during eBay account connection.';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          eBay Connection Failed
        </h1>
        
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          <p>{errorMessage}</p>
        </div>
        
        <p className="text-gray-600 mb-8">
          There was a problem connecting your eBay account. You can try again or contact support if the issue persists.
        </p>
        
        <div className="flex flex-col space-y-3">
          <Button asChild>
            <Link href="/dashboard/ebay-integration">
              Try Again
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              Return to Dashboard
            </Link>
          </Button>
          
          <Button variant="ghost" asChild>
            <a 
              href="mailto:support@cardprofitpro.com?subject=eBay Connection Issue" 
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Contact Support
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
} 