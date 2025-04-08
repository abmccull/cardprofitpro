# Card Profit Pulse

Card Profit Pulse is a data-driven dashboard that helps card collectors and investors identify profitable card flipping opportunities based on eBay sales data analytics.

## Features

- **Analytics Dashboard**: Displays key metrics for cards including raw prices, PSA graded prices, and profit potential
- **Interactive Visualization**: Scatter plot showing the relationship between PSA 10 multipliers and potential profit
- **Filtering Capabilities**: Filter cards by sport category and search by card name
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Real-time Data**: Shows last updated timestamp for data freshness

## Technical Implementation

### Database Schema

The feature uses the `ebay_card_analytics` table in Supabase with the following structure:

- `id`: Unique identifier (auto-increment)
- `sport`: Sport category (e.g., "Basketball", "Football")
- `card_id`: Normalized card identifier
- `raw_avg`: Average price of raw cards
- `psa_9_avg`: Average price of PSA 9 graded cards
- `psa_10_avg`: Average price of PSA 10 graded cards
- `raw_count`: Number of raw card sales
- `psa_9_count`: Number of PSA 9 card sales
- `psa_10_count`: Number of PSA 10 card sales
- `psa_10_multiplier`: PSA 10 Avg / Raw Avg
- `psa_9_multiplier`: PSA 9 Avg / Raw Avg
- `potential_profit_psa_10`: PSA 10 Avg - Raw Avg
- `created_at`: Timestamp when the record was created
- `updated_at`: Timestamp when the record was last updated

### Component Architecture

The feature follows Next.js server component architecture:

- `page.tsx`: Server component that fetches data from Supabase
- `card-profit-pulse-client.tsx`: Client component that handles interactive UI elements
- `layout.tsx`: Layout component for consistent styling

### Libraries Used

- **Recharts**: For the interactive scatter plot visualization
- **Supabase**: For database access and querying
- **shadcn/ui**: For UI components like tables, cards, and selectors
- **TailwindCSS**: For responsive styling and layout

## Usage

The Card Profit Pulse dashboard provides collectors with actionable insights to:

1. Identify cards with high PSA 10 multipliers (raw to graded price ratio)
2. Discover cards with the highest potential profit margin from raw to graded
3. Filter by sport to focus on specific collecting interests
4. Search for specific cards to analyze their profit potential

## Future Enhancements

- Add trend charts showing price movement over time
- Implement export functionality for data analysis in external tools
- Add more detailed card information including images
- Create a notification system for high-profit opportunities

## Data Pipeline

The data for Card Profit Pulse is populated by a separate ETL process that:

1. Scrapes eBay completed sales
2. Normalizes card names and categories
3. Calculates averages and multipliers
4. Updates the `ebay_card_analytics` table in Supabase

## Security

The feature implements Row Level Security (RLS) in Supabase to ensure data is only accessible to authenticated users. 