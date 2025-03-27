'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Database } from './types'
import { useAuth } from '@clerk/nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type SupabaseContext = {
  supabase: ReturnType<typeof createClient<Database>>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { getToken } = useAuth()
  const [supabase] = useState(() =>
    createClient<Database>(supabaseUrl, supabaseAnonKey)
  )

  useEffect(() => {
    const updateSupabaseToken = async () => {
      const token = await getToken({ template: 'supabase' })
      supabase.auth.setSession({
        access_token: token || '',
        refresh_token: '',
      })
    }

    updateSupabaseToken()
  }, [getToken, supabase])

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