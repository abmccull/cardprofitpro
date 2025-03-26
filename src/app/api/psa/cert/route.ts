import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { 
  getCertificationByCertNumber, 
  getCertificationWithPopulation,
  mapPSACertToCardData,
  PSACert,
  PSAPopulation,
  PSACertResponse
} from '@/lib/psa-api';
import type { Database } from '@/lib/supabase/types';

export async function GET(
  request: Request
) {
  try {
    // Get the cert number from query parameters
    const { searchParams } = new URL(request.url);
    const certNumber = searchParams.get('certNumber');
    const includePopulation = searchParams.get('includePopulation') === 'true';
    
    if (!certNumber) {
      return NextResponse.json(
        { error: 'Missing required parameter: certNumber' },
        { status: 400 }
      );
    }
    
    // Check for cached data first
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if we already have this cert in our database
    const { data: existingData, error: fetchError } = await supabase
      .from('card_psa_data')
      .select('*')
      .eq('cert_number', certNumber)
      .single();
    
    // If we have recent data (less than 24 hours old), use it
    if (existingData && !fetchError) {
      const updatedAt = new Date(existingData.updated_at);
      const now = new Date();
      const hoursSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate < 24) {
        return NextResponse.json({ data: existingData });
      }
    }
    
    // Fetch fresh data from PSA API
    let psaData: PSACertResponse;
    if (includePopulation) {
      psaData = await getCertificationWithPopulation(certNumber);
    } else {
      psaData = await getCertificationByCertNumber(certNumber);
    }
    
    if (!psaData || !psaData.PSACert) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      );
    }
    
    // Map PSA data to our model
    const cardData = mapPSACertToCardData(
      psaData.PSACert,
      psaData.PSASpecPopulationModel
    );
    
    // Store or update in database
    const { data: updatedData, error } = await supabase
      .from('card_psa_data')
      .upsert(cardData, { onConflict: 'cert_number' })
      .select()
      .single();
    
    if (error) {
      console.error('Error storing PSA data:', error);
      // Return the data we fetched even if storage failed
      return NextResponse.json({ data: cardData });
    }
    
    return NextResponse.json({ data: updatedData || cardData });
  } catch (error: any) {
    console.error('Error in PSA cert API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PSA certification data' },
      { status: 500 }
    );
  }
} 