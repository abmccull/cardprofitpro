import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get VAs with task counts
    const { data: vas, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        tasks!tasks_assigned_to_fkey(
          id,
          status
        )
      `)
      .eq('role', 'va');

    if (error) {
      console.error('Error fetching VAs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch VAs' },
        { status: 500 }
      );
    }

    // Transform the data to match our frontend type
    const transformedVAs = vas.map(va => ({
      id: va.id,
      name: va.name,
      email: va.email,
      role: va.role,
      tasks_completed: va.tasks?.filter(t => t.status === 'completed').length || 0,
      active_tasks: va.tasks?.filter(t => t.status !== 'completed').length || 0,
    }));

    return NextResponse.json({ data: transformedVAs });
  } catch (error) {
    console.error('Error in VAs GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 