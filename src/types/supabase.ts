export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          ebay_user_id?: string
          // Add other profile fields as needed
        }
        Insert: {
          id: string
          ebay_user_id?: string
        }
        Update: {
          id?: string
          ebay_user_id?: string
        }
      }
      tasks: {
        Row: {
          id: string
          ebay_user_id?: string
          // Add other task fields as needed
        }
        Insert: {
          id: string
          ebay_user_id?: string
        }
        Update: {
          id?: string
          ebay_user_id?: string
        }
      }
      messages: {
        Row: {
          id: string
          ebay_user_id?: string
          // Add other message fields as needed
        }
        Insert: {
          id: string
          ebay_user_id?: string
        }
        Update: {
          id?: string
          ebay_user_id?: string
        }
      }
      threads: {
        Row: {
          id: string
          ebay_user_id?: string
          // Add other thread fields as needed
        }
        Insert: {
          id: string
          ebay_user_id?: string
        }
        Update: {
          id?: string
          ebay_user_id?: string
        }
      }
      deletion_logs: {
        Row: {
          id: number
          notification_id: string
          event_date: string
          ebay_user_id: string
          ebay_username: string
          status: 'received' | 'completed' | 'failed'
          created_at: string
          completed_at: string | null
          error_message: string | null
        }
        Insert: {
          id?: number
          notification_id: string
          event_date: string
          ebay_user_id: string
          ebay_username: string
          status: 'received' | 'completed' | 'failed'
          created_at?: string
          completed_at?: string | null
          error_message?: string | null
        }
        Update: {
          id?: number
          notification_id?: string
          event_date?: string
          ebay_user_id?: string
          ebay_username?: string
          status?: 'received' | 'completed' | 'failed'
          created_at?: string
          completed_at?: string | null
          error_message?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 