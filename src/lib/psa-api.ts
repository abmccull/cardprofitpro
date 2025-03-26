/**
 * PSA API Service
 * Utility functions for interacting with the PSA API
 * Documentation: https://api.psacard.com/publicapi/swagger/index.html
 */

const PSA_API_BASE_URL = process.env.PSA_API_BASE_URL || 'https://api.psacard.com/publicapi';
const PSA_API_TOKEN = process.env.PSA_API_TOKEN;

/**
 * Base function for making authenticated requests to the PSA API
 */
async function psaApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${PSA_API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Authorization': `Bearer ${PSA_API_TOKEN}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PSA API error: ${response.status} ${errorText}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    console.error('PSA API request failed:', error);
    throw error;
  }
}

/**
 * Type definitions for PSA API responses
 */

export interface PSACert {
  CertNumber: string;
  CardGrade: string;
  GradeDescription: string;
  TotalPopulation: number;
  PopulationHigher: number;
  Year: string;
  Brand: string;
  Series: string;
  CardNumber: string;
  Description: string;
  SpecID: string;
}

export interface PSAPopulation {
  SpecID: string;
  PSAPop: {
    Grade10: number;
    Grade9: number;
    Grade8: number;
    Grade7: number;
    Grade6: number;
    Grade5: number;
    Grade4: number;
    Grade3: number;
    Grade2: number;
    Grade1: number;
    GradeA: number;
  };
}

export interface PSAOrderProgress {
  orderNumber: string;
  orderIsPending: boolean;
  orderInAssembly: boolean;
  orderIsInProgress: boolean;
  gradesReady: boolean;
  shipped: boolean;
  shipTrackingNumber: string;
  shipDate: string;
  estimatedCompletionDate: string;
}

export interface PSACertResponse {
  PSACert: PSACert;
  PSASpecPopulationModel?: PSAPopulation;
}

export interface PSAOrderResponse {
  OrderProgress: PSAOrderProgress;
}

/**
 * Get certification details by certification number
 */
export async function getCertificationByCertNumber(certNumber: string): Promise<PSACertResponse> {
  return psaApiRequest<PSACertResponse>(`/cert/GetByCertNumber?certNumber=${certNumber}`);
}

/**
 * Get certification details by certification number with population data
 */
export async function getCertificationWithPopulation(certNumber: string): Promise<PSACertResponse> {
  return psaApiRequest<PSACertResponse>(`/cert/GetWithPopulationByCertNumber?certNumber=${certNumber}`);
}

/**
 * Get population data by spec ID
 */
export async function getPopulationBySpecID(specID: string): Promise<PSAPopulation> {
  return psaApiRequest<PSAPopulation>(`/population/GetPopulationBySpecID?specID=${specID}`);
}

/**
 * Get population summary by spec ID
 */
export async function getPopulationSummaryBySpecID(specID: string): Promise<PSAPopulation> {
  return psaApiRequest<PSAPopulation>(`/population/GetPopulationSummaryBySpecID?specID=${specID}`);
}

/**
 * Get grading order details by order number
 */
export async function getOrderByOrderNumber(orderNumber: string): Promise<PSAOrderResponse> {
  return psaApiRequest<PSAOrderResponse>(`/order/GetByOrderNumber?orderNumber=${orderNumber}`);
}

/**
 * Get order progress by order number
 */
export async function getOrderProgressByOrderNumber(orderNumber: string): Promise<PSAOrderResponse> {
  return psaApiRequest<PSAOrderResponse>(`/order/GetProgressByOrderNumber?orderNumber=${orderNumber}`);
}

/**
 * Maps a PSA certification to our card model
 */
export function mapPSACertToCardData(cert: PSACert, population?: PSAPopulation) {
  return {
    cert_number: cert.CertNumber,
    grade: cert.CardGrade,
    grade_description: cert.GradeDescription,
    total_population: cert.TotalPopulation,
    population_higher: cert.PopulationHigher,
    spec_id: cert.SpecID,
    year: cert.Year,
    brand: cert.Brand,
    series: cert.Series,
    card_number: cert.CardNumber,
    description: cert.Description,
    psa10_count: population?.PSAPop?.Grade10 || 0,
    psa9_count: population?.PSAPop?.Grade9 || 0,
    updated_at: new Date().toISOString(),
  };
} 