import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type Task = {
  status: 'pending' | 'in_progress' | 'completed';
};

type VA = {
  id: string;
  name: string;
  email: string;
  role: 'grader' | 'lister' | 'researcher';
  tasks?: Task[];
};

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get VAs with their task counts
    const { data, error } = await supabase
      .from('vas')
      .select(`
        *,
        tasks!tasks_assigned_to_fkey (
          status
        )
      `);

    if (error) throw error;

    // Transform the data to include task counts
    const transformedData = (data as VA[]).map(va => ({
      id: va.id,
      name: va.name,
      email: va.email,
      role: va.role,
      tasks_completed: va.tasks?.filter((t: Task) => t.status === 'completed').length || 0,
      active_tasks: va.tasks?.filter((t: Task) => t.status !== 'completed').length || 0
    }));

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    console.error('Error in VAs GET route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 