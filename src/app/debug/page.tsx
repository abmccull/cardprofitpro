'use client';

import React, { useState, useEffect } from 'react';
import { debugSupabaseConnection, getAllCards } from '../actions/cards';
import { useAuth } from '@/contexts/auth-context';
import { ErrorBoundary } from '@/components/error-boundary';

// Define more specific types for the CardData based on the cards.ts
interface CardData {
  id: string;
  name: string;
  player?: string | null;
  year?: number | null;
  manufacturer?: string | null;
  grade?: string | null;
  purchase_price?: number | null;
  status?: string | null;
  current_value?: number | null;
  source?: string | null;
  sport?: string | null;
  created_at?: string | null;
  owner_id?: string | null;
  [key: string]: any; // Allow for other fields that might be returned
}

// Define the debug info structure
interface DebugInfo {
  connected?: boolean;
  urls?: { supabaseUrl: string };
  error?: string | null;
  details?: any; // This could be a PostgrestError or other error type
  tablesAvailable?: Array<{ table_name: string }>;
  cardsTableInfo?: any; // Result from the RPC call
  sampleCards?: CardData[];
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [allCards, setAllCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{id?: string, email?: string} | null>(null);
  const [creatingCard, setCreatingCard] = useState(false);
  const [cardCreationResult, setCardCreationResult] = useState<string | null>(null);
  
  // Get auth context outside of the callback
  const auth = useAuth();

  // Define runDiagnostics before it's used
  async function runDiagnostics() {
    try {
      setLoading(true);
      // Run both diagnostics and get all cards
      const [diagnosticResult, cardsResult] = await Promise.all([
        debugSupabaseConnection(),
        getAllCards()
      ]);
      
      // Cast the results to the expected types
      setDebugInfo(diagnosticResult as DebugInfo);
      setAllCards(cardsResult as CardData[]);
    } catch (err) {
      console.error('Error running diagnostics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Function to create a test card
  const createTestCard = async () => {
    if (!auth.userId) {
      setCardCreationResult('Error: No user ID available');
      return;
    }
    
    try {
      setCreatingCard(true);
      setCardCreationResult(null);
      
      const response = await fetch(`/debug-actions/create-test-card?userId=${auth.userId}`);
      const result = await response.json();
      
      if (response.ok) {
        setCardCreationResult(`Success: ${result.message}`);
        // Refresh the diagnnostics to show the new card
        runDiagnostics();
      } else {
        setCardCreationResult(`Error: ${result.error}`);
      }
    } catch (err) {
      setCardCreationResult(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCreatingCard(false);
    }
  };

  // Try to get auth user info, but don't throw if AuthProvider is not available
  useEffect(() => {
    try {
      const { isSignedIn, userId } = auth;
      if (isSignedIn && userId) {
        setUserInfo({
          id: userId,
          email: 'Email not available from context'
        });
        
        // Log the user ID to the console for debugging RLS
        console.log('Debug page - User ID from auth context:', userId);
      }
    } catch (err) {
      console.log('Auth not available:', err);
      // Continue without auth
    }
  }, [auth]);

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Supabase Debug Information</h1>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h2 className="text-xl font-semibold mb-2">User Information</h2>
          {userInfo ? (
            <pre className="overflow-auto p-2 bg-gray-100 rounded">{JSON.stringify(userInfo, null, 2)}</pre>
          ) : (
            <p className="italic text-gray-500">Not logged in or auth provider not available</p>
          )}
        </div>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h2 className="text-xl font-semibold mb-2">Create Test Card</h2>
          <p className="mb-2">Use this to create a test card owned by the current user.</p>
          <button 
            onClick={createTestCard}
            disabled={creatingCard || !auth.userId}
            className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
          >
            {creatingCard ? 'Creating...' : 'Create Test Card'}
          </button>
          {cardCreationResult && (
            <p className={`mt-2 ${cardCreationResult.startsWith('Success') ? 'text-green-600' : 'text-red-600'}`}>
              {cardCreationResult}
            </p>
          )}
        </div>
        
        {loading ? (
          <div className="p-4 border rounded-md">Loading diagnostics...</div>
        ) : error ? (
          <div className="p-4 border border-red-300 bg-red-50 rounded-md">
            <h2 className="text-lg font-semibold text-red-700 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 border rounded-md">
              <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full ${debugInfo?.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>{debugInfo?.connected ? 'Connected to Supabase' : 'Failed to connect'}</span>
              </div>
              {debugInfo?.urls && (
                <div className="mt-2">
                  <p><strong>Supabase URL:</strong> {debugInfo.urls.supabaseUrl}</p>
                </div>
              )}
            </div>

            {debugInfo?.error && (
              <div className="p-4 border border-red-300 bg-red-50 rounded-md">
                <h2 className="text-lg font-semibold text-red-700 mb-2">Error</h2>
                <p className="text-red-600">{debugInfo.error}</p>
                <pre className="mt-2 overflow-auto p-2 bg-gray-100 rounded">{JSON.stringify(debugInfo.details, null, 2)}</pre>
              </div>
            )}

            {debugInfo?.tablesAvailable && (
              <div className="p-4 border rounded-md">
                <h2 className="text-xl font-semibold mb-2">Available Tables</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {debugInfo.tablesAvailable.map((table: {table_name: string}, index: number) => (
                    <div key={index} className="p-2 bg-gray-100 rounded">{table.table_name}</div>
                  ))}
                </div>
              </div>
            )}

            {debugInfo?.cardsTableInfo && (
              <div className="p-4 border rounded-md">
                <h2 className="text-xl font-semibold mb-2">Cards Table Structure</h2>
                <pre className="overflow-auto p-2 bg-gray-100 rounded">{JSON.stringify(debugInfo.cardsTableInfo, null, 2)}</pre>
              </div>
            )}

            {debugInfo?.sampleCards && (
              <div className="p-4 border rounded-md">
                <h2 className="text-xl font-semibold mb-2">Sample Cards ({debugInfo.sampleCards.length})</h2>
                {debugInfo.sampleCards.length > 0 ? (
                  <pre className="overflow-auto p-2 bg-gray-100 rounded">{JSON.stringify(debugInfo.sampleCards, null, 2)}</pre>
                ) : (
                  <p>No cards found in the database.</p>
                )}
              </div>
            )}

            <div className="p-4 border rounded-md">
              <h2 className="text-xl font-semibold mb-2">Raw Debug Information</h2>
              <pre className="overflow-auto p-2 bg-gray-100 rounded">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>

            <div className="p-4 border rounded-md">
              <h2 className="text-xl font-semibold mb-2">All Cards (Regardless of Owner) - {allCards.length}</h2>
              {allCards.length > 0 ? (
                <pre className="overflow-auto p-2 bg-gray-100 rounded">{JSON.stringify(allCards, null, 2)}</pre>
              ) : (
                <p>No cards found in the database at all. You may need to create some cards first.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
} 