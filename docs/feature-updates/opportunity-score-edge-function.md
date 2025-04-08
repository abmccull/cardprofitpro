# Opportunity Score Edge Function Implementation

This document contains the final implementation of the Edge Function used to calculate opportunity scores for Card Profit Pro.

## Overview

The Edge Function calculates opportunity scores for cards based on a variety of factors including multipliers, potential profit, sales history, and price point. The scores are designed to reflect the investment potential of each card.

## Edge Function Code

```javascript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Calculate opportunity score based on the revised formula
function calculateOpportunityScore(card) {
  try {
    // Convert any potential string values to numbers
    const rawAvg = Number(card.raw_avg) || 0;
    const psa9Avg = card.psa_9_avg !== null ? Number(card.psa_9_avg) : null;
    const psa10Avg = Number(card.psa_10_avg) || 0;
    const rawCount = Number(card.raw_count) || 0;
    const psa9Count = Number(card.psa_9_count) || 0;
    const psa10Count = Number(card.psa_10_count) || 0;
    const psa10Multiplier = Number(card.psa_10_multiplier) || 0;
    const psa9Multiplier = card.psa_9_multiplier !== null ? Number(card.psa_9_multiplier) : 0;
    
    // For debugging - identify if we're processing the Luka card
    const isLuka = card.title && card.title.toLowerCase().includes('luka') && card.title.toLowerCase().includes('doncic');
    if (isLuka) {
      console.log("Processing Luka Doncic card:", card.id);
      console.log(`Raw: $${rawAvg}, PSA10: $${psa10Avg}, Multiplier: ${psa10Multiplier}x`);
    }

    // Skip cards with no raw value or unrealistic values
    if (rawAvg <= 0 || psa10Avg <= 0) {
      return 0;
    }

    // 1. PSA 10 Multiplier (40%)
    // More aggressive scaling - reward high multipliers more significantly
    const psa10MultTarget = 2.5;
    let psa10MultScore;
    
    if (psa10Multiplier < 1.5) {
      // Very poor multiplier
      psa10MultScore = Math.max(0, Math.min(0.2, (psa10Multiplier / 1.5) * 0.2));
    } else if (psa10Multiplier < psa10MultTarget) {
      // Below target but decent
      psa10MultScore = 0.2 + ((psa10Multiplier - 1.5) / (psa10MultTarget - 1.5)) * 0.3;
    } else if (psa10Multiplier < 4.0) {
      // Above target - good range
      psa10MultScore = 0.5 + ((psa10Multiplier - psa10MultTarget) / (4.0 - psa10MultTarget)) * 0.3;
    } else if (psa10Multiplier < 5.0) {
      // Very good multiplier
      psa10MultScore = 0.8 + ((psa10Multiplier - 4.0) / (5.0 - 4.0)) * 0.1;
    } else {
      // Exceptional multiplier (5x+)
      psa10MultScore = 0.9 + Math.min((psa10Multiplier - 5.0) / 5.0, 0.1);
    }

    // 2. PSA 9 Multiplier (15%)
    // Baseline at 1.25x, more aggressive curve
    const psa9MultTarget = 1.25;
    let psa9MultScore = 0;
    
    if (psa9Multiplier > 0) {
      if (psa9Multiplier < 1.0) {
        // No profit
        psa9MultScore = 0;
      } else if (psa9Multiplier < psa9MultTarget) {
        // Some profit but below target
        psa9MultScore = Math.max(0, Math.min(0.4, (psa9Multiplier - 1.0) / (psa9MultTarget - 1.0) * 0.4));
      } else if (psa9Multiplier < 1.75) {
        // Good multiplier
        psa9MultScore = 0.4 + ((psa9Multiplier - psa9MultTarget) / (1.75 - psa9MultTarget)) * 0.4;
      } else {
        // Excellent multiplier
        psa9MultScore = 0.8 + Math.min((psa9Multiplier - 1.75) / 1.25, 0.2);
      }
    }

    // 3. Gross Profit PSA 10 (25%)
    // More aggressive profit rewards for high profit cards
    const psa10Profit = psa10Avg - rawAvg;
    
    let psa10ProfitScore;
    if (psa10Profit <= 0) {
      psa10ProfitScore = 0;
    } else if (psa10Profit < 100) {
      // Small profit
      psa10ProfitScore = Math.min(0.25, psa10Profit / 100 * 0.25);
    } else if (psa10Profit < 500) {
      // Decent profit
      psa10ProfitScore = 0.25 + ((psa10Profit - 100) / 400) * 0.3;
    } else if (psa10Profit < 1000) {
      // Good profit
      psa10ProfitScore = 0.55 + ((psa10Profit - 500) / 500) * 0.2;
    } else if (psa10Profit < 2000) {
      // Great profit
      psa10ProfitScore = 0.75 + ((psa10Profit - 1000) / 1000) * 0.15;
    } else {
      // Exceptional profit (2000+)
      psa10ProfitScore = 0.9 + Math.min((psa10Profit - 2000) / 3000, 0.1);
    }

    // 4. Gross Profit PSA 9 (10%)
    let psa9ProfitScore = 0;
    if (psa9Avg) {
      const psa9Profit = psa9Avg - rawAvg;
      if (psa9Profit <= 0) {
        psa9ProfitScore = 0;
      } else if (psa9Profit < 50) {
        // Small profit
        psa9ProfitScore = Math.min(0.3, psa9Profit / 50 * 0.3);
      } else if (psa9Profit < 200) {
        // Decent profit
        psa9ProfitScore = 0.3 + ((psa9Profit - 50) / 150) * 0.4;
      } else if (psa9Profit < 500) {
        // Good profit
        psa9ProfitScore = 0.7 + ((psa9Profit - 200) / 300) * 0.3;
      } else {
        // Exceptional profit
        psa9ProfitScore = Math.min(1.0, 0.7 + (psa9Profit - 500) / 1000 * 0.3);
      }
    }

    // 5. Sales History Factor (5%)
    // Reward more sales history
    const totalSales = rawCount + psa9Count + psa10Count;
    const salesHistoryScore = Math.min(1, Math.max(0, (totalSales - 5) / (50 - 5)));

    // 6. Price Point Factor (5%)
    // We want to favor cards in the "sweet spot" price range
    const priceMin = 20;
    const priceIdealLow = 50;
    const priceIdealHigh = 500;
    const priceMax = 2000;
    
    let pricePointScore;
    if (rawAvg < priceMin || rawAvg > priceMax) {
      pricePointScore = 0;
    } else if (rawAvg < priceIdealLow) {
      // Ramping up to ideal range
      pricePointScore = (rawAvg - priceMin) / (priceIdealLow - priceMin);
    } else if (rawAvg <= priceIdealHigh) {
      // In the ideal range
      pricePointScore = 1;
    } else {
      // Ramping down from ideal range
      pricePointScore = 1 - Math.min(1, (rawAvg - priceIdealHigh) / (priceMax - priceIdealHigh));
    }

    // Weighted Sum with adjusted weights
    const rawScore = (
      (0.40 * psa10MultScore) +      // PSA 10 Multiplier (40%)
      (0.15 * psa9MultScore) +       // PSA 9 Multiplier (15%)
      (0.25 * psa10ProfitScore) +    // PSA 10 Profit (25%)
      (0.10 * psa9ProfitScore) +     // PSA 9 Profit (10%)
      (0.05 * salesHistoryScore) +   // Sales History (5%)
      (0.05 * pricePointScore)       // Price Point (5%)
    ) * 100;
    
    // More aggressive curve for adjusted scores
    // Make scaling non-linear to push high performers higher and low performers lower
    let adjustedScore;
    if (rawScore >= 70) {
      // Push top performers into the exceptional range (85-100)
      adjustedScore = 85 + ((rawScore - 70) / 30) * 15;
    } else if (rawScore >= 55) {
      // Strong opportunities (70-85)
      adjustedScore = 70 + ((rawScore - 55) / 15) * 15;
    } else if (rawScore >= 40) {
      // Decent opportunities (50-70)
      adjustedScore = 50 + ((rawScore - 40) / 15) * 20;
    } else if (rawScore >= 25) {
      // Poor opportunities (25-50)
      adjustedScore = 25 + ((rawScore - 25) / 15) * 25;
    } else {
      // Very poor opportunities (0-25)
      adjustedScore = (rawScore / 25) * 25;
    }

    // Debug output for Luka
    if (isLuka) {
      console.log("Luka Doncic scoring components:");
      console.log(`PSA10 Mult (40%): ${psa10MultScore * 100}%`);
      console.log(`PSA9 Mult (15%): ${psa9MultScore * 100}%`);
      console.log(`PSA10 Profit (25%): ${psa10ProfitScore * 100}%`);
      console.log(`PSA9 Profit (10%): ${psa9ProfitScore * 100}%`);
      console.log(`Sales History (5%): ${salesHistoryScore * 100}%`);
      console.log(`Price Point (5%): ${pricePointScore * 100}%`);
      console.log(`Raw Score: ${rawScore}`);
      console.log(`Adjusted Score: ${adjustedScore}`);
    }

    // Ensure the score is between 0 and 100 and round to nearest integer
    return Math.max(0, Math.min(100, Math.round(adjustedScore)));
  } catch (error) {
    console.error(`Error calculating opportunity score for card ${card.id}:`, error);
    return 0; // Return 0 as a default in case of calculation error
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Create a Supabase client with the Auth context of the function
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch all cards from the database
    const { data: cards, error: fetchError } = await supabase
      .from('ebay_card_analytics')
      .select('*');
    
    if (fetchError) {
      throw new Error(`Error fetching cards: ${fetchError.message}`);
    }
    
    if (!cards || cards.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No cards found in the database"
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          },
          status: 404
        }
      );
    }
    
    console.log(`Found ${cards.length} cards to process`);
    
    // Process cards in batches to avoid rate limits
    const batchSize = 25; // Smaller batch size for more reliability
    let processed = 0;
    let failures = 0;
    let updateErrors = [];
    let highestScore = 0;
    let highestScoreCard = null;
    
    for (let i = 0; i < cards.length; i += batchSize) {
      try {
        const batch = cards.slice(i, i + batchSize);
        
        // Calculate scores and update each card individually
        for (const card of batch) {
          try {
            const score = calculateOpportunityScore(card);
            
            // Track highest score for debugging
            if (score > highestScore) {
              highestScore = score;
              highestScoreCard = {
                id: card.id,
                title: card.title,
                score: score,
                raw_avg: card.raw_avg,
                psa10_avg: card.psa_10_avg,
                multiplier: card.psa_10_multiplier,
                profit: card.potential_profit_psa_10
              };
            }
            
            // Update ONLY the opportunity_score column using the .eq filter
            const { error: updateError } = await supabase
              .from('ebay_card_analytics')
              .update({ opportunity_score: score })
              .eq('id', card.id);
            
            if (updateError) {
              console.error(`Error updating card ${card.id}:`, updateError);
              failures++;
              updateErrors.push({
                card_id: card.id,
                error: updateError.message
              });
            } else {
              processed++;
            }
          } catch (cardError) {
            console.error(`Error processing card ${card.id}:`, cardError);
            failures++;
          }
          
          // Small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log(`Processed ${processed}/${cards.length} cards`);
      } catch (batchError) {
        console.error(`Error processing batch ${i}-${i+batchSize}:`, batchError);
        failures++;
      }
    }
    
    console.log("Highest scoring card:", highestScoreCard);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processed} cards (${failures} failures)`,
        processed,
        failures,
        highest_score: {
          card: highestScoreCard?.title || "Unknown",
          score: highestScore,
          details: highestScoreCard
        },
        errors: updateErrors.length > 0 ? updateErrors : null
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    );
  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
})
```

## Scoring Formula Explanation

The opportunity score is calculated based on six key factors:

1. **PSA 10 Multiplier (40%)**
   - Measures how much the PSA 10 price exceeds the raw card price
   - Target multiplier of 2.5x or higher
   - Scores scale exponentially below 2.5x and with diminishing returns above 2.5x

2. **PSA 9 Multiplier (15%)**
   - Measures how much the PSA 9 price exceeds the raw card price
   - Target multiplier of 1.25x or higher
   - Cards without PSA 9 data receive 0 for this component

3. **PSA 10 Profit (25%)**
   - Raw dollar amount of potential profit when grading to PSA 10
   - Higher weight given to cards with profits between $100-$2000

4. **PSA 9 Profit (10%)**
   - Raw dollar amount of potential profit when grading to PSA 9
   - Cards without PSA 9 data receive 0 for this component

5. **Sales History (5%)**
   - Rewards cards with more sales data (more reliable statistics)
   - Calculated based on total sales across raw, PSA 9 and PSA 10

6. **Price Point (5%)**
   - Rewards cards in the "sweet spot" price range of $50-$500
   - Cards under $20 or over $2000 receive 0 for this component

The raw score (0-100) is then mapped to the final opportunity score using the non-linear curve described in the code, ensuring proper distribution across the score ranges:
- 85-100: Exceptional opportunities
- 70-85: Strong opportunities
- 50-70: Decent opportunities
- 25-50: Poor opportunities
- 0-25: Very poor opportunities

## Deployment

This Edge Function is deployed to Supabase and is invoked via a POST request to:
```
https://[your-supabase-url]/functions/v1/calculate-opportunity-scores
```

## Authentication

The function uses the Supabase service role key for database access, which has unrestricted permissions. 