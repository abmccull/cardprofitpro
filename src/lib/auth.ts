import { createClient } from './supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Database } from './supabase/types';

export type User = Database['public']['Tables']['users']['Row'];

export async function getUser() {
  const supabase = createClient();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user) {
      return null;
    }
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', session.user.id)
      .single();
    
    if (userError || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function requireUser() {
  const user = await getUser();
  
  if (!user) {
    redirect('/');
  }
  
  return user;
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  cookies().delete('supabase-auth-token');
  redirect('/');
} 