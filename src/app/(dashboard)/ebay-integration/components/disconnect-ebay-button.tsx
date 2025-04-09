'use client';

import { Button } from "@/components/ui-migrated/button";
import { useState } from "react";
import { useAuth } from '@/contexts/auth-context';
import { disconnectEbay } from '../actions'; // Import the server action
import { useRouter } from 'next/navigation'; // Import useRouter

interface DisconnectEbayButtonProps {
  onSuccess?: () => void;
}

export default function DisconnectEbayButton({ onSuccess }: DisconnectEbayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { isSignedIn } = useAuth(); // Only need isSignedIn check
  const router = useRouter();

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your eBay account?")) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (!isSignedIn) {
        alert("You must be logged in to disconnect your eBay account");
        setIsLoading(false);
        return;
      }
      
      // Call the server action to disconnect
      const { success, error } = await disconnectEbay();
      
      if (!success || error) {
        throw new Error(error || 'Failed to disconnect eBay account');
      }
      
      // Call the onSuccess callback if provided (client-side state update)
      if (onSuccess) {
        onSuccess();
      }
      
      // Optionally, show a success message or redirect
      router.push('/ebay-integration?success=eBay account disconnected successfully');
      
    } catch (error) {
      console.error('Error disconnecting eBay account:', error);
      alert("Failed to disconnect eBay account: " + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline"
      onClick={handleDisconnect} 
      disabled={isLoading || !isSignedIn} // Disable if not signed in
      className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
    >
      {isLoading ? 'Disconnecting...' : 'Disconnect eBay Account'}
    </Button>
  );
} 