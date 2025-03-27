export const SportType = {
  Baseball: 'Baseball',
  Basketball: 'Basketball',
  Football: 'Football',
  Hockey: 'Hockey',
  Pokemon: 'Pokemon',
  WNBA: 'WNBA',
} as const;

export type SportType = typeof SportType[keyof typeof SportType];

export const CardStatus = {
  Purchased: 'Purchased',
  Watchlist: 'Watchlist',
  'Sent for Grading': 'Sent for Grading',
  Listed: 'Listed',
  Sold: 'Sold',
} as const;

export type CardStatus = typeof CardStatus[keyof typeof CardStatus];

export const GradingCompany = {
  PSA: 'PSA',
  BGS: 'BGS',
  SGC: 'SGC',
  HGA: 'HGA',
  CSG: 'CSG',
} as const;

export type GradingCompany = typeof GradingCompany[keyof typeof GradingCompany];

export const CardGrade = {
  '1': '1',
  '1.5': '1.5',
  '2': '2',
  '2.5': '2.5',
  '3': '3',
  '3.5': '3.5',
  '4': '4',
  '4.5': '4.5',
  '5': '5',
  '5.5': '5.5',
  '6': '6',
  '6.5': '6.5',
  '7': '7',
  '7.5': '7.5',
  '8': '8',
  '8.5': '8.5',
  '9': '9',
  '9.5': '9.5',
  '10': '10',
} as const;

export type CardGrade = typeof CardGrade[keyof typeof CardGrade];

export type BuyingFormat = 'Auction' | 'Buy_It_Now' | 'Accepts_Offers';
export type LocationType = 'North_America' | 'US' | 'Worldwide';
export type UserRole = 'user' | 'admin' | 'va';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type DataSource = 'ebay' | 'psa' | 'other';
export type SnipeStatus = 'active' | 'processing' | 'completed' | 'error' | 'cancelled';
export type PSAOrderStatus = 'Order Received' | 'Processing' | 'Shipped' | 'Completed';

export const PurchaseSource = {
  Ebay: 'Ebay',
  Facebook: 'Facebook',
  'In-person': 'In-person',
  'Tik-Tok': 'Tik-Tok',
  Whatnot: 'Whatnot',
  Instagram: 'Instagram',
  Other: 'Other',
} as const;

export type PurchaseSource = typeof PurchaseSource[keyof typeof PurchaseSource];

