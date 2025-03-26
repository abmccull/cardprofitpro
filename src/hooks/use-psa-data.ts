'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase/types';

export interface PSACardData {
  id: string;
  cert_number: string;
  grade: string;
  grade_description: string | null;
  total_population: number | null;
  population_higher: number | null;
  spec_id: string | null;
  year: string | null;
  brand: string | null;
  series: string | null;
  card_number: string | null;
  description: string | null;
  psa10_count: number;
  psa9_count: number;
  card_id: string | null;
  created_at: string;
  updated_at: string;
}

export function usePSAData(certNumber: string | null, includePopulation: boolean = true) {
  const [data, setData] = useState<PSACardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!certNumber) {
      setData(null);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // First, try to get data from our database
        const supabase = createClientComponentClient<Database>();
        const { data: existingData, error: dbError } = await supabase
          .from('card_psa_data')
          .select('*')
          .eq('cert_number', certNumber)
          .single();

        // If we have data that's less than a day old, use it
        if (existingData && !dbError) {
          const updatedAt = new Date(existingData.updated_at);
          const now = new Date();
          const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceUpdate < 24) {
            setData(existingData as PSACardData);
            setIsLoading(false);
            return;
          }
        }

        // Otherwise fetch from API
        const response = await fetch(
          `/api/psa/cert?certNumber=${certNumber}&includePopulation=${includePopulation}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch PSA data');
        }

        const result = await response.json();
        setData(result.data as PSACardData);
      } catch (err: any) {
        console.error('Error fetching PSA data:', err);
        setError(err.message || 'Failed to fetch PSA certification data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [certNumber, includePopulation]);

  return { data, isLoading, error };
}

export function usePSAOrderTracking(orderNumber: string | null) {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTrackingNewOrder, setIsTrackingNewOrder] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) {
      setData(null);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/psa/order?orderNumber=${orderNumber}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch PSA order data');
        }

        const result = await response.json();
        setData(result.data);
      } catch (err: any) {
        console.error('Error fetching PSA order data:', err);
        setError(err.message || 'Failed to fetch PSA order data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [orderNumber]);

  const trackNewOrder = async (orderNumber: string) => {
    setIsTrackingNewOrder(true);
    setError(null);

    try {
      const response = await fetch('/api/psa/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderNumber }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to track PSA order');
      }

      const result = await response.json();
      setData(result.data);
      return result;
    } catch (err: any) {
      console.error('Error tracking PSA order:', err);
      setError(err.message || 'Failed to track PSA order');
      throw err;
    } finally {
      setIsTrackingNewOrder(false);
    }
  };

  return { data, isLoading, error, trackNewOrder, isTrackingNewOrder };
} 