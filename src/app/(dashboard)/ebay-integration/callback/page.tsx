import { Suspense } from 'react';
import { handleEbayCallback } from '../actions';
import { redirect } from 'next/navigation';

// Define the shape of searchParams for this page
interface CallbackPageProps {
  searchParams: {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  };
}

export default async function EbayCallbackPage({ searchParams }: CallbackPageProps) {
  // First await the searchParams object to prevent errors
  const params = await searchParams;
  
  // If there's an error from eBay, handle it
  if (params.error) {
    // Redirect to error page with relevant error details
    redirect(`/dashboard/ebay-integration/error?message=${encodeURIComponent(params.error_description || params.error)}`);
  }
  
  // Ensure code and state are present
  if (!params.code || !params.state) {
    redirect('/dashboard/ebay-integration/error?message=Missing required OAuth parameters');
  }

  try {
    // Process the callback and exchange code for tokens
    await handleEbayCallback(params.code, params.state);
    
    // Redirect to success page
    redirect('/dashboard/ebay-integration/success');
  } catch (error) {
    console.error('Error processing eBay callback:', error);
    
    // Redirect to error page
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    redirect(`/dashboard/ebay-integration/error?message=${encodeURIComponent(errorMessage)}`);
  }

  // This should never be reached due to redirects, but showing a loading indicator just in case
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <Suspense fallback={<p>Loading...</p>}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Processing eBay Authorization</h1>
          <p className="text-gray-600 mb-8">Please wait while we complete your eBay account connection...</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </Suspense>
    </div>
  );
} 