export interface Database {
  public: {
    Tables: {
      sports: {
        Row: {
          sport_id: number;
          sport_name: string;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['sports']['Row'], 'sport_id'>;
        Update: Partial<Database['public']['Tables']['sports']['Row']>;
      };
      players: {
        Row: {
          player_id: number;
          sport_id: number;
          player_name: string;
          is_rookie: boolean;
          rookie_year: number | null;
          notes: string | null;
          sports: {
            sport_name: string;
          };
        };
        Insert: Omit<Database['public']['Tables']['players']['Row'], 'player_id' | 'sports'>;
        Update: Partial<Database['public']['Tables']['players']['Row']>;
      };
      products: {
        Row: {
          product_id: number;
          product_name: string;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'product_id'>;
        Update: Partial<Database['public']['Tables']['products']['Row']>;
      };
      sport_product_mapping: {
        Row: {
          mapping_id: number;
          sport_id: number;
          product_id: number;
          products: {
            product_id: number;
            product_name: string;
            notes: string | null;
          };
          sports: {
            sport_name: string;
          };
        };
        Insert: Omit<Database['public']['Tables']['sport_product_mapping']['Row'], 'mapping_id' | 'products' | 'sports'>;
        Update: Partial<Database['public']['Tables']['sport_product_mapping']['Row']>;
      };
      users: {
        Row: {
          id: string;
          clerk_id: string;
          email: string;
          role: UserRole;
          name: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      cards: {
        Row: {
          id: string;
          name: string;
          player: string | null;
          year: number | null;
          manufacturer: string | null;
          grade: CardGrade | null;
          grading_company: GradingCompany | null;
          purchase_price: number | null;
          status: CardStatus | null;
          image_url: string | null;
          owner_id: string;
          created_at: string | null;
          updated_at: string | null;
          is_graded: boolean | null;
          sport: SportType | null;
          buying_format: string | null;
          location: string | null;
          is_sold: boolean | null;
          fees: number | null;
          sales_price: number | null;
          purchase_link: string | null;
          source: PurchaseSource | null;
        };
        Insert: Omit<Database['public']['Tables']['cards']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['cards']['Row']>;
      };
      card_features: {
        Row: {
          id: string;
          name: string;
        };
        Insert: Omit<Database['public']['Tables']['card_features']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['card_features']['Row']>;
      };
      cards_to_features: {
        Row: {
          card_id: string;
          feature_id: string;
        };
        Insert: Database['public']['Tables']['cards_to_features']['Row'];
        Update: Partial<Database['public']['Tables']['cards_to_features']['Row']>;
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: TaskStatus;
          assigned_to: string;
          assigned_by: string;
          card_id: string | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Row']>;
      };
      deal_analyses: {
        Row: {
          id: string;
          card_id: string;
          predicted_grade: number;
          confidence_score: number;
          estimated_value: number;
          potential_profit: number;
          roi: number;
          user_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['deal_analyses']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['deal_analyses']['Row']>;
      };
      market_data: {
        Row: {
          id: string;
          card_name: string;
          average_price: number;
          min_price: number;
          max_price: number;
          total_sales: number;
          data_source: DataSource;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['market_data']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['market_data']['Row']>;
      };
      saved_searches: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          query: string | null;
          sport: SportType | null;
          is_graded: boolean | null;
          buying_format: BuyingFormat | null;
          location: LocationType | null;
          min_price: number | null;
          max_price: number | null;
          show_sold: boolean;
          auto_populate: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['saved_searches']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['saved_searches']['Row']>;
      };
      saved_searches_features: {
        Row: {
          saved_search_id: string;
          feature_id: string;
        };
        Insert: Database['public']['Tables']['saved_searches_features']['Row'];
        Update: Partial<Database['public']['Tables']['saved_searches_features']['Row']>;
      };
      watchlist: {
        Row: {
          id: string;
          user_id: string;
          ebay_item_id: string;
          title: string;
          price: number;
          image_url: string | null;
          listing_url: string;
          end_time: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['watchlist']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['watchlist']['Row']>;
      };
      snipes: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          item_title: string;
          current_price: number;
          max_bid: number;
          status: SnipeStatus;
          bid_strategy: 'early' | 'last';
          snipe_time_seconds: number | null;
          bid_placed_at: string | null;
          error_message: string | null;
          bid_response: any | null;
          end_time: string;
          created_at: string;
          updated_at: string;
          image_url: string | null;
          item_url: string | null;
          marketplace: string;
        };
        Insert: Omit<Database['public']['Tables']['snipes']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['snipes']['Row']>;
      };
      user_tokens: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_tokens']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_tokens']['Row']>;
      };
      card_psa_data: {
        Row: {
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
        };
        Insert: Omit<Database['public']['Tables']['card_psa_data']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['card_psa_data']['Row']>;
      };
      psa_grading_orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          status: PSAOrderStatus | null;
          cards_count: number;
          order_is_pending: boolean | null;
          order_in_assembly: boolean | null;
          order_is_in_progress: boolean | null;
          grades_ready: boolean | null;
          shipped: boolean | null;
          ship_tracking_number: string | null;
          ship_date: string | null;
          estimated_completion_date: string | null;
          last_checked: string | null;
          created_at: string;
          updated_at: string;
          received_at: string | null;
          processing_at: string | null;
          shipped_at: string | null;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['psa_grading_orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['psa_grading_orders']['Row']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      card_status: CardStatus;
      task_status: TaskStatus;
      data_source: DataSource;
      sport_type: SportType;
      buying_format: BuyingFormat;
      location_type: LocationType;
      snipe_status: SnipeStatus;
      psa_order_status: PSAOrderStatus;
    };
  };
} 