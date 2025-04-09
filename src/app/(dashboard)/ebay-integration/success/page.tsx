import { getEbayConnectionStatus } from '../actions';
import { Button } from '@/components/ui-migrated/button';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default async function EbaySuccessPage() {
  // Get the eBay connection status to show user details
  const status = await getEbayConnectionStatus();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          eBay Account Connected Successfully!
        </h1>
        
        {status.connected && status.ebayUserId && (
          <div className="text-gray-600 mb-6">
            <p className="font-medium mb-2">Connected to eBay account:</p>
            <p className="text-blue-600 font-semibold">{status.ebayUserId}</p>
            <p className="text-sm text-gray-500 mt-2">
              Connected on {new Date(status.connectedAt).toLocaleDateString()}
            </p>
          </div>
        )}
        
        <p className="text-gray-600 mb-8">
          You can now search and discover eBay cards, save your favorite searches, and more!
        </p>
        
        <div className="flex flex-col space-y-3">
          <Button asChild>
            <Link href="/card-discovery">
              Discover Cards on eBay
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 