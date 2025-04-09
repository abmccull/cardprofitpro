'use client';

import { Suspense, useState, useEffect } from 'react';
import { Badge } from '@/components/ui-migrated/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui-migrated/card';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ConnectEbayButton from './connect-ebay-button';
import DisconnectEbayButton from './disconnect-ebay-button';

interface EbayConnectionStatus {
  connected: boolean;
  reason?: string;
  ebayUserId?: string | null;
  connectedAt?: string;
  tokenStatus?: string;
  expiresAt?: string;
}

interface EbayIntegrationClientProps {
  initialStatus: EbayConnectionStatus;
}

export default function EbayIntegrationClient({ initialStatus }: EbayIntegrationClientProps) {
  const [status, setStatus] = useState<EbayConnectionStatus>(initialStatus);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const success = searchParams.get('success');

  // Update status if success param indicates a recent connection/disconnection
  useEffect(() => {
    if (success?.includes('connected')) {
      setStatus(prev => ({ ...prev, connected: true, reason: 'Recently connected' }));
    } else if (success?.includes('disconnected')) {
      setStatus(prev => ({ ...prev, connected: false, reason: 'Recently disconnected' }));
    }
  }, [success]);

  const handleDisconnectSuccess = () => {
    setStatus({ connected: false, reason: 'Disconnected' });
  };
  
  // Determine if buttons should be initially disabled (e.g., if not authenticated on server load)
  // This is a basic check; more robust check might involve a client-side auth check if needed
  const initiallyUnauthenticated = initialStatus.reason === 'User not authenticated';

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">eBay Integration</h1>
      <p className="text-gray-600 mb-8">Connect your eBay account to search and discover cards</p>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 mb-6">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Connection Status Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>eBay Account</CardTitle>
                <CardDescription>View and manage your eBay connection</CardDescription>
              </div>
              <div className="flex-shrink-0">
                <Image 
                  src="/images/ebay-logo.svg" 
                  alt="eBay Logo" 
                  width={80} 
                  height={32}
                  style={{ height: 'auto' }}
                  className="object-contain"
                />
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="mb-6">
              {/* Status Display Logic (Simplified, using client state) */}
              <div className="flex items-center mb-4">
                <span className="font-medium text-gray-700 mr-3">Status:</span>
                {status.connected ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
                    {status.reason === 'Token expired' ? 'Expired' : 'Not Connected'}
                  </Badge>
                )}
              </div>
              
              {status.connected && status.ebayUserId && (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 mr-3 w-32">eBay Username:</span>
                    <span className="text-blue-600">{status.ebayUserId}</span>
                  </div>
                  {status.connectedAt && (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 mr-3 w-32">Connected On:</span>
                      <span>{new Date(status.connectedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {status.tokenStatus && (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700 mr-3 w-32">Token Status:</span>
                      <span className="capitalize">{status.tokenStatus}</span>
                    </div>
                  )}
                </div>
              )}
              
              {!status.connected && (
                <div className="bg-blue-50 border border-blue-100 rounded-md p-4 text-blue-800">
                  <p className="mb-2">Connect your eBay account to enable:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Searching across millions of sports card listings</li>
                    <li>Saving your favorite searches for later</li>
                    <li>Tracking current market values</li>
                    <li>Finding the best deals on cards you want</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            {status.connected ? (
              <Suspense fallback={<div>Loading button...</div>}>
                <DisconnectEbayButton onSuccess={handleDisconnectSuccess} />
              </Suspense>
            ) : (
              <Suspense fallback={<div>Loading button...</div>}>
                <ConnectEbayButton />
              </Suspense>
            )}
            
            <Link 
              href="https://www.ebay.com/myb/Summary" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 flex items-center hover:text-gray-800"
            >
              Visit eBay Account <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </CardFooter>
        </Card>
        
        {/* Help & Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>Resources for eBay integration</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Why connect to eBay?</h3>
              <p className="text-sm text-gray-600">
                Connecting your eBay account lets Card Profit Pro search through millions of listings to help you find exactly what you're looking for.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Data Privacy</h3>
              <p className="text-sm text-gray-600">
                We only use your eBay credentials to search listings. We never post, sell, or modify your items without your explicit permission.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Troubleshooting</h3>
              <p className="text-sm text-gray-600">
                If you encounter issues connecting your account, try logging out of eBay and then reconnecting, or contact our support team.
              </p>
            </div>
          </CardContent>
          
          <CardFooter>
            <Link href="/help/ebay-integration" className="text-blue-600 text-sm hover:underline">
              View detailed integration guide
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 