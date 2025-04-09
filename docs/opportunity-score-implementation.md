# Opportunity Score Implementation with Supabase Edge Functions

This document outlines the implementation of the Opportunity Score feature for the Card Profit Pro application using Supabase Edge Functions.

## Overview

The Opportunity Score is a calculated metric that helps users identify the best card investment opportunities based on various factors like price, multipliers, profit potential, and sales history. This feature enhances the Card Profit Pulse dashboard by providing a clear visual indicator of opportunity level.

## Database Implementation

A new column was added to the `ebay_card_analytics` table:

```sql
-- Add opportunity_score column to ebay_card_analytics table
ALTER TABLE ebay_card_analytics
ADD COLUMN opportunity_score FLOAT NOT NULL DEFAULT 0;

-- Create index for better performance when filtering/sorting by opportunity_score
CREATE INDEX idx_ebay_card_analytics_opportunity_score ON ebay_card_analytics(opportunity_score);
```

## Opportunity Score Calculation

The score is calculated based on multiple weighted factors:

1. **Raw Cost** (25%): Lower raw cost represents higher opportunity
2. **Net PSA 9 Profit** (20%): Potential profit from PSA 9 grading after fees
3. **PSA 10 Profit** (20%): Potential profit from PSA 10 grading
4. **PSA 10 Multiplier** (15%): The value ratio between PSA 10 and raw cards
5. **PSA 9 Multiplier** (10%): The value ratio between PSA 9 and raw cards
6. **Sales History** (10%): Volume and reliability of historical sales data

The calculation normalizes each factor to a 0-1 scale and applies the appropriate weights, resulting in a final score from 0 to 100.

## Implementation with Supabase Edge Functions

The opportunity score calculation is implemented as a Supabase Edge Function called `calculate-opportunity-score`. This function:

1. Fetches all card data from the `ebay_card_analytics` table
2. Calculates opportunity scores based on the weighted formula
3. Updates the `opportunity_score` column for each card
4. Returns a summary of processed cards and any errors

### Edge Function Code Location

The Edge Function is defined and managed in the Supabase Dashboard under Edge Functions.

### Triggering the Edge Function

There are multiple ways to trigger the Edge Function:

1. **Admin UI**: Through the admin panel at `/admin/update-opportunity-scores`
2. **Manual API Call**: By making a POST request to the Edge Function endpoint
3. **Scheduled Run**: Using external schedulers like GitHub Actions (optional)

Example API call:

```bash
curl -L -X POST 'https://clsvjpswzounfxbnftzg.supabase.co/functions/v1/calculate-opportunity-score' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsc3ZqcHN3em91bmZ4Ym5mdHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4NDkzNTUsImV4cCI6MjA1ODQyNTM1NX0.QwNl861pgu8YEDYNwLWpuk-rfjzgUnZBDU3CHIBqBGI' \
  -H 'Content-Type: application/json' \
  --data '{"name":"Functions"}'
```

## Frontend Integration

The opportunity scores are integrated into the Card Profit Pulse dashboard with:

- Color-coded circular indicators showing the score (0-100)
- Color gradient from red (0) to bright green (100)
- Opportunity filter dropdown with predefined ranges
- Default sorting by opportunity score
- Summary card displaying average opportunity score

## Opportunity Score Ranges

The scores are categorized into the following ranges:

- **Low**: 0-30
- **Moderate-Low**: 31-50
- **Moderate**: 51-70
- **Moderate-High**: 71-85
- **High**: 86-100

These categories are used for filtering in the Card Profit Pulse dashboard.

## Future Improvements

Potential future improvements to the opportunity score system:

1. User-configurable weights for different factors
2. Personal watchlist based on opportunity scores
3. Email alerts for high-opportunity cards
4. Historical tracking of opportunity score changes
5. AI-based recommendations using opportunity scores 