import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

type Task = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to: string;
  due_date: string;
  vas?: {
    name: string;
  };
};

type TaskInput = z.infer<typeof taskSchema>;

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  assigned_to: z.string().uuid('Invalid VA ID'),
  due_date: z.string().min(1, 'Due date is required'),
});

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('tasks')
      .select(`
        *,
        vas (
          name
        )
      `);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform the data to match the expected format
    const transformedData = (data as Task[]).map(task => ({
      ...task,
      va_name: task.vas?.name || 'Unassigned'
    }));

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    console.error('Error in tasks GET route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const json = await request.json() as TaskInput;

    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title: json.title,
          description: json.description,
          assigned_to: json.assigned_to,
          due_date: json.due_date,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in tasks POST route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { id, ...updates } = await request.json() as Task & { id: string };
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select('*, users!assigned_to(name)')
      .single();
    
    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 