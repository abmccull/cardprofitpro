'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { storeOauthState } from '../actions'; // Import the server action

export default function ConnectEbayButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      
      if (!isSignedIn) { // Check if user is signed in
        router.push('/login?returnUrl=/ebay-integration&error=You must be logged in to connect your eBay account');
        return;
      }
      
      // Generate a random state for CSRF protection
      const state = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Call server action to store state
      const { success, error } = await storeOauthState(state);
      
      if (!success || error) {
        throw new Error(error || 'Failed to store OAuth state');
      }
      
      // Get eBay authentication configuration from local environment variables
      const EBAY_CLIENT_ID = process.env.NEXT_PUBLIC_EBAY_CLIENT_ID;
      const EBAY_REDIRECT_URI = process.env.NEXT_PUBLIC_EBAY_REDIRECT_URI;
      
      if (!EBAY_CLIENT_ID || !EBAY_REDIRECT_URI) {
        throw new Error('eBay OAuth configuration is missing');
      }
      
      // Define eBay scopes
      const EBAY_SCOPES = [
        'https://api.ebay.com/oauth/api_scope',
        'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.marketing',
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
        'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.account',
        'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
        'https://api.ebay.com/oauth/api_scope/sell.analytics.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.finances',
        'https://api.ebay.com/oauth/api_scope/sell.payment.dispute',
        'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly',
      ];
      
      // Construct the auth URL
      const authUrl = new URL('https://auth.ebay.com/oauth2/authorize');
      authUrl.searchParams.append('client_id', EBAY_CLIENT_ID);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('redirect_uri', EBAY_REDIRECT_URI);
      authUrl.searchParams.append('scope', EBAY_SCOPES.join(' '));
      authUrl.searchParams.append('state', state);
      
      // Redirect to eBay
      window.location.href = authUrl.toString();
      
    } catch (error) {
      console.error('Error initiating eBay auth:', error);
      setIsLoading(false);
      alert('Failed to connect to eBay: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <Button 
      onClick={handleConnect} 
      disabled={isLoading || !isSignedIn} // Disable if not signed in
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {isLoading ? 'Connecting...' : 'Connect eBay Account'}
    </Button>
  );
} 