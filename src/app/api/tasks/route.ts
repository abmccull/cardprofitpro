import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  assigned_to: z.string().uuid('Invalid VA ID'),
  due_date: z.string().min(1, 'Due date is required'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query
    let query = supabase
      .from('tasks')
      .select(`
        *,
        va:assigned_to(name)
      `);

    // Add status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Get tasks
    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    // Transform the data to match our frontend type
    const transformedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      due_date: task.due_date,
      assigned_to: task.assigned_to,
      va_name: task.va.name,
      created_at: task.created_at,
    }));

    return NextResponse.json({ data: transformedTasks });
  } catch (error) {
    console.error('Error in tasks GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = taskSchema.parse(body);

    // Create task
    const { data: task, error } = await supabase
      .from('tasks')
      .insert([
        {
          ...validatedData,
          status: 'pending',
          created_by: session.user.id,
        },
      ])
      .select(`
        *,
        va:assigned_to(name)
      `)
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      );
    }

    // Transform the response
    const transformedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      due_date: task.due_date,
      assigned_to: task.assigned_to,
      va_name: task.va.name,
      created_at: task.created_at,
    };

    return NextResponse.json({ data: transformedTask }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in tasks POST route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const { id, ...updates } = await request.json();
    
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