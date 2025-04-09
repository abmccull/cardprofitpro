'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from './types'
import { useAuth as useClerkAuth } from '@clerk/nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type SupabaseContext = {
  supabase: ReturnType<typeof createClient<Database>> | null
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth()
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient<Database>> | null>(null)

  useEffect(() => {
    // Always initialize an anonymous client for non-authenticated actions
    const initSupabase = async () => {
      // Initialize a standard client without custom auth
      const baseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      })
      
      // If not authenticated, just use the base client
      if (!isLoaded || !isSignedIn) {
        console.log('Initializing anonymous Supabase client')
        setSupabase(baseClient)
        return
      }

      try {
        // Try to get a token for authenticated access
        const token = await getToken()
        if (!token) {
          console.log('No token available, using anonymous client')
          setSupabase(baseClient)
          return
        }
        
        // Create an authenticated client with the token
        console.log('Initializing authenticated Supabase client')
        const authClient = createClient<Database>(
          supabaseUrl,
          supabaseAnonKey,
          {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        )
        
        setSupabase(authClient)
      } catch (error) {
        console.error('Error initializing Supabase client, falling back to anonymous access:', error)
        setSupabase(baseClient)
      }
    }

    initSupabase()
  }, [isLoaded, isSignedIn, getToken])

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
} 